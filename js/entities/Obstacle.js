import { CONFIG, PALETTE, OBSTACLE_TYPE, SPRITES } from "../utils/Constants.js";
import { GameManager } from "../core/GameManager.js";

export class Obstacle {
  constructor(laneIndex = 0, speed = 250, type = OBSTACLE_TYPE.BIRD) {
    this.reset(laneIndex, speed, type);
  }

  reset(laneIndex, speed, type = OBSTACLE_TYPE.BIRD) {
    this.laneIndex = laneIndex;
    this.speed = speed;
    this.type = type;

    // Set dimensions based on type
    if (this.type === OBSTACLE_TYPE.BIRD) {
      this.width = SPRITES.BIRD.WIDTH;
      this.height = SPRITES.BIRD.HEIGHT;
    } else {
      this.width = SPRITES.DRONE.WIDTH;
      this.height = SPRITES.DRONE.HEIGHT;
    }

    // Position
    this.baseX = 0;
    this.x = 0;
    this.y = -100;
    this.needsPositionInit = true;

    this.time = 0;
    this.markedForDeletion = false;
    
    // Animation
    this.currentFrame = 0;
    this.frameTimer = 0;
  }

  update(dt) {
    // Init position
    if (this.needsPositionInit) {
      const canvas = document.getElementById('gameCanvas');
      const centerScreen = (canvas?.width || 800) / 2;
      this.baseX = centerScreen + (this.laneIndex - 1) * CONFIG.LANE_WIDTH;
      this.x = this.baseX;
      this.needsPositionInit = false;
    }

    this.y += this.speed * dt;
    this.time += dt;

    // Drone Movement (Zigzag)
    if (this.type === OBSTACLE_TYPE.DRONE) {
      this.x = this.baseX + Math.sin(this.time * 5) * 20;
    }
    
    // Bird Animation (Frame Cycling)
    if (this.type === OBSTACLE_TYPE.BIRD) {
      this.frameTimer += dt;
      if (this.frameTimer > SPRITES.BIRD.ANIMATION_SPEED) {
        this.frameTimer = 0;
        // Cycle frames 0 -> 1 -> 2 -> 0
        this.currentFrame = (this.currentFrame + 1) % SPRITES.BIRD.FRAMES.length;
      }
    }

    // Check bounds
    if (this.y > (document.getElementById('gameCanvas')?.height || 600) + 50) {
      this.markedForDeletion = true;
    }
  }

  checkCollision(player) {
    // Simple AABB collision with padding
    const padding = 10;
    return (
      player.x - player.width / 2 + padding < this.x + this.width / 2 - padding &&
      player.x + player.width / 2 - padding > this.x - this.width / 2 + padding &&
      player.y - player.height / 2 + padding < this.y + this.height / 2 - padding &&
      player.y + player.height / 2 - padding > this.y - this.height / 2 + padding
    );
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    if (this.type === OBSTACLE_TYPE.BIRD) {
      // Draw Animated Bird
      // Get frame key from SPRITES config
      const frameKey = SPRITES.BIRD.FRAMES[this.currentFrame];
      const img = GameManager.instance.assetLoader.getImage(frameKey);
      
      if (img) {
        ctx.drawImage(img, -this.width / 2, -this.height / 2, this.width, this.height);
      } else {
        this.drawFallbackBird(ctx);
      }
    } else {
      // Draw Drone
      const img = GameManager.instance.assetLoader.getImage("OBS_DRONE");
      if (img) {
        ctx.drawImage(img, -this.width / 2, -this.height / 2, this.width, this.height);
      } else {
        this.drawFallbackDrone(ctx);
      }
    }

    ctx.restore();
  }
  
  drawFallbackBird(ctx) {
    ctx.fillStyle = "#333";
    ctx.beginPath();
    ctx.arc(0, 0, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "red"; // Eye
    ctx.beginPath();
    ctx.arc(5, -5, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  
  drawFallbackDrone(ctx) {
    ctx.fillStyle = "#555";
    ctx.fillRect(-20, -20, 40, 40);
    ctx.strokeStyle = PALETTE.CYAN;
    ctx.lineWidth = 2;
    ctx.strokeRect(-20, -20, 40, 40);
  }
}
