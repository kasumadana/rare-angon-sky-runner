import { GAME_STATE } from "../utils/Constants.js";
import { Storage } from "../utils/Storage.js";

export class UIManager {
  constructor(gameManager) {
    this.gm = gameManager;

    // Screens
    this.screens = {
      loading: document.getElementById("screen-loading"),
      menu: document.getElementById("screen-menu"),
      shop: document.getElementById("screen-shop"),
      gameover: document.getElementById("screen-gameover"),
    };

    // HUD
    this.hud = document.getElementById("ui-hud");
    this.scoreEl = document.getElementById("hud-score");
    this.coinEl = document.getElementById("hud-coin");

    this._bindEvents();
  }

  _bindEvents() {
    document.getElementById("btn-start").onclick = () =>
      this.gm.changeState(GAME_STATE.PLAYING);
    document.getElementById("btn-shop").onclick = () => this._openShop();
    document.getElementById("btn-shop-back").onclick = () =>
      this.gm.changeState(GAME_STATE.MENU);
    document.getElementById("btn-restart").onclick = () =>
      this.gm.changeState(GAME_STATE.PLAYING);
    document.getElementById("btn-menu").onclick = () =>
      this.gm.changeState(GAME_STATE.MENU);
  }

  showLoading(isLoading) {
    this.screens.loading.style.display = isLoading ? "flex" : "none";
  }

  updateUIState(state) {
    // Hide all screens first
    Object.values(this.screens).forEach((el) => (el.style.display = "none"));
    this.hud.style.display = "none";

    switch (state) {
      case GAME_STATE.MENU:
        this.screens.menu.style.display = "flex";
        // Update total coins di menu
        document.getElementById(
          "menu-coins"
        ).innerText = `KOIN: ${Storage.getCoins()}`;
        break;
      case GAME_STATE.SHOP:
        this.screens.shop.style.display = "flex";
        break;
      case GAME_STATE.PLAYING:
        this.hud.style.display = "flex";
        break;
      case GAME_STATE.GAMEOVER:
        this.screens.gameover.style.display = "flex";
        this._updateGameOverStats();
        break;
    }
  }

  updateHUD(score, coins) {
    this.scoreEl.innerText = score.toString().padStart(5, "0");
    this.coinEl.innerText = coins;
  }

  _updateGameOverStats() {
    document.getElementById("go-score").innerText = Math.floor(this.gm.score);
    document.getElementById("go-high").innerText = Storage.getHighScore();
    document.getElementById("go-coin").innerText = this.gm.coinsCollected;
  }

  _openShop() {
    this.gm.changeState(GAME_STATE.SHOP);
    const coins = Storage.getCoins();
    document.getElementById("shop-coins").innerText = coins;

    // Render item list simple
    const container = document.getElementById("shop-items");
    container.innerHTML = "";

    const items = [
      { name: "BEBEAN (Standard)", cost: 0, owned: true },
      { name: "PECUKAN (Agile)", cost: 500, owned: false },
      { name: "JANGGAN (Legend)", cost: 1000, owned: false },
    ];

    items.forEach((item) => {
      const div = document.createElement("div");
      div.className = "shop-item pixel-box";
      div.innerHTML = `
                <span>${item.name}</span>
                <button class="btn-pixel sm" ${item.owned ? "disabled" : ""}>
                    ${item.owned ? "OWNED" : item.cost + " K"}
                </button>
            `;
      container.appendChild(div);
    });
  }
}
