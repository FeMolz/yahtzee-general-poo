import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { encode, LineBuffer } from "../shared/protocol.js";

describe("protocol", () => {
  it("encodes one JSON object per line", () => {
    const wire = encode({ type: "lobby:start" });
    assert.equal(wire.endsWith("\n"), true);
    assert.deepEqual(JSON.parse(wire), { type: "lobby:start" });
  });

  it("waits for a split line and then parses two messages from the next chunk", () => {
    const buffer = new LineBuffer();
    assert.deepEqual(buffer.push('{"type":"lobby:join","nickname":"An'), []);
    assert.ok(buffer.size() > 0);

    const messages = buffer.push('a"}\n{"type":"lobby:start"}\n');
    assert.equal(messages.length, 2);
    assert.equal(messages[0].nickname, "Ana");
    assert.equal(messages[1].type, "lobby:start");
    assert.equal(buffer.size(), 0);
  });

  it("ignores empty lines between messages", () => {
    const buffer = new LineBuffer();
    const messages = buffer.push('{"a":1}\n\n{"b":2}\n');
    assert.deepEqual(messages, [{ a: 1 }, { b: 2 }]);
  });

  it("throws when a complete line is not JSON", () => {
    const buffer = new LineBuffer();
    assert.throws(() => buffer.push("not-json\n"));
  });
});
