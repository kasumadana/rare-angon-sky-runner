export class Storage {
  static getHighScore() {
    return parseInt(localStorage.getItem("ra_highscore")) || 0;
  }

  static setHighScore(score) {
    localStorage.setItem("ra_highscore", score);
  }

  static getCoins() {
    return parseInt(localStorage.getItem("ra_coins")) || 0;
  }

  static addCoins(amount) {
    const current = this.getCoins();
    localStorage.setItem("ra_coins", current + amount);
  }

  static spendCoins(amount) {
    const current = this.getCoins();
    if (current >= amount) {
      localStorage.setItem("ra_coins", current - amount);
      return true;
    }
    return false;
  }
}
