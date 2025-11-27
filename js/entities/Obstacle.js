import { CONFIG, PALETTE, OBSTACLE_TYPE } from "../utils/Constants.js";

export class Obstacle {
  constructor(laneIndex, speed, type = OBSTACLE_TYPE.BIRD) {
    this.laneIndex = laneIndex;
    this.speed = speed;
    this.type = type;

    this.width = 40;
    this.height = 40;

    const centerScreen = CONFIG.CANVAS_WIDTH / 2;
    this.baseX = centerScreen + (laneIndex - 1) * CONFIG.LANE_WIDTH;
    this.x = this.baseX;
    this.y = -100;

    this.time = 0; // Untuk animasi zigzag
    this.markedForDeletion = false;
  }

  update(dt) {
    this.y += this.speed * dt;
    this.time += dt;

    // Logika Zigzag untuk Drone
    if (this.type === OBSTACLE_TYPE.DRONE) {
      this.x = this.baseX + Math.sin(this.time * 5) * 20;
    }

    if (this.y > CONFIG.CANVAS_HEIGHT + 50) {
      this.markedForDeletion = true;
    }
  }

  checkCollision(player) {
    const padding = 10;
    return (
      player.x - player.width / 2 + padding <
        this.x + this.width / 2 - padding &&
      player.x + player.width / 2 - padding >
        this.x - this.width / 2 + padding &&
      player.y - player.height / 2 + padding <
        this.y + this.height / 2 - padding &&
      player.y + player.height / 2 - padding >
        this.y - this.height / 2 + padding
    );
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    if (this.type === OBSTACLE_TYPE.BIRD) {
      // Visual Burung Kokokan (Lingkaran Hitam + Mata Merah)
      ctx.fillStyle = "#111";
      ctx.beginPath();
      ctx.arc(0, 0, 20, 0, Math.PI * 2);
      ctx.fill();
      // Mata
      ctx.fillStyle = "red";
      ctx.beginPath();
      ctx.arc(-5, -5, 3, 0, Math.PI * 2);
      ctx.arc(5, -5, 3, 0, Math.PI * 2);
      ctx.fill();
      // Sayap simple
      ctx.strokeStyle = "#333";
      ctx.beginPath();
      ctx.moveTo(-20, 0);
      ctx.lineTo(-35, -10);
      ctx.moveTo(20, 0);
      ctx.lineTo(35, -10);
      ctx.stroke();
    } else {
      // Visual Drone (Kotak Tech)
      ctx.fillStyle = "#444";
      ctx.fillRect(-20, -20, 40, 40);
      ctx.strokeStyle = PALETTE.CYAN;
      ctx.lineWidth = 2;
      ctx.strokeRect(-20, -20, 40, 40);
      // Lampu kedip
      ctx.fillStyle = Math.floor(this.time * 10) % 2 === 0 ? "red" : "black";
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
