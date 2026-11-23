import { CATEGORY_KEYS } from "../domain/Player.js";
import { ClientMessage } from "../shared/protocol.js";
import { isValidCategoryNumber } from "../shared/validators.js";

/**
 * Reads a line only while this client is allowed to act.
 * Outside that window the stdin buffer is discarded, including a half-typed line,
 * so it cannot leak into the next prompt.
 */
export function createInputGate(rl) {
  const stdin = rl.input;
  let discarding = false;
  let questionOpen = false;

  function onDiscard(chunk) {
    const text = typeof chunk === "string" ? chunk : chunk.toString("utf8");
    if (text.includes("\u0003")) process.exit(0);
  }

  function spectate() {
    if (questionOpen || discarding) return;
    discarding = true;
    rl.pause();
    if (stdin.isTTY && typeof stdin.setRawMode === "function") {
      stdin.setRawMode(true);
    }
    stdin.resume();
    stdin.on("data", onDiscard);
  }

  function releaseRaw() {
    if (!discarding) return;
    stdin.off("data", onDiscard);
    if (stdin.isTTY && typeof stdin.setRawMode === "function") {
      stdin.setRawMode(false);
    }
    stdin.pause();
    while (stdin.read() !== null) {
      // Drop keystrokes typed while the player was spectating.
    }
    discarding = false;
    rl.resume();
  }

  async function question(text) {
    releaseRaw();
    questionOpen = true;
    try {
      return await rl.question(text);
    } finally {
      questionOpen = false;
    }
  }

  return {
    spectate,
    question,
    releaseRaw,
    isQuestionOpen: () => questionOpen,
  };
}

/** Prompt printed when the server opens this client's turn. */
export function promptLabel(actions) {
  if (actions.includes("start")) {
    return "\n  Type start when everyone is here: ";
  }
  if (actions.length === 1 && actions[0] === "roll") {
    return "\n  Your turn.\n  r        roll all five dice\n  > ";
  }
  if (actions.includes("score") && !actions.includes("reroll")) {
    return "\n  No rolls left.\n  s <1-12> score a category\n  > ";
  }
  return "\n  t <1-5>  lock or unlock a die\n  l        re-roll unlocked dice\n  s <1-12> score a category\n  > ";
}

/**
 * Turns a local command into a server message.
 * Invalid text never leaves the client.
 */
export function parseCommand(input, actions) {
  const text = input.trim().toLowerCase();
  const allowed = new Set(actions);

  if (allowed.has("start")) {
    if (text === "start") return ok({ type: ClientMessage.START });
    return fail("Type start to begin the match.");
  }

  if (text === "r" && allowed.has("roll") && allowed.size === 1) {
    return ok({ type: ClientMessage.ROLL });
  }

  if (text === "l") {
    if (!allowed.has("reroll")) return fail("You cannot re-roll right now.");
    return ok({ type: ClientMessage.REROLL });
  }

  const lock = /^t\s+([1-5])$/.exec(text);
  if (lock) {
    if (!allowed.has("toggle_lock")) return fail("You cannot lock dice right now.");
    return ok({
      type: ClientMessage.TOGGLE_LOCK,
      index: Number(lock[1]) - 1,
    });
  }

  const score = /^s\s+(\d+)$/.exec(text);
  if (score) {
    if (!allowed.has("score")) return fail("You cannot score right now.");
    if (!isValidCategoryNumber(score[1], CATEGORY_KEYS.length)) {
      return fail(`Enter a category from 1 to ${CATEGORY_KEYS.length}.`);
    }
    return ok({
      type: ClientMessage.SCORE,
      categoryKey: CATEGORY_KEYS[Number(score[1]) - 1],
    });
  }

  if (allowed.size === 1 && allowed.has("roll")) return fail("Type r to roll the dice.");
  if (allowed.size === 1 && allowed.has("score")) {
    return fail("Type s and a category number, for example s 7.");
  }
  return fail("Use t <1-5>, l, or s <1-12>.");
}

function ok(message) {
  return { ok: true, message };
}

function fail(error) {
  return { ok: false, error };
}
