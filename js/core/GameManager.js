//Mendefinisikan ketergantungan (dependensi) kelas GameManager seperti Mengimpor Konstanta (GAME_STATE, CONFIG), Entitas (Player, Obstacle, Coin), dan Manajer Layanan (InputHandler, UIManager, AssetLoader, dll.).
import {
  GAME_STATE,
  CONFIG,
  OBSTACLE_TYPE,
  PALETTE,
  SKY_PHASES
} from "../utils/Constants.js";
import { Player } from "../entities/Player.js";
import { Obstacle } from "../entities/Obstacle.js";
import { Coin } from "../entities/Coin.js";
import { InputHandler } from "./InputHandler.js";
import { UIManager } from "../ui/UIManager.js";
import { AssetLoader } from "./AssetLoader.js";
import { Storage } from "../utils/Storage.js";
import { ObjectPool } from "../utils/ObjectPool.js";

//Inisialisasi objek game dan komponen dasarnya serta Menerapkan pola Singleton. Menetapkan Canvas, Context (CTX), status awal (LOADING), skor, dan kecepatan dasar.
export class GameManager {
  constructor() {
    if (GameManager.instance) return GameManager.instance;
    GameManager.instance = this;

    this.canvas = document.getElementById("gameCanvas");
    this.ctx = this.canvas.getContext("2d");

    this.currentState = GAME_STATE.LOADING;
    this.score = 0;
    this.coinsCollected = 0;
    
    // Pause State
    this.isPaused = false;

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
    
    // Audio State
    this.bgm = null;
    this.currentBgmKey = null;
    
    // Cloud System
    this.clouds = [];
  }

  //Mengelola objek berulang (rintangan dan koin) secara efisien Menggunakan ObjectPool untuk menghindari overhead pembuatan objek baru berulang kali, meningkatkan performa.
  async init() {
    this.resize();
    window.addEventListener("resize", () => this.resize());

    this.uiManager.showLoading(true);

    try {
      await Promise.all([
        this.assetLoader.loadAll(),
        this.inputHandler.init()
      ]);
      console.log("✅ Initialization complete");
    } catch (e) {
      console.error("❌ Initialization failed:", e);
    }

    //Menciptakan latar belakang dinamis Mengisi array this.clouds dengan awan acak (posisi, kecepatan, tipe) untuk memberikan latar belakang yang bergerak.
    this.initClouds();

    this.uiManager.showLoading(false);
    this.changeState(GAME_STATE.MENU);

    requestAnimationFrame(this.loop);
  }

  initClouds() {
    this.clouds = [];
    const cloudCount = 8; // Increased count
    for (let i = 0; i < cloudCount; i++) {
      this.clouds.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * (this.canvas.height / 2), // Top half only
        speed: 10 + Math.random() * 30, // Random speed
        type: Math.random() > 0.5 ? "CLOUD_SMALL" : "CLOUD_BIG",
        alpha: 0.4 + Math.random() * 0.4, // Random transparency
        scale: 0.5 + Math.random() * 0.5 // Random size
      });
    }
  }

  //Adaptasi Responsif yang menyesuaikan dimensi Canvas game agar selalu sesuai dengan ukuran jendela/layar pemain.
  resize() {
    this.canvas.width = this.canvas.clientWidth;
    this.canvas.height = this.canvas.clientHeight;
    const debugCanvas = document.getElementById("debugCanvas");
    if (debugCanvas) {
      debugCanvas.width = this.canvas.clientWidth;
      debugCanvas.height = this.canvas.clientHeight;
    }
  }

  //Mengatur aliran (flow) game 
  //Mengubah this.currentState dan memicu perubahan UI yang sesuai. 
  //Memicu fungsi playBGM, resetGame, dan kontrol deteksi input berdasarkan status baru (e.g., PLAYING, MENU, GAMEOVER).
  changeState(newState) {
    console.log(`State change: ${this.currentState} -> ${newState}`);
    this.currentState = newState;
    this.uiManager.updateUIState(newState);

    // BGM Logic
    if (newState === GAME_STATE.MENU) {
      this.playBGM('BGM_MENU');
      this.isPaused = false; // Reset pause on menu
    } else if (newState === GAME_STATE.PLAYING) {
      this.playBGM('BGM_GAMEPLAY');
      this.resetGame();
      this.inputHandler.startDetection();
      this.isPaused = false;
    } else if (newState === GAME_STATE.GAMEOVER) {
      this.stopBGM(); 
      this.inputHandler.stopDetection();
      this.isPaused = false;
    } else {
      this.inputHandler.stopDetection();
    }
  }

  // PAUSE SYSTEM
  togglePause() {
    if (this.currentState !== GAME_STATE.PLAYING) return;
    
    this.isPaused = !this.isPaused;
    
    if (this.isPaused) {
      console.log("Game Paused");
      if (this.bgm) this.bgm.pause();
      this.uiManager.showPaused(true);
      this.inputHandler.stopDetection(); // Stop AI to save resources
    } else {
      console.log("Game Resumed");
      if (this.bgm) this.bgm.play().catch(e=>{});
      this.lastTime = performance.now(); // Reset delta time to avoid huge jump
      this.uiManager.showPaused(false);
      this.inputHandler.startDetection(); // Resume AI
    }
  }

  //Menyiapkan game untuk sesi bermain baru
  //Mengatur ulang skor dan kecepatan, melepaskan semua rintangan/koin aktif kembali ke pool, dan membuat instance Player baru.
  resetGame() {
    this.score = 0;
    this.coinsCollected = 0;
    this.gameSpeed = CONFIG.BASE_SPEED;
    this.isPaused = false;
    
    this.obstaclePool.releaseAll();
    this.coinPool.releaseAll();
    
    const selectedSkin = Storage.getSelectedItem();
    this.player = new Player(selectedSkin);
    this.timers = { spawn: 0, coinSpawn: 0 };
  }

  //Mengontrol output audio game
  //Memainkan efek suara (dengan klon agar bisa tumpang tindih) dan mengatur/menghentikan Musik Latar Belakang (BGM) dengan fitur loop dan kontrol volume.
  playSFX(key) {
    const sound = this.assetLoader.getSound(key);
    if (sound) {
      const clone = sound.cloneNode(true);
      clone.volume = 0.5;
      clone.play().catch(e => {});
    }
  }
  
  playBGM(key) {
    if (this.currentBgmKey === key && this.bgm && !this.bgm.paused) return;
    
    this.stopBGM();
    
    const sound = this.assetLoader.getSound(key);
    if (sound) {
      this.bgm = sound;
      this.bgm.loop = true;
      this.bgm.volume = 0.4;
      this.bgm.play().catch(e => console.warn("BGM blocked:", e));
      this.currentBgmKey = key;
    }
  }
  
  stopBGM() {
    if (this.bgm) {
      this.bgm.pause();
      this.bgm.currentTime = 0;
      this.bgm = null;
      this.currentBgmKey = null;
    }
  }

  //Inti operasional game (perulangan utama), Memastikan game berjalan lancar
  //Menghitung Delta Time (dt), memastikan pergerakan frame-rate-independen, lalu memanggil update dan draw
  loop(timestamp) {
    if (!this.lastTime) this.lastTime = timestamp;
    const dt = (timestamp - this.lastTime) / 1000;
    this.lastTime = timestamp;

    const safeDt = Math.min(dt, 0.1);

    if (!this.isPaused) {
        this.update(safeDt);
    }
    this.draw(); // Always draw to keep screen visible (maybe draw paused overlay on top via DOM)

    requestAnimationFrame(this.loop);
  }

  //Logika dan perhitungan game
  //Meningkatkan gameSpeed dan skor. Mengelola logika Spawners (memunculkan rintangan/koin baru). Memeriksa Collisions (tabrakan) antara pemain dan rintangan/koin
  update(dt) {
    // Always update clouds for dynamic background
    this.updateClouds(dt);

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

  updateClouds(dt) {
    this.clouds.forEach(cloud => {
      cloud.x -= cloud.speed * dt;
      if (cloud.x < -200) {
        cloud.x = this.canvas.width + 100;
        cloud.y = Math.random() * (this.canvas.height / 2);
      }
    });
  }

  //Logika setelah kekalahan
  //Memeriksa dan memperbarui High Score. Menyinkronkan data ke cloud (jika login). Mengubah status game menjadi GAMEOVER
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

  //Penggambaran visual game
  //Membersihkan Canvas, menggambar latar belakang (gradient langit), menggambar awan, koin, rintangan, dan pemain.
  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Background (Range-Based Sky Transitions)
    // Range 1: 0 - 500 (Pagi)
    // Range 2: 501 - 600 (Transisi Pagi ke Sore)
    // Range 3: 601 - 1000 (Sore)
    // Range 4: 1001 - 1100 (Transisi Sore ke Malam)
    // Range 5: 1100+ (Malam)
    
    const PHASE_MORNING = { top: "#48CAE4", bottom: "#ADE8F4" };
    const PHASE_AFTERNOON = { top: "#F48C06", bottom: "#FFBA08" }; // Oranye
    const PHASE_NIGHT = { top: "#03071E", bottom: "#370617" }; // Gelap

    let skyTop, skyBottom;
    const score = this.score;

    if (score <= 500) {
        // Pagi Statis
        skyTop = PHASE_MORNING.top;
        skyBottom = PHASE_MORNING.bottom;
    } else if (score > 500 && score <= 600) {
        // Transisi Pagi -> Sore (Lerp)
        const t = (score - 500) / 100; // 0 to 1
        skyTop = this._lerpColor(PHASE_MORNING.top, PHASE_AFTERNOON.top, t);
        skyBottom = this._lerpColor(PHASE_MORNING.bottom, PHASE_AFTERNOON.bottom, t);
    } else if (score > 600 && score <= 1000) {
        // Sore Statis
        skyTop = PHASE_AFTERNOON.top;
        skyBottom = PHASE_AFTERNOON.bottom;
    } else if (score > 1000 && score <= 1100) {
        // Transisi Sore -> Malam (Lerp)
        const t = (score - 1000) / 100; // 0 to 1
        skyTop = this._lerpColor(PHASE_AFTERNOON.top, PHASE_NIGHT.top, t);
        skyBottom = this._lerpColor(PHASE_AFTERNOON.bottom, PHASE_NIGHT.bottom, t);
    } else {
        // Malam Statis
        skyTop = PHASE_NIGHT.top;
        skyBottom = PHASE_NIGHT.bottom;
    }

    const grad = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    grad.addColorStop(0, skyTop);
    grad.addColorStop(1, skyBottom);
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw Clouds
    this.drawClouds();

    // Game Objects
    if (this.currentState === GAME_STATE.PLAYING || this.currentState === GAME_STATE.GAMEOVER) {
      this.coinPool.drawAll(this.ctx);
      this.obstaclePool.drawAll(this.ctx);
      if (this.player) this.player.draw(this.ctx);
    }
  }

  drawClouds() {
    this.clouds.forEach(cloud => {
      const img = this.assetLoader.getImage(cloud.type);
      if (img) {
        this.ctx.save();
        this.ctx.globalAlpha = cloud.alpha;
        
        // Calculate dimensions based on aspect ratio
        const aspectRatio = img.width / img.height;
        const baseHeight = (cloud.type === "CLOUD_BIG" ? 120 : 70); // Increased from 80/50
        const h = baseHeight * cloud.scale;
        const w = h * aspectRatio;
        
        this.ctx.drawImage(img, cloud.x, cloud.y, w, h);
        this.ctx.restore();
      }
    });
  }

  // Helper: Linear Interpolation for Hex Colors
  _lerpColor(a, b, amount) {
      const ah = parseInt(a.replace(/#/g, ''), 16),
            ar = ah >> 16, ag = ah >> 8 & 0xff, ab = ah & 0xff,
            bh = parseInt(b.replace(/#/g, ''), 16),
            br = bh >> 16, bg = bh >> 8 & 0xff, bb = bh & 0xff,
            rr = ar + amount * (br - ar),
            rg = ag + amount * (bg - ag),
            rb = ab + amount * (bb - ab);

      return '#' + ((1 << 24) + (Math.round(rr) << 16) + (Math.round(rg) << 8) + Math.round(rb)).toString(16).slice(1);
  }
}
