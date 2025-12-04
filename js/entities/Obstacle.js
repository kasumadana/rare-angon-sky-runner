import { CONFIG, PALETTE, OBSTACLE_TYPE, SPRITES } from "../utils/Constants.js";
import { GameManager } from "../core/GameManager.js";

//Menginisialisasi atau mengatur ulang rintangan.	Dipanggil saat rintangan dibuat atau ditarik dari Object Pool. 
//Menetapkan laneIndex, speed, dan type (Burung atau Drone).
export class Obstacle {
  constructor(laneIndex = 0, speed = 250, type = OBSTACLE_TYPE.BIRD) {
    this.reset(laneIndex, speed, type);
  }

  reset(laneIndex, speed, type = OBSTACLE_TYPE.BIRD) {
    this.laneIndex = laneIndex;
    this.speed = speed;
    this.type = type;

    // Set dimensions based on type
    //Menyesuaikan lebar dan tinggi rintangan.	Mengatur this.width dan this.height secara dinamis berdasarkan this.type 
    //(misalnya, mengambil dimensi dari SPRITES.BIRD atau SPRITES.DRONE).
    if (this.type === OBSTACLE_TYPE.BIRD) {
      this.width = SPRITES.BIRD.WIDTH;
      this.height = SPRITES.BIRD.HEIGHT;
    } else {
      this.width = SPRITES.DRONE.WIDTH;
      this.height = SPRITES.DRONE.HEIGHT;
    }

    // Position
    //Menetapkan posisi awal dan status pergerakan.	this.y = -100 (di luar layar atas), 
    //this.baseX (pusat jalur), this.time (untuk pergerakan sinusoidal Drone), dan this.needsPositionInit.
    this.baseX = 0;
    this.x = 0;
    this.y = -100;
    this.needsPositionInit = true;

    this.time = 0;
    this.markedForDeletion = false;
    
    // Animation
    //Mengelola keadaan animasi sprite.	this.currentFrame dan this.frameTimer digunakan 
    //untuk mengontrol kecepatan frame (misalnya, gerakan sayap Burung).
    this.currentFrame = 0;
    this.frameTimer = 0;
  }

  //Logika pergerakan dan animasi rintangan per frame.	Perhitungan Posisi X: Pada update pertama, menghitung this.baseX (pusat jalur) dan menginisialisasi this.x. Pergerakan Vertikal: Menggerakkan rintangan ke bawah (this.y += this.speed * dt). 
  //Pergerakan Drone: Jika type adalah DRONE, rintangan bergerak menyamping (zigzag) dengan menggunakan fungsi Math.sin(this.time * 5) * 20 di sekitar this.baseX.
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
    //Mengontrol frame animasi Burung.	Menggunakan this.frameTimer dan 
    //SPRITES.BIRD.ANIMATION_SPEED untuk mengganti this.currentFrame secara berkala, menciptakan efek sayap mengepak.
    if (this.type === OBSTACLE_TYPE.BIRD) {
      this.frameTimer += dt;
      if (this.frameTimer > SPRITES.BIRD.ANIMATION_SPEED) {
        this.frameTimer = 0;
        // Cycle frames 0 -> 1 -> 2 -> 0
        this.currentFrame = (this.currentFrame + 1) % SPRITES.BIRD.FRAMES.length;
      }
    }

    // Check bounds
    //Mengatur this.markedForDeletion = true jika rintangan telah melewati batas bawah layar.
    if (this.y > (document.getElementById('gameCanvas')?.height || 600) + 50) {
      this.markedForDeletion = true;
    }
  }

  //Memeriksa apakah rintangan bertabrakan dengan pemain.	Menerapkan algoritma AABB (Axis-Aligned Bounding Box), 
  //yaitu perbandingan empat sisi (kiri, kanan, atas, bawah) antara kotak rintangan dan kotak pemain.
  checkCollision(player) {
    // Simple AABB collision with padding
    //Menambahkan toleransi.	const padding = 10; digunakan untuk sedikit mengecilkan area kotak tabrakan,
    //memberikan margin of error yang membuat permainan terasa lebih adil bagi pemain.
    const padding = 10;
    return (
      player.x - player.width / 2 + padding < this.x + this.width / 2 - padding &&
      player.x + player.width / 2 - padding > this.x - this.width / 2 + padding &&
      player.y - player.height / 2 + padding < this.y + this.height / 2 - padding &&
      player.y + player.height / 2 - padding > this.y - this.height / 2 + padding
    );
  }

  //Menggambar visual rintangan di Canvas.	Menggunakan ctx.translate(this.x, this.y)
  //untuk memposisikan gambar, dan mengambil aset gambar dari AssetLoader.
  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    if (this.type === OBSTACLE_TYPE.BIRD) {
      // Draw Animated Bird
      // Get frame key from SPRITES config
      //Menggambar Burung yang bergerak.	Menggunakan SPRITES.BIRD.FRAMES[this.currentFrame] untuk memilih frame sprite yang sesuai dengan animasi saat ini.
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

  //Gambar alternatif jika aset Burung gagal dimuat.	Menggambar bentuk lingkaran hitam sederhana (seperti siluet burung) dengan mata merah.
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

  //Gambar alternatif jika aset Drone gagal dimuat.	Menggambar bentuk kotak abu-abu sederhana dengan garis luar cyan.
  drawFallbackDrone(ctx) {
    ctx.fillStyle = "#555";
    ctx.fillRect(-20, -20, 40, 40);
    ctx.strokeStyle = PALETTE.CYAN;
    ctx.lineWidth = 2;
    ctx.strokeRect(-20, -20, 40, 40);
  }
}
