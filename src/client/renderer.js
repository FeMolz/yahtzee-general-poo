import chalk from "chalk";
import { CATEGORY_KEYS, CATEGORY_LABELS } from "../domain/Player.js";

/**
 * Draws the shared table from a server snapshot. The client does not score
 * or roll; every number on screen came from the server.
 */
export function render(state, viewer = {}) {
  console.clear();

  if (state.phase === "lobby") {
    renderLobby(state, viewer);
  } else if (state.phase === "finished") {
    renderFinished(state);
  } else if (state.phase === "aborted") {
    renderAborted(state);
  } else {
    renderTable(state, viewer);
  }

  const actionLine = formatLastAction(state.lastAction);
  if (actionLine && state.phase !== "finished" && state.phase !== "aborted") {
    console.log(chalk.gray(`\n  ${actionLine}`));
  }
}

export function formatLastAction(action) {
  if (!action) return null;
  const name = action.nickname;
  switch (action.type) {
    case "join":
      return `${name} joined the room.`;
    case "leave":
      return `${name} left the room.`;
    case "start":
      return `${name} started the match.`;
    case "roll":
      return `${name} rolled the dice.`;
    case "reroll":
      return `${name} re-rolled.`;
    case "toggle_lock":
      return action.locked
        ? `${name} locked die ${action.index + 1}.`
        : `${name} unlocked die ${action.index + 1}.`;
    case "score": {
      const label = CATEGORY_LABELS[action.categoryKey] ?? action.categoryKey;
      const bonus = action.bonus ? " (first-roll bonus ×2)" : "";
      return `${name} scored ${action.scored} pts in ${label}${bonus}.`;
    }
    case "disconnect":
      return `${name} disconnected and left the match.`;
    default:
      return null;
  }
}

function renderLobby(state, viewer) {
  banner("LOBBY");
  console.log(chalk.cyan("\n  Players in the room"));
  if (state.players.length === 0) {
    console.log(chalk.gray("    (empty)"));
  }
  for (const player of state.players) {
    const tags = [];
    if (player.id === state.hostId) tags.push("host");
    if (player.id === viewer.playerId) tags.push("you");
    const suffix = tags.length ? chalk.gray(` (${tags.join(", ")})`) : "";
    console.log(`    ${chalk.white(player.nickname)}${suffix}`);
  }

  const youAreHost = viewer.playerId && viewer.playerId === state.hostId;
  if (youAreHost) {
    console.log(chalk.yellow("\n  You are the host. Type start when at least 2 players are here."));
  } else {
    console.log(chalk.gray("\n  Waiting for the host to start... your keyboard is locked."));
  }
}

function renderTable(state, viewer) {
  const round = String(state.round).padStart(2, "0");
  banner(`ROUND ${round} / ${state.maxRounds}`);
  renderScoreboard(state, viewer);

  const active = state.players.find((player) => player.id === state.turn?.playerId);
  if (!active || !state.turn) {
    console.log(chalk.gray("\n  Waiting for the next turn."));
    return;
  }

  console.log(chalk.bold.blue(`\n  ─── ${active.nickname}'s turn ───`));
  renderScorecard(active, state.turn);
  renderDice(state.turn);

  const yours = viewer.playerId === active.id;
  if (!yours) {
    console.log(chalk.gray(`\n  Waiting for ${active.nickname}... your keyboard is locked.`));
  }
}

function renderScoreboard(state, viewer) {
  console.log(chalk.cyan("\n  Scoreboard"));
  for (const player of state.players) {
    const marker = player.isActive ? chalk.yellow(">") : " ";
    const you = player.id === viewer.playerId ? chalk.gray(" (you)") : "";
    const name = player.nickname.padEnd(16);
    console.log(`  ${marker} ${chalk.white(name)}${you}  ${chalk.bold.yellow(player.totalScore)} pts`);
  }
}

function renderScorecard(player, turn) {
  console.log(chalk.cyan(`\n  ┌──────────────────────────────────────────┐`));
  console.log(chalk.cyan(`  │  ${player.nickname}'s scorecard`));
  console.log(chalk.cyan(`  ├──────────────────────────────────────────┤`));

  const previews = new Map((turn.previews ?? []).map((entry) => [entry.categoryKey, entry]));
  for (let i = 0; i < CATEGORY_KEYS.length; i++) {
    const key = CATEGORY_KEYS[i];
    const label = CATEGORY_LABELS[key].padEnd(18);
    const number = chalk.gray(`${String(i + 1).padStart(2)}.`);
    const stored = player.scorecard[key];
    const preview = previews.get(key);

    let value;
    if (stored !== null && stored !== undefined) {
      value = chalk.green(`${String(stored).padStart(3)} pts`);
    } else if (preview && turn.dice) {
      value = chalk.gray(`~${String(preview.score).padStart(3)}`);
    } else {
      value = chalk.gray(" ---");
    }
    console.log(`  │  ${number} ${chalk.white(label)} ${value}`);
  }

  console.log(chalk.cyan(`  ├──────────────────────────────────────────┤`));
  console.log(chalk.cyan(`  │  TOTAL: ${chalk.bold.yellow(String(player.totalScore))} pts`));
  console.log(chalk.cyan(`  └──────────────────────────────────────────┘`));
}

function renderDice(turn) {
  if (!turn.dice) {
    console.log(chalk.gray("\n  Dice have not been rolled yet."));
    return;
  }

  console.log(`\n  Dice: ${formatDice(turn.dice, turn.locked)}`);
  console.log(chalk.gray(`  Rolls left: ${turn.rollsRemaining}`));
  const held = turn.locked
    .map((locked, index) => (locked ? index + 1 : null))
    .filter((index) => index !== null);
  if (held.length > 0) {
    console.log(chalk.yellow(`  Locked: ${held.join(", ")}`));
  }

  if (turn.specials?.length) {
    console.log(chalk.magenta("\n  Special combinations available:"));
    for (const combo of turn.specials) {
      console.log(chalk.magenta(`     ${combo.label} (s ${combo.menuNumber}) = ${combo.score} pts`));
    }
  }
}

function renderFinished(state) {
  banner("GAME OVER");
  const winner = state.players.find((player) => player.id === state.result?.winnerId);
  if (winner) {
    console.log(chalk.bold.green(`\n  ${winner.nickname} won with ${winner.totalScore} points.`));
  }
  renderRanking(state.result?.ranking ?? []);
}

function renderAborted(state) {
  banner("MATCH ENDED");
  console.log(chalk.yellow("\n  Not enough players to continue."));
  console.log(chalk.gray("  Partial scoreboard:"));
  renderRanking(state.result?.ranking ?? []);
}

function renderRanking(ranking) {
  console.log(chalk.cyan("\n  ── Final ranking ──"));
  ranking.forEach((player, index) => {
    const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "  ";
    console.log(chalk.white(`  ${medal} ${index + 1}. ${player.nickname.padEnd(16)} ${player.totalScore} pts`));
  });
}

function formatDice(dice, locked = []) {
  return dice
    .map((value, index) => {
      const token = locked[index] ? `[${value}*]` : `[${value}]`;
      return locked[index] ? chalk.bold.yellow(token) : chalk.bold.white(token);
    })
    .join(" ");
}

function banner(title) {
  console.log(chalk.bold.cyan("\n  ╔═══════════════════════════════════════╗"));
  console.log(chalk.bold.cyan(`  ║  ${title.padEnd(37)}║`));
  console.log(chalk.bold.cyan("  ╚═══════════════════════════════════════╝"));
}
