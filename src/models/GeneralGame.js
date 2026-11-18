/**
 * GeneralGame – Manages the overall game state: players, rounds, turns,
 * and winner determination.
 */
export class GeneralGame {
  constructor(players) {
    this.players = players;
    this.currentRound = 1;
    this.maxRounds = 12;
    this.roundStarterPlayer = null;
  }

  /** Returns the player whose turn it currently is. */
  getActivePlayer() {
    return this.players.find((player) => player.isActive);
  }

  /**
   * Advance to the next player's turn.
   * When all players have played, increment the round counter.
   */
  advanceTurn() {
    const currentPlayer = this.getActivePlayer();
    currentPlayer.isActive = false;

    const currentIndex = this.players.indexOf(currentPlayer);
    const isLastPlayer = currentIndex === this.players.length - 1;
    const nextPlayer = isLastPlayer
      ? this.players[0]
      : this.players[currentIndex + 1];

    // If we've come back to the round starter, a new round begins
    if (nextPlayer === this.roundStarterPlayer) {
      this.currentRound++;
    }

    nextPlayer.isActive = true;
  }

  /** Returns the player with the highest total score. */
  getWinner() {
    return this.players.reduce((best, player) =>
      player.totalScore > best.totalScore ? player : best
    );
  }

  /** Returns all players sorted by score descending. */
  getRanking() {
    return [...this.players].sort((a, b) => b.totalScore - a.totalScore);
  }

  /** Whether the game still has rounds to play. */
  isGameOver() {
    return this.currentRound > this.maxRounds;
  }
}
