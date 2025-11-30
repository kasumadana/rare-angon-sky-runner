import { CONFIG, LANES, SPRITES } from "../utils/Constants.js";
import { GameManager } from "../core/GameManager.js";

export class Player {
  constructor(skinId = "bebean_std") {
    this.width = SPRITES.PLAYER.WIDTH;
    this.height = SPRITES.PLAYER.HEIGHT;
    
    // FIX: Use dynamic canvas width if available, else fallback to CONFIG
    const canvas = document.getElementById('gameCanvas');
    const canvasWidth = canvas ? canvas.width : CONFIG.CANVAS_WIDTH;
    
    this.x = canvasWidth / 2;
    this.y = CONFIG.CANVAS_HEIGHT - 150;
    
    this.currentLane = LANES.CENTER;
    this.targetX = this.x;
    
    this.skinId = skinId;
    this.skinKey = this._getSkinKey(skinId);
  }

  _getSkinKey(id) {
    switch(id) {
      case 'pecukan_agile': return 'SKIN_PECUKAN';
      case 'janggan_legend': return 'SKIN_KUWIR';
      default: return 'SKIN_BEBEAN';
    }
  }

  update(dt) {
    // Smooth movement
    const speed = 15 * dt;
    this.x += (this.targetX - this.x) * speed;
    
    // Bobbing animation
    this.y = (CONFIG.CANVAS_HEIGHT - 150) + Math.sin(Date.now() / 200) * 5;
  }

  draw(ctx) {
    const assetLoader = GameManager.instance.assetLoader;
    const img = assetLoader.getImage(this.skinKey);
    
    if (img) {
      ctx.drawImage(
        img, 
        this.x - this.width / 2, 
        this.y - this.height / 2, 
        this.width, 
        this.height
      );
    } else {
      // Fallback
      ctx.fillStyle = "red";
      ctx.fillRect(
        this.x - this.width / 2, 
        this.y - this.height / 2, 
        this.width, 
        this.height
      );
    }
  }

  moveLeft() {
    if (this.currentLane > LANES.LEFT) {
      this.moveLane(-1);
    }
  }

  moveRight() {
    if (this.currentLane < LANES.RIGHT) {
      this.moveLane(1);
    }
  }

  moveLane(direction) {
    // direction: -1 (left), 0 (center/stay), 1 (right)
    if (direction === 0) return;
    
    const newLane = this.currentLane + direction;
    if (newLane >= LANES.LEFT && newLane <= LANES.RIGHT) {
      this.currentLane = newLane;
      this._updateTargetX();
      GameManager.instance.playSFX('WHOOSH');
    }
  }

  _updateTargetX() {
    // FIX: Always get current canvas width for responsiveness
    const canvas = document.getElementById('gameCanvas');
    const center = (canvas ? canvas.width : CONFIG.CANVAS_WIDTH) / 2;
    const offset = CONFIG.LANE_WIDTH; 
    
    if (this.currentLane === LANES.LEFT) this.targetX = center - offset;
    else if (this.currentLane === LANES.CENTER) this.targetX = center;
    else if (this.currentLane === LANES.RIGHT) this.targetX = center + offset;
  }
}
