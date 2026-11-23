import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseCommand } from "../client/input.js";

describe("parseCommand", () => {
  it("maps the host start command", () => {
    const parsed = parseCommand(" start ", ["start"]);
    assert.equal(parsed.ok, true);
    assert.equal(parsed.message.type, "lobby:start");
  });

  it("maps a roll, a lock, a re-roll, and a score", () => {
    assert.deepEqual(parseCommand("r", ["roll"]).message, { type: "action:roll" });
    assert.deepEqual(parseCommand("T 3", ["toggle_lock", "reroll", "score"]).message, {
      type: "action:toggle_lock",
      index: 2,
    });
    assert.deepEqual(parseCommand("l", ["toggle_lock", "reroll", "score"]).message, {
      type: "action:reroll",
    });
    assert.deepEqual(parseCommand("s 7", ["toggle_lock", "reroll", "score"]).message, {
      type: "action:score",
      categoryKey: "threeOfAKind",
    });
  });

  it("rejects commands that are not legal in this prompt", () => {
    assert.equal(parseCommand("s 1", ["roll"]).ok, false);
    assert.equal(parseCommand("l", ["score"]).ok, false);
    assert.equal(parseCommand("s 13", ["score"]).ok, false);
    assert.equal(parseCommand("t 3", ["roll"]).ok, false);
  });
});
