import chalk from "chalk";
import * as readline from "node:readline/promises";
import { setupPlayers, playTurn } from "./cli/terminal.js";
import { Player } from "./models/Player.js";
import { GeneralGame } from "./models/GeneralGame.js";
import { pickRandomPlayer } from "./utils/helpers.js";

/**
 * Main entry point – Runs the full General (Yahtzee) game loop in the CLI.
 */
async function startGame() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log(chalk.bold.cyan("\n  ╔═══════════════════════════════════════╗"));
  console.log(chalk.bold.cyan("  ║   🎲  WELCOME TO GENERAL (YAHTZEE)   ║"));
  console.log(chalk.bold.cyan("  ╚═══════════════════════════════════════╝\n"));

  // 1. Setup players
  const playerNames = await setupPlayers(rl);

  const players = playerNames.map((name) => new Player(name));
  const game = new GeneralGame(players);

  console.log(chalk.green("\n  Game started with:"));
  players.forEach((p, i) => console.log(chalk.white(`    ${i + 1}. ${p.name}`)));

  // 2. Pick a random starting player
  const startingPlayer = pickRandomPlayer(players);
  game.roundStarterPlayer = startingPlayer;
  startingPlayer.isActive = true;
  console.log(chalk.yellow(`\n  🎯 ${startingPlayer.name} goes first!\n`));

  // 3. Game loop
  while (!game.isGameOver()) {
    console.log(chalk.bold.cyan(`\n  ╔═══════════════════════════════════════╗`));
    console.log(chalk.bold.cyan(`  ║   ROUND ${game.currentRound.toString().padStart(2)} OF ${game.maxRounds}                    ║`));
    console.log(chalk.bold.cyan(`  ╚═══════════════════════════════════════╝`));

    const activePlayer = game.getActivePlayer();
    await playTurn(activePlayer, rl);
    game.advanceTurn();
  }

  // 4. Game over – show results
  const winner = game.getWinner();
  const ranking = game.getRanking();

  console.log(chalk.bold.yellow("\n  ╔═══════════════════════════════════════╗"));
  console.log(chalk.bold.yellow("  ║         🏆  GAME OVER!  🏆           ║"));
  console.log(chalk.bold.yellow("  ╚═══════════════════════════════════════╝"));

  console.log(chalk.bold.green(`\n  Congratulations, ${winner.name}!`));
  console.log(chalk.bold.green(`  You won with ${winner.totalScore} points!\n`));

  console.log(chalk.cyan("  ── Final Ranking ──"));
  ranking.forEach((player, index) => {
    const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "  ";
    console.log(chalk.white(`  ${medal} ${index + 1}. ${player.name.padEnd(15)} ${player.totalScore} pts`));
  });
  console.log("");

  rl.close();
}

startGame();
