import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { Match } from "../server/match.js";

function seat(match, names) {
  return names.map((nickname, index) => {
    const connectionId = `c${index + 1}`;
    match.handle(connectionId, { type: "lobby:join", nickname });
    return connectionId;
  });
}

describe("Match", () => {
  it("refuses to start with a single player", () => {
    const match = new Match();
    const [host] = seat(match, ["Ana"]);
    match.drain();

    match.handle(host, { type: "lobby:start" });
    const events = match.drain();

    assert.equal(match.phase, "lobby");
    assert.equal(events[0].message.type, "game:error");
    assert.match(events[0].message.message, /2 players/);
  });

  it("lets only the host start, then ignores the other player's roll", () => {
    const match = new Match(() => 0);
    const [host, guest] = seat(match, ["Ana", "Bob"]);
    match.drain();

    match.handle(guest, { type: "lobby:start" });
    const rejected = match.drain();
    assert.equal(match.phase, "lobby");
    assert.equal(rejected[0].message.type, "game:error");

    match.handle(host, { type: "lobby:start" });
    match.drain();
    assert.equal(match.phase, "playing");
    assert.equal(match.game.getActivePlayer().name, "Ana");

    match.handle(guest, { type: "action:roll" });
    const events = match.drain();
    assert.equal(events.length, 1);
    assert.equal(events[0].target, guest);
    assert.equal(events[0].message.type, "game:error");
    assert.equal(match.game.dice, null);
    assert.equal(match.players[0].player.totalScore, 0);
  });

  it("publishes the rolled dice and the first-roll preview to every client", () => {
    const match = new Match(() => 0);
    const [host] = seat(match, ["Ana", "Bob"]);
    match.drain();
    match.handle(host, { type: "lobby:start" });
    match.drain();

    match.handle(host, { type: "action:roll" });
    const events = match.drain();
    const states = events.filter((event) => event.message.type === "game:state");
    assert.equal(states.length, 2);
    assert.deepEqual(states[0].message.payload.turn.dice, [1, 1, 1, 1, 1]);
    assert.deepEqual(states[1].message.payload.turn.dice, [1, 1, 1, 1, 1]);

    const aces = states[0].message.payload.turn.previews.find((entry) => entry.categoryKey === "aces");
    assert.equal(aces.score, 10);
    assert.ok(states[0].message.payload.turn.specials.some((combo) => combo.categoryKey === "general"));

    const snapshot = match.snapshot();
    snapshot.turn.dice[0] = 9;
    assert.equal(match.game.dice[0], 1);
  });

  it("scores on the server and passes the turn", () => {
    const match = new Match(() => 0);
    const [host] = seat(match, ["Ana", "Bob"]);
    match.drain();
    match.handle(host, { type: "lobby:start" });
    match.drain();
    match.handle(host, { type: "action:roll" });
    match.drain();
    match.handle(host, { type: "action:score", categoryKey: "aces" });

    assert.equal(match.lastAction.scored, 10);
    assert.equal(match.lastAction.bonus, true);
    assert.equal(match.players[0].player.totalScore, 10);
    assert.equal(match.game.getActivePlayer().name, "Bob");
    assert.equal(match.phase, "playing");
    assert.equal(match.game.currentRound, 1);
  });

  it("rejects a duplicate nickname, a full room, and a join after the start", () => {
    const match = new Match(() => 0);
    seat(match, ["Ana", "Bob", "Caio", "Duda"]);
    match.drain();

    match.handle("c5", { type: "lobby:join", nickname: "ana" });
    assert.equal(match.drain()[0].message.type, "system:reject");

    match.handle("c6", { type: "lobby:join", nickname: "Eva" });
    assert.match(match.drain()[0].message.message, /full/);

    match.handle("c1", { type: "lobby:start" });
    match.drain();
    match.handle("c7", { type: "lobby:join", nickname: "Eva" });
    const rejected = match.drain();
    assert.equal(rejected[0].message.type, "system:reject");
    assert.equal(match.players.length, 4);
  });

  it("passes the host seat when the host leaves the lobby", () => {
    const match = new Match();
    const [host] = seat(match, ["Ana", "Bob"]);
    match.drain();

    match.disconnect(host);
    assert.equal(match.phase, "lobby");
    assert.equal(match.players.length, 1);
    assert.equal(match.players[0].nickname, "Bob");
    assert.equal(match.players[0].isHost, true);
    assert.equal(match.snapshot().hostId, match.players[0].id);
  });

  it("drops a disconnected player and aborts when fewer than two remain", () => {
    const match = new Match(() => 0);
    const [host, guest] = seat(match, ["Ana", "Bob"]);
    match.drain();
    match.handle(host, { type: "lobby:start" });
    match.drain();
    match.handle(host, { type: "action:roll" });
    match.drain();
    match.handle(host, { type: "action:score", categoryKey: "aces" });
    match.drain();

    match.disconnect(guest);
    assert.equal(match.phase, "aborted");
    assert.equal(match.result.winnerId, null);
    assert.equal(match.result.reason, "not_enough_players");
    assert.equal(match.result.ranking.length, 1);
    assert.equal(match.result.ranking[0].nickname, "Ana");
    assert.equal(match.result.ranking[0].totalScore, 10);
  });

  it("continues with the remaining players when one of three disconnects", () => {
    const match = new Match(() => 0);
    const [host, , third] = seat(match, ["Ana", "Bob", "Caio"]);
    match.drain();
    match.handle(host, { type: "lobby:start" });
    match.drain();

    match.disconnect(third);
    assert.equal(match.phase, "playing");
    assert.deepEqual(
      match.players.map((record) => record.nickname),
      ["Ana", "Bob"],
    );
    assert.equal(match.game.getActivePlayer().name, "Ana");
    assert.equal(match.game.dice, null);
  });

  it("finishes the match and names a winner after the last score", () => {
    const match = new Match(() => 0);
    const [host] = seat(match, ["Ana", "Bob"]);
    match.drain();
    match.handle(host, { type: "lobby:start" });
    match.drain();

    match.game.currentRound = 12;
    match.game.playedThisRound.add(match.players[1].player);
    match.handle(host, { type: "action:roll" });
    match.drain();
    match.handle(host, { type: "action:score", categoryKey: "aces" });

    assert.equal(match.phase, "finished");
    assert.equal(match.result.reason, "completed");
    assert.equal(match.result.winnerId, "p1");
    assert.equal(match.result.ranking[0].totalScore, 10);
    assert.equal(match.snapshot().phase, "finished");
  });
});
