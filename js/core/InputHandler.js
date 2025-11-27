import { LANES } from "../utils/Constants.js";

export class InputHandler {
  constructor(gameManager) {
    this.gameManager = gameManager;
    this.debugCanvas = document.getElementById("debugCanvas");
    this.debugCtx = this.debugCanvas.getContext("2d");
    this.video = document.getElementById("webcam");

    this.model = null;
    this.isWebcamReady = false;

    // Cooldown
    this.lastActionTime = 0;
    this.actionCooldown = 300; // ms
  }

  async init() {
    this._setupKeyboardTouch();
    try {
      await this._setupWebcam();
      await this._loadModel();
      this._startDetection();
    } catch (e) {
      console.warn("AI Init Failed, fallback to manual inputs.", e);
    }
  }

  _setupKeyboardTouch() {
    // Keyboard
    window.addEventListener("keydown", (e) => {
      if (this.gameManager.currentState !== "PLAYING") return;
      const player = this.gameManager.player;
      if (!player) return;

      if (e.key === "ArrowLeft" || e.key === "a") player.moveLeft();
      if (e.key === "ArrowRight" || e.key === "d") player.moveRight();
    });

    // Touch UI
    const btnLeft = document.querySelector(".d-btn.left");
    const btnRight = document.querySelector(".d-btn.right");

    const handleTouch = (dir) => {
      if (this.gameManager.currentState === "PLAYING") {
        if (dir === "left") this.gameManager.player.moveLeft();
        if (dir === "right") this.gameManager.player.moveRight();
      }
    };

    if (btnLeft) {
      btnLeft.addEventListener("touchstart", (e) => {
        e.preventDefault();
        handleTouch("left");
      });
      btnLeft.addEventListener("mousedown", (e) => {
        e.preventDefault();
        handleTouch("left");
      });
    }
    if (btnRight) {
      btnRight.addEventListener("touchstart", (e) => {
        e.preventDefault();
        handleTouch("right");
      });
      btnRight.addEventListener("mousedown", (e) => {
        e.preventDefault();
        handleTouch("right");
      });
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
    this.model = await handpose.load();
  }

  _startDetection() {
    const detect = async () => {
      if (this.isWebcamReady && this.model) {
        const predictions = await this.model.estimateHands(this.video);
        this.debugCtx.clearRect(
          0,
          0,
          this.debugCanvas.width,
          this.debugCanvas.height
        );

        if (predictions.length > 0) {
          const hand = predictions[0];
          this._drawSkeleton(hand.landmarks);

          if (this.gameManager.currentState === "PLAYING") {
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
    if (now - this.lastActionTime < this.actionCooldown) return;

    // Logic Jari Naik (Tip Y < PIP Y)
    const isIndexUp = landmarks[8][1] < landmarks[6][1];
    const isMiddleUp = landmarks[12][1] < landmarks[10][1];
    const isRingUp = landmarks[16][1] < landmarks[14][1];

    let command = 0; // 0: Center, -1: Left, 1: Right

    // GDD Logic:
    // Index & Middle Up (V-Sign) -> RIGHT
    // Index Up Only -> LEFT
    // Fist/Neutral -> CENTER

    if (isIndexUp && isMiddleUp) {
      command = 1; // Right
    } else if (isIndexUp && !isMiddleUp) {
      command = -1; // Left
    } else {
      command = 0; // Center
    }

    const player = this.gameManager.player;
    if (player) {
      // Apply Absolute Lane Logic
      if (command === -1 && player.currentLane !== LANES.LEFT) {
        player.moveLane(-1);
        this.lastActionTime = now;
      } else if (command === 1 && player.currentLane !== LANES.RIGHT) {
        player.moveLane(1);
        this.lastActionTime = now;
      } else if (command === 0 && player.currentLane !== LANES.CENTER) {
        player.moveLane(0);
        this.lastActionTime = now;
      }
    }
  }

  _drawSkeleton(landmarks) {
    const ctx = this.debugCtx;
    // Simple scaling
    const scaleX = this.debugCanvas.width / this.video.videoWidth;
    const scaleY = this.debugCanvas.height / this.video.videoHeight;

    ctx.fillStyle = "#00FF00";
    ctx.strokeStyle = "#00FF00";
    ctx.lineWidth = 2;

    const drawPoint = (idx) => {
      ctx.beginPath();
      ctx.arc(
        landmarks[idx][0] * scaleX,
        landmarks[idx][1] * scaleY,
        3,
        0,
        2 * Math.PI
      );
      ctx.fill();
    };

    for (let i = 0; i < landmarks.length; i++) drawPoint(i);
  }
}
