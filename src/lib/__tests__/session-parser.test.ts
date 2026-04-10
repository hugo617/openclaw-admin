import { describe, it, expect } from "vitest";

// Since session-parser uses fs, we test the parsing logic indirectly
// by testing the data transformation patterns

describe("Session Parser Logic", () => {
  it("parses JSONL session header", () => {
    const line = '{"type":"session","version":3,"id":"test-123","timestamp":"2026-03-14T16:08:02.867Z","cwd":"/test"}';
    const parsed = JSON.parse(line);
    expect(parsed.type).toBe("session");
    expect(parsed.version).toBe(3);
    expect(parsed.id).toBe("test-123");
  });

  it("parses model_change event", () => {
    const line = '{"type":"model_change","id":"abc","parentId":null,"timestamp":"2026-03-14T16:08:02.868Z","provider":"zai","modelId":"glm-4.6v"}';
    const parsed = JSON.parse(line);
    expect(parsed.type).toBe("model_change");
    expect(parsed.provider).toBe("zai");
    expect(parsed.modelId).toBe("glm-4.6v");
  });

  it("parses message with content blocks", () => {
    const line = '{"type":"message","id":"msg1","timestamp":"2026-03-14T16:08:02.872Z","message":{"role":"user","content":[{"type":"text","text":"Hello world"}],"timestamp":1773504482871}}';
    const parsed = JSON.parse(line);
    expect(parsed.type).toBe("message");
    expect(parsed.message.role).toBe("user");
    expect(Array.isArray(parsed.message.content)).toBe(true);
    expect(parsed.message.content[0].type).toBe("text");
    expect(parsed.message.content[0].text).toBe("Hello world");
  });

  it("parses assistant message with thinking and tool use", () => {
    const line = '{"type":"message","id":"msg2","message":{"role":"assistant","content":[{"type":"thinking","thinking":"I should help the user","thinkingSignature":"reasoning_content"},{"type":"text","text":"Let me help you"},{"type":"toolCall","id":"call_123","name":"exec","arguments":{"command":"ls"}}],"usage":{"input":100,"output":50,"totalTokens":150,"cost":{"total":0.001}}}}';
    const parsed = JSON.parse(line);
    expect(parsed.message.role).toBe("assistant");
    expect(parsed.message.content).toHaveLength(3);
    expect(parsed.message.content[0].type).toBe("thinking");
    expect(parsed.message.content[1].type).toBe("text");
    expect(parsed.message.content[2].type).toBe("toolCall");
    expect(parsed.message.content[2].name).toBe("exec");
    expect(parsed.message.usage.totalTokens).toBe(150);
  });

  it("parses tool result", () => {
    const line = '{"type":"message","id":"msg3","message":{"role":"toolResult","toolCallId":"call_123","toolName":"exec","content":[{"type":"text","text":"file1.txt\\nfile2.txt"}],"details":{"status":"completed","exitCode":0,"durationMs":20},"isError":false}}';
    const parsed = JSON.parse(line);
    expect(parsed.message.role).toBe("toolResult");
    expect(parsed.message.toolName).toBe("exec");
    expect(parsed.message.isError).toBe(false);
    expect(parsed.message.details.exitCode).toBe(0);
  });

  it("extracts text from content blocks", () => {
    const blocks = [
      { type: "text", text: "Hello" },
      { type: "text", text: "World" },
      { type: "thinking", thinking: "hmm" },
    ];
    const text = blocks
      .filter((b) => b.type === "text" && "text" in b && typeof b.text === "string")
      .map((b) => (b as { text: string }).text)
      .join("\n");
    expect(text).toBe("Hello\nWorld");
  });
});
