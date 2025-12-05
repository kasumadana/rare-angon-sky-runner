//buat ngatur input dari player seperti webccam
//Menyediakan konstanta penting dan referensi eksternal
//Mengimpor LANES (jalur) dan GAME_STATE (status game).
import { LANES, GAME_STATE } from "../utils/Constants.js";

//Menghubungkan ke elemen DOM (HTML) dan GameManager Menghubungkan ke gameManager, debugCanvas (untuk visualisasi AI), dan elemen video (webcam).
export class InputHandler {
  constructor(gameManager) {
    this.gameManager = gameManager;
    this.debugCanvas = document.getElementById("debugCanvas");
    this.debugCtx = this.debugCanvas.getContext("2d");
    this.video = document.getElementById("webcam");

    this.model = null;
    this.isWebcamReady = false;
    this.isDetecting = false;

    // Cooldown & Smoothing
    //Mengontrol kecepatan dan stabilitas input.	this.actionCooldown (500ms) mencegah gerakan cepat berlebihan. 
    //this.detectionInterval (83ms) membatasi deteksi AI menjadi sekitar 12 FPS. this.commandStabilityCounter meningkatkan stabilitas perintah.
    this.lastActionTime = 0;
    this.actionCooldown = 500; // Increased cooldown to prevent rapid switching
    this.lastCommand = null;
    this.commandStabilityCounter = 0;
    
    // AI Throttling (12 FPS = 83ms per frame)
    this.lastDetectionTime = 0;
    this.detectionInterval = 83; // ms
    
    // Mengoptimalkan performa di perangkat seluler.	this.isMobile digunakan untuk menonaktifkan deteksi AI di ponsel secara otomatis.
    this.isMobile = window.innerWidth < 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  //Memulai semua mekanisme input.	Selalu memanggil _setupKeyboardTouch. 
  //Jika bukan mobile, ia mencoba memanggil _setupWebcam() dan _loadModel() dengan mekanisme timeout 5 detik sebagai fallback ke input manual jika inisialisasi gagal.
  async init() {
    this._setupKeyboardTouch();
    
    // Skip AI on mobile for performance AND UI cleanliness
    if (this.isMobile) {
      console.log("📱 Mobile detected: AI hand detection disabled");
      // Hide webcam container explicitly
      const camContainer = document.querySelector('.webcam-container');
      if (camContainer) camContainer.style.display = 'none';
      return;
    }
    
    // Timeout untuk mencegah stuck jika webcam gagal
    const initWithTimeout = async () => {
      const timeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Webcam timeout')), 5000)
      );
      
      const init = (async () => {
        await this._setupWebcam();
        await this._loadModel();
      })();
      
      return Promise.race([init, timeout]);
    };
    
    try {
      await initWithTimeout();
      console.log("✅ AI hand detection ready");
    } catch (e) {
      console.warn("⚠️ AI Init Failed, fallback to manual inputs.", e.message);
      const camStatus = document.querySelector(".cam-status");
      if (camStatus) {
        camStatus.innerText = "Gunakan Keyboard";
        camStatus.style.color = "var(--heart-red)";
      }
    }
  }

  //Mengaktifkan proses deteksi AI.	Mengatur this.isDetecting = true dan memulai perulangan _detectionLoop().
  //Memperbarui status UI webcam menjadi "Mendeteksi Gestur...".
  startDetection() {
    // Never start detection on mobile
    if (this.isMobile) return;

    if (!this.isDetecting && this.isWebcamReady && this.model) {
      this.isDetecting = true;
      this._detectionLoop();
      const statusEl = document.querySelector(".cam-status");
      const dotEl = document.querySelector(".rec-dot");
      if (statusEl) statusEl.innerText = "Mendeteksi Gestur...";
      if (dotEl) dotEl.style.display = "block";
    }
  }

  //Menonaktifkan deteksi AI.	
  //Mengatur this.isDetecting = false, membersihkan debug canvas, dan mengatur status UI webcam menjadi "Siaga".
  stopDetection() {
    this.isDetecting = false;
    if (this.debugCtx && this.debugCanvas) {
      this.debugCtx.clearRect(0, 0, this.debugCanvas.width, this.debugCanvas.height);
    }
    
    const statusEl = document.querySelector(".cam-status");
    const dotEl = document.querySelector(".rec-dot");
    if (statusEl) statusEl.innerText = "Siaga";
    if (dotEl) dotEl.style.display = "none";
  }

  //Mengatur event listener untuk input tradisional.	Keyboard: Menggunakan tombol panah (ArrowLeft, ArrowRight) atau (a, d) untuk memanggil player.moveLeft() atau player.moveRight().
  //Sentuhan: Menghubungkan tombol UI virtual (.d-btn) ke fungsi gerakan pemain, menggunakan preventDefault() untuk sentuhan/klik.
  _setupKeyboardTouch() {
    // Keyboard
    window.addEventListener("keydown", (e) => {
      if (this.gameManager.currentState !== GAME_STATE.PLAYING) return;
      const player = this.gameManager.player;
      if (!player) return;

      if (e.key === "ArrowLeft" || e.key === "a") player.moveLeft();
      if (e.key === "ArrowRight" || e.key === "d") player.moveRight();
    });

    // Touch UI
    const btnLeft = document.querySelector(".d-btn.left");
    const btnRight = document.querySelector(".d-btn.right");

    const handleTouch = (dir) => {
      if (this.gameManager.currentState === GAME_STATE.PLAYING) {
        if (dir === "left") this.gameManager.player.moveLeft();
        if (dir === "right") this.gameManager.player.moveRight();
      }
    };

    // Add passive: false to allow preventDefault()
    if (btnLeft) {
      btnLeft.addEventListener("touchstart", (e) => { 
        if (e.cancelable) e.preventDefault(); 
        handleTouch("left"); 
      }, { passive: false });
      
      btnLeft.addEventListener("mousedown", (e) => { 
        e.preventDefault(); 
        handleTouch("left"); 
      });
    }
    if (btnRight) {
      btnRight.addEventListener("touchstart", (e) => { 
        if (e.cancelable) e.preventDefault(); 
        handleTouch("right"); 
      }, { passive: false });
      
      btnRight.addEventListener("mousedown", (e) => { 
        e.preventDefault(); 
        handleTouch("right"); 
      });
    }
  }

  //Mengakses kamera perangkat.	Meminta izin pengguna melalui getUserMedia dan menghubungkan aliran video ke elemen <video>.
  async _setupWebcam() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia)
      throw new Error("No Webcam");
    
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 320, height: 240, facingMode: "user" },
    });
    this.video.srcObject = stream;
    
    return new Promise((resolve) => {
      this.video.onloadedmetadata = () => {
        this.video.play();
        this.isWebcamReady = true;
        resolve();
      };
    });
  }

  //Memuat model Machine Learning untuk pengenalan tangan.	
  //Memuat model Handpose (atau sejenisnya) dari pustaka eksternal (misalnya, TensorFlow.js) ke dalam this.model.
  async _loadModel() {
    this.model = await handpose.load({
        detectionConfidence: 0.8,
        iouThreshold: 0.3,
        scoreThreshold: 0.75
    });
  }

  //Perulangan utama yang menjalankan inferensi AI.	Menggunakan requestAnimationFrame tetapi di-throttle oleh this.detectionInterval (83ms) untuk menghemat daya.
  //Memanggil this.model.estimateHands(this.video) untuk mendeteksi landmark.
  _detectionLoop() {
    if (!this.isDetecting) return;

    const detect = async () => {
      if (!this.isDetecting) return;

      const now = performance.now();
      
      if (now - this.lastDetectionTime >= this.detectionInterval) {
        this.lastDetectionTime = now;
        
        if (this.model && this.video.readyState === 4) {
          const predictions = await this.model.estimateHands(this.video);
          
          this.debugCtx.clearRect(0, 0, this.debugCanvas.width, this.debugCanvas.height);

          if (predictions.length > 0) {
            const hand = predictions[0];
            this._drawSkeleton(hand.landmarks);
            this._processGesture(hand.landmarks);
          }
        }
      }
      
      requestAnimationFrame(detect);
    };
    detect();
  }

  //Menerjemahkan landmark tangan menjadi perintah game.	Logika Gestur: Menghitung jumlah jari yang terentang (berdasarkan perbandingan koordinat Y ujung dan pangkal jari). 
  //Perintah: Menerjemahkan jumlah jari (1, 2, atau 3) menjadi Jalur (Kiri, Tengah, Kanan). 
  //Stabilitas: Menggunakan commandStabilityCounter untuk memastikan gestur stabil selama beberapa frame sebelum mengeksekusi perintah gerak (player.moveLeft/moveRight) untuk meminimalkan noise
  _processGesture(landmarks) {
    const now = Date.now();
    
    // Count extended fingers (Index, Middle, Ring, Pinky)
    // Finger is extended if tip is higher (lower y value) than base (pip)
    const isFingerExtended = (tipIdx, pipIdx) => {
      return landmarks[tipIdx][1] < landmarks[pipIdx][1];
    };

    let fingerCount = 0;
    if (isFingerExtended(8, 6)) fingerCount++;   // Index
    if (isFingerExtended(12, 10)) fingerCount++; // Middle
    if (isFingerExtended(16, 14)) fingerCount++; // Ring
    if (isFingerExtended(20, 18)) fingerCount++; // Pinky
    // Thumb is tricky, let's ignore it for 1-2-3 count or treat it loosely
    // if (landmarks[4][0] < landmarks[3][0]) fingerCount++; // Thumb (depends on hand side)

    let targetLane = null;
    let gestureName = "NETRAL";

    if (fingerCount === 1) {
      targetLane = LANES.LEFT;
      gestureName = "1 JARI (KIRI)";
    } else if (fingerCount === 2) {
      targetLane = LANES.CENTER;
      gestureName = "2 JARI (TENGAH)";
    } else if (fingerCount === 3) {
      targetLane = LANES.RIGHT;
      gestureName = "3 JARI (KANAN)";
    } else {
      gestureName = `${fingerCount} JARI`;
    }

    this.detectedGesture = gestureName;
    this.detectedCommand = targetLane;

    // Stability Check
    if (targetLane !== null && targetLane === this.lastCommand) {
      this.commandStabilityCounter++;
    } else {
      this.commandStabilityCounter = 0;
      this.lastCommand = targetLane;
    }

    // Execute Command
    if (this.commandStabilityCounter >= 3) { // Require 3 stable frames (~250ms)
      if (now - this.lastActionTime > this.actionCooldown) {
        const player = this.gameManager.player;
        if (player && targetLane !== null) {
          if (player.currentLane !== targetLane) {
            // Calculate direction to move
            const diff = targetLane - player.currentLane;
            // Move step by step or jump? 
            // Game logic supports moveLane(-1/1). 
            // But here we want absolute positioning.
            // Let's just move towards target.
            if (diff > 0) player.moveRight();
            if (diff < 0) player.moveLeft();
            
            this.lastActionTime = now;
          }
        }
      }
    }
  }

  //Visualisasi debugging.	Menggambar kerangka 21 landmark tangan yang terdeteksi, termasuk koneksi antar jari, di debug canvas.
  //Ini juga menampilkan nama gestur yang terdeteksi (misalnya, "3 JARI (KANAN)") di atas video.
  _drawSkeleton(landmarks) {
    const ctx = this.debugCtx;
    const w = this.debugCanvas.width;
    const h = this.debugCanvas.height;
    
    const vw = this.video.videoWidth || 320;
    const vh = this.video.videoHeight || 240;
    
    const scaleX = w / vw;
    const scaleY = h / vh;

    ctx.strokeStyle = "#00FF00";
    ctx.lineWidth = 2;

    const connections = [
        [0,1], [1,2], [2,3], [3,4],
        [0,5], [5,6], [6,7], [7,8],
        [0,9], [9,10], [10,11], [11,12],
        [0,13], [13,14], [14,15], [15,16],
        [0,17], [17,18], [18,19], [19,20]
    ];
    
    ctx.beginPath();
    connections.forEach(([start, end]) => {
      ctx.moveTo(landmarks[start][0] * scaleX, landmarks[start][1] * scaleY);
      ctx.lineTo(landmarks[end][0] * scaleX, landmarks[end][1] * scaleY);
    });
    ctx.stroke();

    // Draw Tips
    for (let i = 0; i < landmarks.length; i++) {
        const x = landmarks[i][0] * scaleX;
        const y = landmarks[i][1] * scaleY;
        ctx.beginPath();
        ctx.fillStyle = [4,8,12,16,20].includes(i) ? "#FF0000" : "#FFFF00";
        ctx.arc(x, y, 3, 0, 2 * Math.PI);
        ctx.fill();
    }

    // Draw HUD
    if (this.detectedGesture) {
        ctx.save();
        ctx.translate(w / 2, h / 2);
        ctx.scale(-1, 1); // Mirror text back
        
        ctx.font = "bold 30px Arial";
        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        ctx.strokeStyle = "black";
        ctx.lineWidth = 3;
        ctx.textAlign = "center";
        
        ctx.strokeText(this.detectedGesture, 0, 0);
        ctx.fillText(this.detectedGesture, 0, 0);
        
        ctx.restore();
    }
  }
}
