import { LANES, GAME_STATE } from "../utils/Constants.js";

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
    this.lastActionTime = 0;
    this.actionCooldown = 200;
    this.lastCommand = 0;
    this.commandStabilityCounter = 0;
    
    // AI Throttling (12 FPS = 83ms per frame)
    this.lastDetectionTime = 0;
    this.detectionInterval = 83; // ms
    
    // Mobile Detection
    this.isMobile = window.innerWidth < 768;
  }

  async init() {
    this._setupKeyboardTouch();
    
    // Skip AI on mobile for performance
    if (this.isMobile) {
      console.log("Mobile detected: AI hand detection disabled");
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
        camStatus.innerText = "Gunakan Keyboard/Touch";
        camStatus.style.color = "var(--heart-red)";
      }
    }
  }

  startDetection() {
    if (!this.isDetecting && this.isWebcamReady && this.model) {
      this.isDetecting = true;
      this._detectionLoop();
      document.querySelector(".cam-status").innerText = "Mendeteksi Gestur...";
      document.querySelector(".rec-dot").style.display = "block";
    }
  }

  stopDetection() {
    this.isDetecting = false;
    this.debugCtx.clearRect(0, 0, this.debugCanvas.width, this.debugCanvas.height);
    document.querySelector(".cam-status").innerText = "Siaga";
    document.querySelector(".rec-dot").style.display = "none";
  }

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

    if (btnLeft) {
      btnLeft.addEventListener("touchstart", (e) => { e.preventDefault(); handleTouch("left"); });
      btnLeft.addEventListener("mousedown", (e) => { e.preventDefault(); handleTouch("left"); });
    }
    if (btnRight) {
      btnRight.addEventListener("touchstart", (e) => { e.preventDefault(); handleTouch("right"); });
      btnRight.addEventListener("mousedown", (e) => { e.preventDefault(); handleTouch("right"); });
    }
  }

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

  async _loadModel() {
    // Load lighter model config if possible for performance
    this.model = await handpose.load({
        detectionConfidence: 0.8,
        iouThreshold: 0.3,
        scoreThreshold: 0.75
    });
  }

  _detectionLoop() {
    if (!this.isDetecting) return;

    const detect = async () => {
      if (!this.isDetecting) return;

      const now = performance.now();
      
      // Throttle detection to 12 FPS (every 83ms)
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

  _processGesture(landmarks) {
    const now = Date.now();
    
    // LOGIKA GESTUR JARI (REFINED)
    // Menggunakan Y-coordinate: 0 di atas, semakin besar ke bawah.
    
    // 1. Cek status dasar jari (Tip vs MCP)
    // MCP (Knuckle) adalah titik referensi yang stabil.
    const isIndexUp = landmarks[8][1] < landmarks[5][1];   // Index
    const isMiddleUp = landmarks[12][1] < landmarks[9][1]; // Middle
    
    // 2. Hitung ukuran tangan referensi (Wrist ke Middle MCP) untuk toleransi
    const handSize = Math.abs(landmarks[0][1] - landmarks[9][1]);
    const tolerance = handSize * 0.25; // 25% dari ukuran tangan

    let currentCommand = 0; // Default: Center
    let gestureName = "NETRAL";

    if (isIndexUp) {
        if (!isMiddleUp) {
            // Kasus Jelas: Telunjuk Naik, Tengah Turun
            currentCommand = -1; // KIRI
            gestureName = "KIRI (Telunjuk)";
        } else {
            // Kasus Ambigu: Telunjuk & Tengah Naik
            // Cek ketinggian relatif. Apakah Telunjuk jauh lebih tinggi?
            // Ingat Y lebih kecil = Lebih tinggi.
            
            if (landmarks[8][1] < landmarks[12][1] - tolerance) {
                // Telunjuk signifikan lebih tinggi dari Tengah -> Anggap KIRI (Lazy Pointing)
                currentCommand = -1;
                gestureName = "KIRI (Lazy)";
            } else {
                // Ketinggian mirip -> KANAN (Peace)
                currentCommand = 1;
                gestureName = "KANAN (Peace)";
            }
        }
    } else {
        // Telunjuk Turun -> Pasti TENGAH (Fist/Relax)
        currentCommand = 0;
        gestureName = "TENGAH (Kepal)";
    }

    this.detectedGesture = gestureName;
    this.detectedCommand = currentCommand; // Simpan untuk visualisasi panah

    // STABILISASI (Debounce)
    if (currentCommand === this.lastCommand) {
        this.commandStabilityCounter++;
    } else {
        this.commandStabilityCounter = 0;
        this.lastCommand = currentCommand;
    }

    // Eksekusi jika stabil (2 frame)
    if (this.commandStabilityCounter >= 2) {
        if (now - this.lastActionTime > this.actionCooldown) {
            const player = this.gameManager.player;
            if (player) {
                let targetLane = LANES.CENTER;
                if (currentCommand === -1) targetLane = LANES.LEFT;
                if (currentCommand === 1) targetLane = LANES.RIGHT;
                
                if (player.currentLane !== targetLane) {
                    player.moveLane(currentCommand);
                    this.lastActionTime = now;
                }
            }
        }
    }
  }

  _drawSkeleton(landmarks) {
    const ctx = this.debugCtx;
    const w = this.debugCanvas.width;
    const h = this.debugCanvas.height;
    
    // Pastikan video dimensions valid
    const vw = this.video.videoWidth || 320;
    const vh = this.video.videoHeight || 240;
    
    const scaleX = w / vw;
    const scaleY = h / vh;

    // 1. Gambar Tulang
    ctx.strokeStyle = "#00FF00";
    ctx.lineWidth = 2;

    const connections = [
        [0,1], [1,2], [2,3], [3,4], // Thumb
        [0,5], [5,6], [6,7], [7,8], // Index
        [0,9], [9,10], [10,11], [11,12], // Middle
        [0,13], [13,14], [14,15], [15,16], // Ring
        [0,17], [17,18], [18,19], [19,20] // Pinky
    ];
    
    ctx.beginPath();
    connections.forEach(([start, end]) => {
        ctx.moveTo(landmarks[start][0] * scaleX, landmarks[start][1] * scaleY);
        ctx.lineTo(landmarks[end][0] * scaleX, landmarks[end][1] * scaleY);
    });
    ctx.stroke();

    // 2. Gambar Sendi
    for (let i = 0; i < landmarks.length; i++) {
        const x = landmarks[i][0] * scaleX;
        const y = landmarks[i][1] * scaleY;
        ctx.beginPath();
        ctx.fillStyle = [4,8,12,16,20].includes(i) ? "#FF0000" : "#FFFF00";
        ctx.arc(x, y, 3, 0, 2 * Math.PI);
        ctx.fill();
    }

    // 3. Visualisasi Arah (Big Arrow Overlay)
    if (this.detectedCommand !== undefined) {
        ctx.save();
        ctx.translate(w / 2, h / 2);
        // Karena canvas di-flip CSS, kita harus flip balik untuk teks/icon arah yang benar secara visual
        ctx.scale(-1, 1); 
        
        ctx.font = "bold 40px Arial";
        ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
        ctx.strokeStyle = "black";
        ctx.lineWidth = 4;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        let symbol = "✊";
        if (this.detectedCommand === -1) symbol = "👈";
        if (this.detectedCommand === 1) symbol = "👉";
        
        ctx.strokeText(symbol, 0, 0);
        ctx.fillText(symbol, 0, 0);
        
        // Teks Debug Kecil di bawah
        ctx.font = "12px Arial";
        ctx.strokeText(this.detectedGesture || "", 0, 40);
        ctx.fillText(this.detectedGesture || "", 0, 40);
        
        ctx.restore();
    }
  }
}
