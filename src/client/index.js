import net from "node:net";
import readline from "node:readline/promises";
import chalk from "chalk";
import { DEFAULT_HOST, DEFAULT_PORT } from "../shared/constants.js";
import { encode, LineBuffer, ServerMessage, ClientMessage } from "../shared/protocol.js";
import { isValidName } from "../shared/validators.js";
import { createInputGate, parseCommand, promptLabel } from "./input.js";
import { render } from "./renderer.js";

const host = process.argv[2] || DEFAULT_HOST;
const port = Number(process.argv[3] || process.env.PORT || DEFAULT_PORT);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
const gate = createInputGate(rl);

rl.on("SIGINT", () => process.exit(0));

const session = {
  playerId: null,
  state: null,
  desired: null,
  lastActions: null,
  gameOver: false,
  shuttingDown: false,
  waiter: null,
};

function notify() {
  if (!session.waiter) return;
  const resolve = session.waiter;
  session.waiter = null;
  resolve();
}

function waitForChange() {
  return new Promise((resolve) => {
    session.waiter = resolve;
  });
}

function requestPrompt(actions) {
  const key = actions.join(",");
  if (session.desired?.key === key && gate.isQuestionOpen()) return;
  session.desired = { key, actions, text: promptLabel(actions) };
  notify();
}

function clearDesired() {
  if (!session.desired) return;
  session.desired = null;
  notify();
}

function markGameOver() {
  session.gameOver = true;
  session.desired = null;
  notify();
}

async function askNickname() {
  console.log(chalk.bold.cyan("\n  GENERAL (YAHTZEE) — MULTIPLAYER\n"));
  while (true) {
    const nickname = (await gate.question(chalk.yellow("  Nickname: "))).trim();
    if (isValidName(nickname)) return nickname;
    console.log(chalk.red("  ✖ Invalid nickname. Use only letters and spaces."));
  }
}

function applyMessage(message) {
  switch (message.type) {
    case ServerMessage.WELCOME:
      session.playerId = message.playerId;
      break;
    case ServerMessage.STATE:
      applyState(message.payload);
      break;
    case ServerMessage.PROMPT:
      session.lastActions = message.actions;
      requestPrompt(message.actions);
      break;
    case ServerMessage.ERROR:
      console.log(chalk.red(`  ✖ ${message.message}`));
      restorePromptAfterError();
      break;
    case ServerMessage.REJECT:
      console.log(chalk.red(`  ✖ ${message.message}`));
      session.shuttingDown = true;
      process.exit(1);
      break;
    default:
      break;
  }
}

function applyState(payload) {
  session.state = payload;
  render(payload, { playerId: session.playerId });

  if (payload.phase === "finished" || payload.phase === "aborted") {
    markGameOver();
    return;
  }

  if (payload.phase === "lobby") {
    if (payload.hostId === session.playerId) requestPrompt(["start"]);
    else clearDesired();
    return;
  }

  if (payload.phase === "playing" && payload.turn?.playerId !== session.playerId) {
    clearDesired();
  }
}

function restorePromptAfterError() {
  if (session.gameOver || !session.state) return;
  if (session.state.phase === "lobby" && session.state.hostId === session.playerId) {
    requestPrompt(["start"]);
    return;
  }
  if (
    session.state.phase === "playing" &&
    session.state.turn?.playerId === session.playerId &&
    session.lastActions
  ) {
    requestPrompt(session.lastActions);
  }
}

async function inputLoop(socket) {
  while (!session.gameOver) {
    if (!session.desired) {
      gate.spectate();
      await waitForChange();
      continue;
    }

    const captured = session.desired;
    const answer = await gate.question(captured.text);
    if (session.gameOver) break;
    if (!session.desired || session.desired.key !== captured.key) continue;

    const parsed = parseCommand(answer, captured.actions);
    if (!parsed.ok) {
      console.log(chalk.red(`  ✖ ${parsed.error}`));
      continue;
    }

    session.desired = null;
    socket.write(encode(parsed.message));
  }

  await gate.question("\n  Press Enter to exit. ");
  session.shuttingDown = true;
  socket.end();
  rl.close();
}

async function main() {
  const nickname = await askNickname();
  const socket = net.connect({ host, port });
  socket.setEncoding("utf8");
  socket.setNoDelay(true);

  const buffer = new LineBuffer();
  socket.on("connect", () => {
    socket.write(encode({ type: ClientMessage.JOIN, nickname }));
  });

  socket.on("data", (chunk) => {
    let messages;
    try {
      messages = buffer.push(chunk);
    } catch {
      console.log(chalk.red("  ✖ The server sent an invalid message."));
      return;
    }
    for (const message of messages) applyMessage(message);
    if (gate.isQuestionOpen() && session.desired) {
      process.stdout.write(session.desired.text);
    }
  });

  socket.on("error", (err) => {
    if (session.shuttingDown) return;
    console.log(chalk.red(`\n  Could not connect to ${host}:${port} (${err.message}).`));
    process.exit(1);
  });

  socket.on("close", () => {
    if (session.shuttingDown || session.gameOver) return;
    console.log(chalk.red("\n  Disconnected from server."));
    process.exit(1);
  });

  await inputLoop(socket);
}

main();
