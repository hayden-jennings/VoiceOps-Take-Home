"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import type { AgentEvent, ChatMessage } from "@/lib/agentLoop";
import {
  DashboardPanel,
  DashboardInstance,
} from "@/components/dashboards/DashboardPanel";
import { NewDashboardMenu } from "@/components/dashboards/NewDashboardMenu";
import { DashboardParams } from "@/lib/dashboards/types";

type UiMessage =
  | { kind: "text"; role: "user" | "assistant"; content: string }
  | { kind: "image"; url: string; alt: string };

function ArrowUpIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  );
}

export default function Chat() {
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [statusLabel, setStatusLabel] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeDashboard, setActiveDashboard] =
    useState<DashboardInstance | null>(null);
  const [persistedDashboards, setPersistedDashboards] = useState<
    DashboardInstance[]
  >([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const wasSending = useRef(false);

  useEffect(() => {
    // proves the "come back to later" requirement: fetch whatever was
    // persisted in a prior session, not just whatever's in memory right now
    fetch("/api/dashboards")
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) setPersistedDashboards(json.data);
      });
  }, []);

  useEffect(() => {
    if (wasSending.current && !sending) {
      inputRef.current?.focus();
    }
    wasSending.current = sending;
  }, [sending]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, statusLabel]);

  async function send() {
    const question = input.trim();
    if (!question || sending) return;

    const nextMessages: UiMessage[] = [
      ...messages,
      { kind: "text", role: "user", content: question },
    ];
    setMessages(nextMessages);
    setInput("");
    setSending(true);
    setErrorMsg(null);
    setStatusLabel(null);

    const history: ChatMessage[] = nextMessages
      .filter(
        (m): m is Extract<UiMessage, { kind: "text" }> => m.kind === "text",
      )
      .map((m) => ({ role: m.role, content: m.content }));

    const openDashboards = activeDashboard
      ? [
          {
            instanceId: activeDashboard.id,
            view: activeDashboard.view,
            title: activeDashboard.title,
            params: activeDashboard.params,
          },
        ]
      : [];

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: history, openDashboards }),
    });

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let streamingReply = false;

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line) continue;
        const event: AgentEvent = JSON.parse(line);
        if (event.type === "tool_status") {
          streamingReply = false;
          setStatusLabel(event.label);
        } else if (event.type === "text") {
          setStatusLabel(null);
          if (streamingReply) {
            setMessages((prev) => {
              const last = prev[prev.length - 1];
              if (last.kind !== "text") return prev;
              return [
                ...prev.slice(0, -1),
                { ...last, content: last.content + event.text },
              ];
            });
          } else {
            streamingReply = true;
            setMessages((prev) => [
              ...prev,
              { kind: "text", role: "assistant", content: event.text },
            ]);
          }
        } else if (event.type === "image") {
          streamingReply = false;
          setStatusLabel(null);
          setMessages((prev) => [
            ...prev,
            { kind: "image", url: event.url, alt: event.alt },
          ]);
        } else if (event.type === "dashboard") {
          streamingReply = false;
          setStatusLabel(null);
          const instance: DashboardInstance = {
            id: event.instanceId,
            view: event.view,
            title: event.title,
            params: event.params,
          };
          setActiveDashboard(instance);
          setPersistedDashboards((prev) => {
            const exists = prev.some((d) => d.id === instance.id);
            return exists
              ? prev.map((d) => (d.id === instance.id ? instance : d))
              : [instance, ...prev];
          });
        } else if (event.type === "error") {
          setStatusLabel(null);
          setErrorMsg(event.message);
        }
      }
    }

    setSending(false);
    setStatusLabel(null);
  }

  function handleDashboardCreated(instance: DashboardInstance) {
    setActiveDashboard(instance);
    setPersistedDashboards((prev) => [instance, ...prev]);
  }

  function handleDashboardDeleted(id: number) {
    setPersistedDashboards((prev) => prev.filter((d) => d.id !== id));
    setActiveDashboard((prev) => (prev?.id === id ? null : prev));
  }

  async function handleDashboardParamsChange(
    id: number,
    params: DashboardParams,
  ) {
    if (!activeDashboard || activeDashboard.id !== id) return;
    // direct REST call — no LLM round-trip for a filter the user changed by hand
    const res = await fetch(`/api/dashboards/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: activeDashboard.title, params }),
    });
    const json = await res.json();
    if (json.ok) {
      setActiveDashboard((prev) =>
        prev ? { ...prev, params: json.data.params } : prev,
      );
      setPersistedDashboards((prev) =>
        prev.map((d) => (d.id === id ? { ...d, params: json.data.params } : d)),
      );
    }
  }

  async function handleDashboardTitleChange(id: number, title: string) {
    if (!activeDashboard || activeDashboard.id !== id) return;
    const res = await fetch(`/api/dashboards/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, params: activeDashboard.params }),
    });
    const json = await res.json();
    if (json.ok) {
      setActiveDashboard((prev) =>
        prev ? { ...prev, title: json.data.title } : prev,
      );
      setPersistedDashboards((prev) =>
        prev.map((d) => (d.id === id ? { ...d, title: json.data.title } : d)),
      );
    }
  }

  const inputBox = (
    <div className="relative">
      <input
        ref={inputRef}
        className="w-full rounded-xl border border-[#E3E2E8] bg-white py-3 pl-4 pr-12 text-sm text-black outline-none placeholder:text-[#8A8F8B] focus:border-[#AAAAAE]"
        placeholder="Ask something..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && send()}
        disabled={sending}
      />
      <button
        onClick={send}
        disabled={sending || !input.trim()}
        className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-xl bg-zinc-900 text-white transition-colors disabled:bg-zinc-200 disabled:text-zinc-400"
      >
        <ArrowUpIcon />
      </button>
    </div>
  );

  const typingIndicator = (
    <div className="flex items-center gap-2 pl-1 text-sm text-zinc-400">
      {statusLabel && <span>{statusLabel}</span>}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/voiceops_logo.jpeg"
        alt=""
        className={`h-5 w-5 rounded ${sending ? "logo-breathe" : "opacity-100"}`}
      />
    </div>
  );

  return (
    <div className="flex h-full flex-col bg-white">
      <style>{`
        @keyframes logoBreathe {
          0%, 100% { transform: scale(0.85); opacity: 0.4; }
          50% { transform: scale(1.00); opacity: 0.8; }
        }
        .logo-breathe { animation: logoBreathe 1.3s ease-in-out infinite; }
      `}</style>
      <header className="relative z-10 flex items-center bg-white px-6 py-4">
        <button
          onClick={() => {
            setMessages([]);
            setActiveDashboard(null);
            setErrorMsg(null);
            setInput("");
          }}
          className="flex items-center gap-2"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/voiceops-brand.webp"
            alt="VoiceOps"
            className="h-5 w-auto"
          />
          <span className="text-xl font-medium text-zinc-500 -translate-y-px">
            chatbot
          </span>
        </button>
        {/* the button itself — always rendered, never clipped, sits to the
            left of the divider (stays on the header/chat side) and rides
            along as the panel opens */}
        <div
          className={`absolute top-0 flex h-full items-center transition-[right] duration-300 ease-out ${
            activeDashboard ? "right-[calc(40vw+16px)]" : "right-6"
          }`}
        >
          <NewDashboardMenu
            persisted={persistedDashboards}
            onReopen={setActiveDashboard}
            onCreated={handleDashboardCreated}
            onDeleted={handleDashboardDeleted}
          />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* hero-vs-scrolling is driven only by whether there's a chat
              history — independent of whether a dashboard is open, so
              creating a dashboard without asking the chat anything doesn't
              collapse the default centered layout into empty blank space */}
          {messages.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center px-6">
              <div className="mb-3 flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/voiceops-brand.webp"
                  alt="VoiceOps"
                  className="h-8 w-auto"
                />
                <span className="text-3xl font-medium text-zinc-500 -translate-y-px">
                  chatbot
                </span>
              </div>
              <p className="mb-6 text-base text-zinc-500">Ask about your data</p>
              <div className="w-full max-w-2xl">{inputBox}</div>
            </div>
          ) : (
            <>
              <div className="relative flex-1 overflow-hidden">
                <div className="mr-1.5 h-full overflow-y-auto">
                  <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-8">
                    {messages.map((m, i) => {
                      if (m.kind === "image") {
                        return (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            key={i}
                            src={m.url}
                            alt={m.alt}
                            className="max-w-[85%] rounded-xl shadow-sm"
                          />
                        );
                      }
                      return m.role === "user" ? (
                        <div key={i} className="flex justify-end">
                          <div className="prose-sm max-w-[85%] rounded-xl bg-[#F1F0F5] px-4 py-2.5 text-zinc-900">
                            {m.content}
                          </div>
                        </div>
                      ) : (
                        <div
                          key={i}
                          className="prose prose-zinc prose-sm max-w-[95%] text-zinc-800"
                        >
                          <ReactMarkdown>{m.content}</ReactMarkdown>
                        </div>
                      );
                    })}
                    {typingIndicator}
                    {errorMsg && (
                      <div className="text-sm text-red-500">
                        Something went wrong: {errorMsg}
                      </div>
                    )}
                    <div ref={bottomRef} />
                  </div>
                </div>
                {/* sibling of the scrolling div, not a descendant — otherwise
                    they'd scroll away with the content instead of staying
                    pinned to the visible top/bottom edges. Inset from the
                    right so the fade doesn't sit on top of the scrollbar. */}
                <div className="pointer-events-none absolute left-0 right-4 top-0 h-10 bg-gradient-to-b from-white to-transparent" />
                <div className="pointer-events-none absolute left-0 right-4 bottom-0 h-12 bg-gradient-to-t from-white to-transparent" />
              </div>

              <div className="px-6 py-4">
                <div className="mx-auto max-w-3xl">{inputBox}</div>
              </div>
            </>
          )}
        </div>

        {/* reserves the sliding width; the actual card styling (border,
            rounded-lg on all 4 corners, shadow) lives on DashboardPanel
            itself, inset from every edge by this wrapper's padding so it
            reads as a floating card rather than a panel flush to the page */}
        <div
          className={`shrink-0 overflow-hidden transition-[width] duration-300 ease-out ${
            activeDashboard ? "w-[40vw] p-3" : "w-0"
          }`}
        >
          {activeDashboard && (
            <DashboardPanel
              dashboard={activeDashboard}
              onClose={() => setActiveDashboard(null)}
              onParamsChange={handleDashboardParamsChange}
              onTitleChange={handleDashboardTitleChange}
            />
          )}
        </div>
      </div>
    </div>
  );
}
