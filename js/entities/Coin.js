import { CONFIG, PALETTE } from "../utils/Constants.js";

export class Coin {
  constructor(laneIndex, speed) {
    this.width = 30;
    this.height = 30;

    const centerScreen = CONFIG.CANVAS_WIDTH / 2;
    this.x = centerScreen + (laneIndex - 1) * CONFIG.LANE_WIDTH;
    this.y = -150; // Muncul sedikit lebih tinggi dari obstacle
    this.speed = speed;
    this.markedForDeletion = false;
    this.angle = 0;
  }

  update(dt) {
    this.y += this.speed * dt;
    this.angle += dt * 5; // Rotasi kilau

    if (this.y > CONFIG.CANVAS_HEIGHT + 50) {
      this.markedForDeletion = true;
    }
  }

  checkCollision(player) {
    const dist = Math.hypot(this.x - player.x, this.y - player.y);
    return dist < this.width / 2 + player.width / 2;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    // Koin Emas
    ctx.fillStyle = PALETTE.COIN;
    ctx.beginPath();
    ctx.arc(0, 0, 15, 0, Math.PI * 2);
    ctx.fill();

    // Lubang Kotak di tengah (Kepeng Style)
    ctx.fillStyle = "#000";
    ctx.fillRect(-4, -4, 8, 8);

    // Border
    ctx.strokeStyle = "#B8860B";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
  }
}
