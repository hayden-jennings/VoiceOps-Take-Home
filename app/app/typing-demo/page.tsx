// Temporary exploration page — not part of the app, delete once a style is picked.

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-6 border-b border-zinc-100 py-6">
      <div className="w-48 shrink-0 text-sm text-zinc-500">{label}</div>
      <div className="flex h-6 items-center">{children}</div>
    </div>
  );
}

export default function TypingDemo() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="mb-2 text-xl font-semibold text-zinc-900">
        Typing indicator options
      </h1>
      <p className="mb-8 text-sm text-zinc-500">
        All animating continuously so you can compare motion. Current app uses
        &ldquo;Bouncing dots&rdquo;.
      </p>

      <Row label="1. Bouncing dots (current)">
        <div className="flex gap-1">
          {[0, 150, 300].map((d) => (
            <span
              key={d}
              className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400"
              style={{ animationDelay: `${d}ms` }}
            />
          ))}
        </div>
      </Row>

      <Row label="2. Pulsing/fading dots">
        <div className="flex gap-1">
          {[0, 200, 400].map((d) => (
            <span
              key={d}
              className="h-1.5 w-1.5 animate-pulse rounded-full bg-zinc-400"
              style={{ animationDelay: `${d}ms` }}
            />
          ))}
        </div>
      </Row>

      <Row label="3. Breathing dot">
        <span className="dot-breathe h-2.5 w-2.5 rounded-full bg-zinc-400" />
      </Row>

      <Row label="4. Blinking cursor">
        <span className="cursor-blink h-4 w-[2px] bg-zinc-500" />
      </Row>

      <Row label="5. Shimmer bar">
        <div className="shimmer-track h-1.5 w-24 overflow-hidden rounded-full bg-zinc-100">
          <div className="shimmer-sweep h-full w-8 rounded-full bg-zinc-400" />
        </div>
      </Row>

      <Row label="6. Wave dots (staggered scale)">
        <div className="flex items-center gap-1">
          {[0, 120, 240].map((d) => (
            <span
              key={d}
              className="wave-dot h-1.5 w-1.5 rounded-full bg-zinc-400"
              style={{ animationDelay: `${d}ms` }}
            />
          ))}
        </div>
      </Row>

      <style>{`
        @keyframes breathe {
          0%, 100% { transform: scale(0.7); opacity: 0.4; }
          50% { transform: scale(1.15); opacity: 1; }
        }
        .dot-breathe { animation: breathe 1.2s ease-in-out infinite; }

        @keyframes blink {
          0%, 45% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
        .cursor-blink { animation: blink 1s step-end infinite; }

        .shimmer-track { position: relative; }
        @keyframes sweep {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(220%); }
        }
        .shimmer-sweep { animation: sweep 1.1s ease-in-out infinite; opacity: 0.7; }

        @keyframes wave {
          0%, 60%, 100% { transform: scale(1); }
          30% { transform: scale(1.8); }
        }
        .wave-dot { animation: wave 1.1s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
