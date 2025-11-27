import {
  GAME_STATE,
  CONFIG,
  OBSTACLE_TYPE,
  PALETTE,
} from "../utils/Constants.js";
import { Player } from "../entities/Player.js";
import { Obstacle } from "../entities/Obstacle.js";
import { Coin } from "../entities/Coin.js";
import { InputHandler } from "./InputHandler.js";
import { UIManager } from "../ui/UIManager.js";
import { AssetLoader } from "./AssetLoader.js";
import { Storage } from "../utils/Storage.js";

export class GameManager {
  constructor() {
    if (GameManager.instance) return GameManager.instance;
    GameManager.instance = this;

    this.canvas = document.getElementById("gameCanvas");
    this.ctx = this.canvas.getContext("2d");

    this.currentState = GAME_STATE.LOADING;
    this.score = 0;
    this.coinsCollected = 0;

    this.player = null;
    this.obstacles = [];
    this.coins = [];

    this.gameSpeed = CONFIG.BASE_SPEED;
    this.timers = { spawn: 0, coinSpawn: 0 };

    this.assetLoader = new AssetLoader();
    this.uiManager = new UIManager(this);
    this.inputHandler = new InputHandler(this);

    this.loop = this.loop.bind(this);
  }

  async init() {
    this.resize();
    window.addEventListener("resize", () => this.resize());

    this.uiManager.showLoading(true);

    // Load Assets & AI
    await this.assetLoader.loadAll();
    await this.inputHandler.init();

    this.uiManager.showLoading(false);
    this.changeState(GAME_STATE.MENU);

    requestAnimationFrame(this.loop);
  }

  resize() {
    this.canvas.width = this.canvas.clientWidth;
    this.canvas.height = this.canvas.clientHeight;
    const debugCanvas = document.getElementById("debugCanvas");
    if (debugCanvas) {
      debugCanvas.width = this.canvas.clientWidth;
      debugCanvas.height = this.canvas.clientHeight;
    }
  }

  changeState(newState) {
    this.currentState = newState;
    this.uiManager.updateUIState(newState);

    if (newState === GAME_STATE.PLAYING) {
      this.resetGame();
    }
  }

  resetGame() {
    this.score = 0;
    this.coinsCollected = 0;
    this.gameSpeed = CONFIG.BASE_SPEED;
    this.obstacles = [];
    this.coins = [];
    this.player = new Player();
    this.timers = { spawn: 0, coinSpawn: 0 };
  }

  loop(timestamp) {
    if (!this.lastTime) this.lastTime = timestamp;
    const dt = (timestamp - this.lastTime) / 1000;
    this.lastTime = timestamp;

    this.update(dt);
    this.draw();

    requestAnimationFrame(this.loop);
  }

  update(dt) {
    if (this.currentState !== GAME_STATE.PLAYING) return;

    // 1. Difficulty Scaling
    this.gameSpeed += dt * 2;
    this.score += this.gameSpeed * dt * 0.05;

    // 2. Player
    this.player.update(dt);

    // 3. Spawners
    this.timers.spawn += dt;
    if (
      this.timers.spawn >
      CONFIG.SPAWN_RATE * (CONFIG.BASE_SPEED / this.gameSpeed)
    ) {
      this.timers.spawn = 0;
      const lane = Math.floor(Math.random() * 3);
      const type =
        Math.random() > 0.7 ? OBSTACLE_TYPE.DRONE : OBSTACLE_TYPE.BIRD;
      this.obstacles.push(new Obstacle(lane, this.gameSpeed, type));
    }

    this.timers.coinSpawn += dt;
    if (this.timers.coinSpawn > 2.5) {
      this.timers.coinSpawn = 0;
      const lane = Math.floor(Math.random() * 3);
      this.coins.push(new Coin(lane, this.gameSpeed));
    }

    // 4. Update Objects
    this.obstacles.forEach((obs, i) => {
      obs.update(dt);
      if (obs.checkCollision(this.player)) {
        this.handleGameOver();
      }
      if (obs.markedForDeletion) this.obstacles.splice(i, 1);
    });

    this.coins.forEach((coin, i) => {
      coin.update(dt);
      if (coin.checkCollision(this.player)) {
        this.coinsCollected++;
        Storage.addCoins(1);
        this.coins.splice(i, 1);
      } else if (coin.markedForDeletion) {
        this.coins.splice(i, 1);
      }
    });

    this.uiManager.updateHUD(Math.floor(this.score), this.coinsCollected);
  }

  handleGameOver() {
    const highScore = Storage.getHighScore();
    if (this.score > highScore) {
      Storage.setHighScore(Math.floor(this.score));
    }
    this.changeState(GAME_STATE.GAMEOVER);
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // -- BACKGROUND BARU: Langit Biru Cerah (Clean) --
    const grad = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    grad.addColorStop(0, PALETTE.SKY_TOP); // Biru Langit (Atas)
    grad.addColorStop(1, PALETTE.SKY_BOTTOM); // Biru Pucat (Bawah)
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // PENGHAPUSAN GARIS JALUR (CLEAN LOOK)
    // Kode forEach menggambar garis telah dihapus sesuai permintaan.
    // Sekarang hanya langit bersih.

    // -- Game Objects Layer --
    if (
      this.currentState === GAME_STATE.PLAYING ||
      this.currentState === GAME_STATE.GAMEOVER
    ) {
      // Gambar awan tipis dekoratif (Opsional untuk estetika simple)
      // Bisa ditambahkan nanti jika ingin variasi, tapi sekarang clean dulu.

      this.coins.forEach((c) => c.draw(this.ctx));
      this.obstacles.forEach((o) => o.draw(this.ctx));
      this.player.draw(this.ctx);
    }
  }
}
