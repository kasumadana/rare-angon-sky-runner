import { CONFIG, LANES, PALETTE, SPRITES } from "../utils/Constants.js";
import { GameManager } from "../core/GameManager.js";

export class Player {
  constructor(skinId) {
    this.currentLane = LANES.CENTER;
    this.width = SPRITES.PLAYER.WIDTH;
    this.height = SPRITES.PLAYER.HEIGHT;
    this.skinId = skinId || "bebean_std";
    
    // Position
    this.x = 0;
    this.y = 0;
    this.targetX = 0;
    this.needsPositionInit = true;
    
    // Animation/Movement
    this.tailWiggle = 0;
  }

  getLaneCenterX(laneIndex) {
    const canvas = document.getElementById('gameCanvas');
    const centerScreen = (canvas?.width || 800) / 2;
    const laneOffset = (laneIndex - 1) * CONFIG.LANE_WIDTH;
    return centerScreen + laneOffset;
  }

  moveLane(direction) {
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
    // Init position
    if (this.needsPositionInit) {
      const canvas = document.getElementById('gameCanvas');
      this.y = (canvas?.height || 600) - 150;
      this.targetX = this.getLaneCenterX(this.currentLane);
      this.x = this.targetX;
      this.needsPositionInit = false;
    }

    // Smooth movement
    const lerpSpeed = 10;
    this.x += (this.targetX - this.x) * lerpSpeed * dt;

    // Tail animation
    this.tailWiggle += dt * 10;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    // Determine asset key based on skinId
    let assetKey = "SKIN_BEBEAN";
    if (this.skinId === "pecukan_agile") assetKey = "SKIN_PECUKAN";
    if (this.skinId === "janggan_legend") assetKey = "SKIN_KUWIR";

    const img = GameManager.instance.assetLoader.getImage(assetKey);

    if (img) {
      // Draw Sprite
      ctx.drawImage(
        img, 
        -this.width / 2, 
        -this.height / 2, 
        this.width, 
        this.height
      );
    } else {
      // Fallback Rendering (Shape)
      this.drawFallback(ctx);
    }

    ctx.restore();
  }

  drawFallback(ctx) {
    // Simple Kite Shape
    ctx.beginPath();
    ctx.moveTo(0, -this.height / 2);
    ctx.lineTo(this.width / 2, 0);
    ctx.lineTo(0, this.height / 2);
    ctx.lineTo(-this.width / 2, 0);
    ctx.closePath();

    ctx.fillStyle = PALETTE.BATA;
    ctx.fill();
    ctx.strokeStyle = "#FFF";
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}
