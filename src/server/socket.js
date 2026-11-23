import net from "node:net";
import { Match } from "./match.js";
import { encode, LineBuffer, ServerMessage } from "../shared/protocol.js";

/**
 * TCP server. Each socket is framed as newline-delimited JSON and applied
 * to the single authoritative Match.
 */
export function createGameServer(options = {}) {
  const match = options.match ?? new Match(options.rng);
  const senders = new Map();
  let seq = 1;

  const server = net.createServer((socket) => {
    const connectionId = `c${seq++}`;
    const buffer = new LineBuffer();
    let dropped = false;

    socket.setEncoding("utf8");
    socket.setNoDelay(true);
    senders.set(connectionId, (message) => {
      if (!socket.destroyed) socket.write(encode(message));
    });

    const flush = () => {
      for (const event of match.drain()) {
        const send = senders.get(event.target);
        if (send) send(event.message);
      }
    };

    socket.on("data", (chunk) => {
      let messages;
      try {
        messages = buffer.push(chunk);
      } catch {
        senders.get(connectionId)?.({
          type: ServerMessage.ERROR,
          message: "Invalid message.",
        });
        return;
      }

      for (const message of messages) {
        match.handle(connectionId, message);
        flush();
      }
    });

    const drop = () => {
      if (dropped) return;
      dropped = true;
      senders.delete(connectionId);
      match.disconnect(connectionId);
      flush();
    };

    socket.on("close", drop);
    socket.on("error", () => socket.destroy());
  });

  return server;
}
