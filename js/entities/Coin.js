import { CONFIG, PALETTE, SPRITES } from "../utils/Constants.js";
import { GameManager } from "../core/GameManager.js";

export class Coin {
  constructor(laneIndex = 0, speed = 250) {
    this.reset(laneIndex, speed);
  }

  reset(laneIndex, speed) {
    this.width = SPRITES.COIN.WIDTH;
    this.height = SPRITES.COIN.HEIGHT;

    // Reset position - will be calculated in first update
    this.laneIndex = laneIndex;
    this.x = 0;
    this.y = -150;
    this.speed = speed;
    this.markedForDeletion = false;
    this.angle = 0;
    this.needsPositionInit = true; // ALWAYS reset this flag
  }

  update(dt) {
    // Initialize position on first update
    if (this.needsPositionInit) {
      const canvas = document.getElementById('gameCanvas');
      const centerScreen = (canvas?.width || 800) / 2;
      this.x = centerScreen + (this.laneIndex - 1) * CONFIG.LANE_WIDTH;
      this.needsPositionInit = false;
    }

    this.y += this.speed * dt;
    this.angle += dt * 5; // Rotasi kilau (if using shape)

    if (this.y > (document.getElementById('gameCanvas')?.height || 600) + 50) {
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

    const img = GameManager.instance.assetLoader.getImage("ITEM_COIN");
    
    if (img) {
        ctx.drawImage(img, -this.width / 2, -this.height / 2, this.width, this.height);
    } else {
        // Fallback
        this.drawFallback(ctx);
    }

    ctx.restore();
  }
  
  drawFallback(ctx) {
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
  }
}
