const res = await fetch("http://localhost:3000/api/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    messages: [{ role: "user", content: "How is Sarah doing this month?" }],
  }),
});

const reader = res.body.getReader();
const decoder = new TextDecoder();
let buffer = "";
const start = Date.now();
let textEventCount = 0;

while (true) {
  const { value, done } = await reader.read();
  if (done) break;
  buffer += decoder.decode(value, { stream: true });
  const lines = buffer.split("\n");
  buffer = lines.pop() ?? "";
  for (const line of lines) {
    if (!line) continue;
    const event = JSON.parse(line);
    const t = Date.now() - start;
    if (event.type === "text") {
      textEventCount++;
      console.log(`[+${t}ms] text chunk #${textEventCount}: ${JSON.stringify(event.text)}`);
    } else {
      console.log(`[+${t}ms] ${event.type}${event.label ? ": " + event.label : ""}`);
    }
  }
}
console.log(`\nTotal text chunks: ${textEventCount}`);
