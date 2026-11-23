export const ClientMessage = {
  JOIN: "lobby:join",
  START: "lobby:start",
  ROLL: "action:roll",
  TOGGLE_LOCK: "action:toggle_lock",
  REROLL: "action:reroll",
  SCORE: "action:score",
};

export const ServerMessage = {
  WELCOME: "lobby:welcome",
  STATE: "game:state",
  PROMPT: "turn:prompt",
  ERROR: "game:error",
  REJECT: "system:reject",
};

const MAX_BUFFER = 65_536;

/** Encodes one message as a single NDJSON line. */
export function encode(message) {
  return `${JSON.stringify(message)}\n`;
}

/**
 * Collects socket chunks and emits one parsed object per complete line.
 * A chunk may contain a partial line, several lines, or both.
 */
export class LineBuffer {
  constructor() {
    this.buf = "";
  }

  size() {
    return this.buf.length;
  }

  push(chunk) {
    this.buf += typeof chunk === "string" ? chunk : chunk.toString();
    if (this.buf.length > MAX_BUFFER) {
      this.buf = "";
      throw new Error("Message too large.");
    }

    const lines = this.buf.split("\n");
    this.buf = lines.pop() ?? "";

    const messages = [];
    for (const line of lines) {
      if (line.trim() === "") continue;
      messages.push(JSON.parse(line));
    }
    return messages;
  }
}
