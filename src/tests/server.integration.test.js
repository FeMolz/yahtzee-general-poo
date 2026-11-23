import { once } from "node:events";
import net from "node:net";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createGameServer } from "../server/socket.js";
import { encode, LineBuffer } from "../shared/protocol.js";

describe("TCP server", () => {
  it("shows both clients the same dice and the scored total", async () => {
    const server = createGameServer({ rng: () => 0 });
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    const { port } = server.address();

    const ana = openClient(port);
    const bob = openClient(port);

    try {
      await once(ana.socket, "connect");
      await once(bob.socket, "connect");

      ana.socket.write(encode({ type: "lobby:join", nickname: "Ana" }));
      bob.socket.write(encode({ type: "lobby:join", nickname: "Bob" }));

      await waitFor(
        ana.messages,
        (message) =>
          message.type === "game:state" &&
          message.payload.phase === "lobby" &&
          message.payload.players.length === 2,
      );

      const welcome = ana.messages.find((message) => message.type === "lobby:welcome");
      assert.equal(welcome.isHost, true);

      ana.socket.write(encode({ type: "lobby:start" }));
      await waitFor(
        ana.messages,
        (message) => message.type === "turn:prompt" && message.actions[0] === "roll",
      );
      await waitFor(
        bob.messages,
        (message) =>
          message.type === "game:state" &&
          message.payload.phase === "playing" &&
          message.payload.turn.dice === null,
      );

      ana.socket.write(encode({ type: "action:roll" }));
      const bobSawDice = await waitFor(
        bob.messages,
        (message) => message.type === "game:state" && message.payload.turn?.dice?.length === 5,
      );
      const anaSawDice = await waitFor(
        ana.messages,
        (message) => message.type === "game:state" && message.payload.turn?.dice?.length === 5,
      );
      assert.deepEqual(bobSawDice.payload.turn.dice, [1, 1, 1, 1, 1]);
      assert.deepEqual(anaSawDice.payload.turn.dice, bobSawDice.payload.turn.dice);

      await waitFor(
        ana.messages,
        (message) => message.type === "turn:prompt" && message.actions.includes("score"),
      );
      ana.socket.write(encode({ type: "action:score", categoryKey: "aces" }));

      const scored = await waitFor(
        bob.messages,
        (message) =>
          message.type === "game:state" &&
          message.payload.players.some((player) => player.nickname === "Ana" && player.totalScore === 10),
      );
      assert.equal(scored.payload.turn.playerId, scored.payload.players.find((player) => player.nickname === "Bob").id);
      assert.equal(scored.payload.lastAction.bonus, true);
    } finally {
      ana.socket.destroy();
      bob.socket.destroy();
      await new Promise((resolve) => server.close(resolve));
    }
  });
});

function openClient(port) {
  const socket = net.connect({ host: "127.0.0.1", port });
  socket.setEncoding("utf8");
  const messages = [];
  const buffer = new LineBuffer();
  socket.on("data", (chunk) => {
    messages.push(...buffer.push(chunk));
  });
  socket.on("error", () => {});
  return { socket, messages };
}

function waitFor(messages, predicate) {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const timer = setInterval(() => {
      const found = messages.find(predicate);
      if (found) {
        clearInterval(timer);
        resolve(found);
      } else if (Date.now() - started > 2000) {
        clearInterval(timer);
        reject(new Error(`Timed out. Last messages: ${JSON.stringify(messages.slice(-5))}`));
      }
    }, 10);
  });
}
