import { CONFIG, LANES, PALETTE } from "../utils/Constants.js";

export class Player {
  constructor() {
    this.currentLane = LANES.CENTER;
    this.targetX = this.getLaneCenterX(this.currentLane);
    this.x = this.targetX;
    this.y = CONFIG.CANVAS_HEIGHT - 150;

    this.width = 50;
    this.height = 70;
    this.tailWiggle = 0;
  }

  getLaneCenterX(laneIndex) {
    const centerScreen = CONFIG.CANVAS_WIDTH / 2;
    const laneOffset = (laneIndex - 1) * CONFIG.LANE_WIDTH;
    return centerScreen + laneOffset;
  }

  moveLane(direction) {
    // -1 (Left), 0 (Center), 1 (Right) logic handled by manager
    // Logic absolute lane
    if (direction === -1) this.currentLane = LANES.LEFT;
    else if (direction === 1) this.currentLane = LANES.RIGHT;
    else this.currentLane = LANES.CENTER;

    this.targetX = this.getLaneCenterX(this.currentLane);
  }

  moveLeft() {
    if (this.currentLane > 0) {
      this.currentLane--;
      this.targetX = this.getLaneCenterX(this.currentLane);
    }
  }
  moveRight() {
    if (this.currentLane < 2) {
      this.currentLane++;
      this.targetX = this.getLaneCenterX(this.currentLane);
    }
  }

  update(dt) {
    // LERP movement
    const lerpSpeed = 8;
    this.x += (this.targetX - this.x) * lerpSpeed * dt;

    // Animasi Ekor
    this.tailWiggle += dt * 10;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    // 1. Gambar Ekor (Pita)
    ctx.beginPath();
    ctx.moveTo(0, this.height / 2);
    // Kurva sinus untuk efek tertiup angin
    for (let i = 0; i < 60; i += 5) {
      const wiggle = Math.sin(this.tailWiggle + i * 0.1) * 10;
      ctx.lineTo(wiggle, this.height / 2 + i);
    }
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 3;
    ctx.stroke();

    // 2. Gambar Layangan (Diamond/Bebean Style)
    ctx.beginPath();
    ctx.moveTo(0, -this.height / 2); // Top
    ctx.lineTo(this.width / 2, 0); // Right
    ctx.lineTo(0, this.height / 2); // Bottom
    ctx.lineTo(-this.width / 2, 0); // Left
    ctx.closePath();

    ctx.fillStyle = PALETTE.BATA;
    ctx.fill();
    ctx.strokeStyle = PALETTE.EMAS;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Tulang tengah
    ctx.beginPath();
    ctx.moveTo(0, -this.height / 2);
    ctx.lineTo(0, this.height / 2);
    ctx.stroke();

    ctx.restore();
  }
}
