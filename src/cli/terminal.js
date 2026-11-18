import chalk from "chalk";
import { CATEGORY_KEYS, CATEGORY_LABELS } from "../models/Player.js";
import { detectSpecialCombinations, rerollDice, rollAllDice } from "../utils/helpers.js";
import { isValidName, isValidDiceSelection, isValidCategoryNumber } from "../utils/validators.js";

// ── Constants ───────────────────────────────────────────────────────

const MIN_PLAYERS = 2;
const MAX_PLAYERS = 4;

// ── Helper: Prompt with validation loop ─────────────────────────────

/**
 * Repeatedly prompts the user until a valid answer is given.
 *
 * @param {readline.Interface} rl        – readline interface.
 * @param {string}             question  – The prompt text.
 * @param {Function}           validator – Returns true if input is valid.
 * @param {string}             errorMsg  – Shown when validation fails.
 * @returns {Promise<string>} The validated input (trimmed).
 */
async function promptUntilValid(rl, question, validator, errorMsg) {
  while (true) {
    const answer = (await rl.question(question)).trim();
    if (validator(answer)) {
      return answer;
    }
    console.log(chalk.red(`  ✖ ${errorMsg}`));
  }
}

// ── Player Setup ────────────────────────────────────────────────────

/**
 * Interactively collects player names from the terminal.
 * Enforces min/max player count and name uniqueness.
 *
 * @param {readline.Interface} rl
 * @returns {Promise<string[]>} Array of validated player names.
 */
export async function setupPlayers(rl) {
  console.log(chalk.cyan(`\n  Enter the players' names (${MIN_PLAYERS} to ${MAX_PLAYERS} players).`));
  console.log(chalk.gray(`  Type "done" after adding at least ${MIN_PLAYERS} players to start.\n`));

  const names = [];

  while (names.length < MAX_PLAYERS) {
    const playerNumber = names.length + 1;
    const prompt = chalk.yellow(`  Player ${playerNumber} name: `);
    const input = (await rl.question(prompt)).trim();

    // Handle "done" command
    if (input.toLowerCase() === "done") {
      if (names.length >= MIN_PLAYERS) {
        break;
      }
      console.log(chalk.red(`  ✖ You need at least ${MIN_PLAYERS} players to start.`));
      continue;
    }

    // Validate name
    if (!isValidName(input)) {
      console.log(chalk.red("  ✖ Invalid name. Use only letters and spaces."));
      continue;
    }

    // Check for duplicate names
    if (names.some((n) => n.toLowerCase() === input.toLowerCase())) {
      console.log(chalk.red("  ✖ This name is already taken. Choose a different one."));
      continue;
    }

    names.push(input);
    console.log(chalk.green(`  ✔ ${input} added!`));

    if (names.length === MAX_PLAYERS) {
      console.log(chalk.cyan(`\n  Maximum of ${MAX_PLAYERS} players reached. Starting the game!`));
    }
  }

  return names;
}

// ── Display Helpers ─────────────────────────────────────────────────

/**
 * Formats the dice as a visual string with colored numbers.
 */
function formatDice(dice) {
  return dice.map((d) => chalk.bold.white(` [${d}] `)).join("");
}

/**
 * Displays the player's current scorecard.
 */
function displayScorecard(player) {
  console.log(chalk.cyan(`\n  ┌──────────────────────────────────────┐`));
  console.log(chalk.cyan(`  │  📋 ${player.name}'s Scorecard`));
  console.log(chalk.cyan(`  ├──────────────────────────────────────┤`));

  for (let i = 0; i < CATEGORY_KEYS.length; i++) {
    const key = CATEGORY_KEYS[i];
    const label = CATEGORY_LABELS[key];
    const value = player.scorecard[key];
    const number = chalk.gray(`${(i + 1).toString().padStart(2)}.`);

    if (value === null) {
      console.log(`  │  ${number} ${chalk.white(label.padEnd(20))} ${chalk.gray("---")}`);
    } else {
      console.log(`  │  ${number} ${chalk.white(label.padEnd(20))} ${chalk.green(value.toString().padStart(3))} pts`);
    }
  }

  console.log(chalk.cyan(`  ├──────────────────────────────────────┤`));
  console.log(chalk.cyan(`  │  TOTAL: ${chalk.bold.yellow(player.totalScore.toString())} pts`));
  console.log(chalk.cyan(`  └──────────────────────────────────────┘`));
}

/**
 * Displays detected special combinations available to score.
 */
function displayDetectedCombinations(combinations) {
  if (combinations.length === 0) return;

  console.log(chalk.magenta("\n  ⚡ Special combinations detected:"));
  for (const combo of combinations) {
    console.log(chalk.magenta(`     → ${combo.label} (option ${combo.menuNumber}) = ${combo.score} pts`));
  }
}

// ── Turn Logic ──────────────────────────────────────────────────────

/**
 * Runs a full turn for one player: roll dice, optionally re-roll,
 * then pick a category to score.
 *
 * @param {Player}             player – The active player.
 * @param {readline.Interface} rl     – readline interface.
 */
export async function playTurn(player, rl) {
  console.log(chalk.bold.blue(`\n  ─── ${player.name}'s Turn ───`));
  console.log(chalk.gray(`  Rolls remaining: ${player.rollsRemaining}`));

  // Initial roll
  let currentDice = rollAllDice();
  player.useRoll();

  console.log(chalk.white(`\n  🎲 Roll result: ${formatDice(currentDice)}`));
  console.log(chalk.gray(`  Rolls remaining: ${player.rollsRemaining}`));

  // Detect special combinations
  let specials = detectSpecialCombinations(currentDice, player.scorecard);
  displayDetectedCombinations(specials);

  // Re-roll phase (up to 2 more times)
  while (player.canRoll()) {
    console.log(chalk.yellow("\n  What would you like to do?"));
    console.log(chalk.white("    1) Score with current dice"));
    console.log(chalk.white("    2) Re-roll some dice"));

    const choice = await promptUntilValid(
      rl,
      chalk.yellow("  Choose (1 or 2): "),
      (input) => /^[12]$/.test(input),
      "Please enter 1 or 2."
    );

    if (choice === "1") {
      break; // Go straight to scoring
    }

    // Ask which dice to keep
    console.log(chalk.gray("\n  Current dice: " + formatDice(currentDice)));
    console.log(chalk.gray("  Enter the VALUES of dice you want to KEEP (separated by spaces)."));
    console.log(chalk.gray("  Example: to keep a 3 and two 5s, type: 3 5 5"));
    console.log(chalk.gray("  Press Enter with no input to re-roll ALL dice."));

    const keepInput = await promptUntilValid(
      rl,
      chalk.yellow("  Dice to keep: "),
      (input) => isValidDiceSelection(input),
      "Invalid input. Enter dice values (1-6) separated by spaces."
    );

    const diceToKeep = keepInput === ""
      ? []
      : keepInput.split(/\s+/).map(Number);

    const result = rerollDice(currentDice, diceToKeep);
    currentDice = result.finalDice;
    player.useRoll();

    if (result.kept.length > 0) {
      console.log(chalk.gray(`  Kept: ${formatDice(result.kept)}`));
    }
    console.log(chalk.white(`  🎲 New roll: ${formatDice(currentDice)}`));
    console.log(chalk.gray(`  Rolls remaining: ${player.rollsRemaining}`));

    specials = detectSpecialCombinations(currentDice, player.scorecard);
    displayDetectedCombinations(specials);
  }

  // Scoring phase
  await scoreCategory(player, currentDice, rl);
}

/**
 * Lets the player choose a category to score.
 */
async function scoreCategory(player, dice, rl) {
  displayScorecard(player);
  console.log(chalk.white(`\n  Final dice: ${formatDice(dice)}`));

  const availableCategories = player.getAvailableCategories();

  console.log(chalk.yellow("\n  Choose a category to score:"));
  for (const key of availableCategories) {
    const index = CATEGORY_KEYS.indexOf(key) + 1;
    console.log(chalk.white(`    ${index}) ${CATEGORY_LABELS[key]}`));
  }

  while (true) {
    const input = await promptUntilValid(
      rl,
      chalk.yellow("  Category number: "),
      (val) => isValidCategoryNumber(val, CATEGORY_KEYS.length),
      `Enter a number between 1 and ${CATEGORY_KEYS.length}.`
    );

    const chosenIndex = parseInt(input, 10) - 1;
    const chosenKey = CATEGORY_KEYS[chosenIndex];

    if (player.scorecard[chosenKey] !== null) {
      console.log(chalk.red(`  ✖ "${CATEGORY_LABELS[chosenKey]}" is already filled. Pick another.`));
      continue;
    }

    const success = player.fillCategory(chosenKey, dice);
    if (success) {
      const scored = player.scorecard[chosenKey];
      const bonusTag = player.rollsRemaining === 2 ? chalk.magenta(" (First-roll bonus! ×2)") : "";
      console.log(chalk.green(`\n  ✔ Scored ${scored} pts in "${CATEGORY_LABELS[chosenKey]}"!${bonusTag}`));
      console.log(chalk.cyan(`  Total score: ${player.totalScore} pts`));
      break;
    }
  }

  player.resetRolls();
}
