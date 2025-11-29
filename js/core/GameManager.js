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
import { ObjectPool } from "../utils/ObjectPool.js";

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
    
    // Object Pools
    this.obstaclePool = new ObjectPool(Obstacle, 50);
    this.coinPool = new ObjectPool(Coin, 30);

    this.gameSpeed = CONFIG.BASE_SPEED;
    this.timers = { spawn: 0, coinSpawn: 0 };

    this.assetLoader = new AssetLoader();
    this.uiManager = new UIManager(this);
    this.inputHandler = new InputHandler(this);

    this.loop = this.loop.bind(this);
    this.lastTime = 0;
  }

  async init() {
    this.resize();
    window.addEventListener("resize", () => this.resize());

    this.uiManager.showLoading(true);

    // Load Assets & AI
    try {
      await Promise.all([
        this.assetLoader.loadAll(),
        this.inputHandler.init()
      ]);
      console.log("✅ Initialization complete");
    } catch (e) {
      console.error("❌ Initialization failed:", e);
    }

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
    console.log(`State change: ${this.currentState} -> ${newState}`);
    this.currentState = newState;
    this.uiManager.updateUIState(newState);

    if (newState === GAME_STATE.PLAYING) {
      this.resetGame();
      this.inputHandler.startDetection();
    } else {
      this.inputHandler.stopDetection();
    }
  }

  resetGame() {
    this.score = 0;
    this.coinsCollected = 0;
    this.gameSpeed = CONFIG.BASE_SPEED;
    
    this.obstaclePool.releaseAll();
    this.coinPool.releaseAll();
    
    const selectedSkin = Storage.getSelectedItem();
    this.player = new Player(selectedSkin);
    this.timers = { spawn: 0, coinSpawn: 0 };
    
    console.log("Game Reset. Player created:", this.player);
  }

  playSFX(key) {
    const sound = this.assetLoader.getSound(key);
    if (sound) {
      const clone = sound.cloneNode(true);
      clone.volume = 0.5;
      clone.play().catch(e => {});
    }
  }

  loop(timestamp) {
    if (!this.lastTime) this.lastTime = timestamp;
    const dt = (timestamp - this.lastTime) / 1000;
    this.lastTime = timestamp;

    const safeDt = Math.min(dt, 0.1);

    this.update(safeDt);
    this.draw();

    requestAnimationFrame(this.loop);
  }

  update(dt) {
    if (this.currentState !== GAME_STATE.PLAYING) return;

    // Difficulty
    this.gameSpeed += dt * 5;
    this.score += this.gameSpeed * dt * 0.05;

    // Player
    if (this.player) this.player.update(dt);

    // Spawners
    this.timers.spawn += dt;
    const currentSpawnRate = Math.max(0.5, CONFIG.SPAWN_RATE * (CONFIG.BASE_SPEED / this.gameSpeed));
    
    if (this.timers.spawn > currentSpawnRate) {
      this.timers.spawn = 0;
      const lane = Math.floor(Math.random() * 3);
      const type = Math.random() > 0.7 ? OBSTACLE_TYPE.DRONE : OBSTACLE_TYPE.BIRD;
      this.obstaclePool.acquire(lane, this.gameSpeed, type);
    }

    this.timers.coinSpawn += dt;
    if (this.timers.coinSpawn > 2.0) {
      this.timers.coinSpawn = 0;
      const lane = Math.floor(Math.random() * 3);
      this.coinPool.acquire(lane, this.gameSpeed);
    }

    // Updates
    this.obstaclePool.updateAll(dt);
    this.coinPool.updateAll(dt);
    
    // Collisions
    if (this.player) {
      for (const obs of this.obstaclePool.getActive()) {
        if (obs.checkCollision(this.player)) {
          this.playSFX('HIT');
          this.handleGameOver();
          break;
        }
      }
      
      for (const coin of this.coinPool.getActive()) {
        if (coin.checkCollision(this.player)) {
          this.coinsCollected++;
          Storage.addCoins(1);
          this.playSFX('COIN');
          this.coinPool.release(coin);
        }
      }
    }

    this.uiManager.updateHUD(Math.floor(this.score), this.coinsCollected);
  }

  async handleGameOver() {
    const highScore = Storage.getHighScore();
    const finalScore = Math.floor(this.score);
    
    if (this.score > highScore) {
      Storage.setHighScore(finalScore);
    }
    
    if (this.uiManager.accountManager && this.uiManager.accountManager.isLoggedIn) {
      try {
        await this.uiManager.accountManager._syncToCloud();
      } catch (e) {
        console.error('Auto-sync failed:', e);
      }
    }
    
    this.inputHandler.stopDetection();
    this.changeState(GAME_STATE.GAMEOVER);
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Background
    const grad = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    grad.addColorStop(0, PALETTE.SKY_TOP);
    grad.addColorStop(1, PALETTE.SKY_BOTTOM);
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Clouds
    const cloudSmall = this.assetLoader.getImage("CLOUD_SMALL");
    const cloudBig = this.assetLoader.getImage("CLOUD_BIG");
    
    if (cloudSmall) {
      this.ctx.drawImage(cloudSmall, 100, 100, 100, 60);
      this.ctx.drawImage(cloudSmall, 600, 200, 120, 70);
    }
    if (cloudBig) {
      this.ctx.drawImage(cloudBig, 300, 50, 200, 100);
    }

    // Game Objects
    if (this.currentState === GAME_STATE.PLAYING || this.currentState === GAME_STATE.GAMEOVER) {
      this.coinPool.drawAll(this.ctx);
      this.obstaclePool.drawAll(this.ctx);
      if (this.player) this.player.draw(this.ctx);
    }
  }
}
