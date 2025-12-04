//Menyediakan konstanta dan akses ke Manajer Game.	Mengimpor CONFIG, PALETTE, 
//SPRITES (untuk dimensi) dan GameManager (untuk mengakses AssetLoader).
import { CONFIG, PALETTE, SPRITES } from "../utils/Constants.js";
import { GameManager } from "../core/GameManager.js";

//Menginisialisasi atau mengatur ulang status koin.	Dipanggil saat objek dibuat atau diambil dari Object Pool.
//Menetapkan dimensi, jalur (laneIndex), kecepatan, dan posisi Y awal di luar layar.
export class Coin {
  constructor(laneIndex = 0, speed = 250) {
    this.reset(laneIndex, speed);
  }

  reset(laneIndex, speed) {
    this.width = SPRITES.COIN.WIDTH;
    this.height = SPRITES.COIN.HEIGHT;

    //Mengontrol lifecycle koin.	this.markedForDeletion menandai koin untuk dikembalikan ke pool.
    //this.needsPositionInit memastikan posisi X di jalur dihitung hanya sekali.
    this.laneIndex = laneIndex;
    this.x = 0;
    this.y = -150;
    this.speed = speed;
    this.markedForDeletion = false;
    this.angle = 0;
    this.needsPositionInit = true; // ALWAYS reset this flag
  }

  //Logika pergerakan dan lifecycle koin per frame.	Perhitungan Posisi X: Pada update pertama, menghitung posisi X koin yang tepat berdasarkan laneIndex dan lebar jalur (CONFIG.LANE_WIDTH). 
  //Pergerakan Y: Menggerakkan koin ke bawah (this.y += this.speed * dt) secara frame-rate-independen. 
  //Pemeriksaan Batas: Mengatur this.markedForDeletion = true jika koin telah melewati batas bawah layar.
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

  //Memeriksa tabrakan antara koin dan pemain.	Menggunakan Math.hypot untuk menghitung jarak pusat-ke-pusat antara koin dan pemain. 
  //Jika jarak ini kurang dari jumlah jari-jari keduanya, maka dianggap terjadi tabrakan (lingkaran).
  checkCollision(player) {
    const dist = Math.hypot(this.x - player.x, this.y - player.y);
    return dist < this.width / 2 + player.width / 2;
  }

  //Menggambar visual koin di Canvas.	Menggunakan ctx.save() dan ctx.translate() untuk memindahkan titik asal gambar ke posisi koin (this.x, this.y) sebelum menggambar. 
  //Mengambil aset gambar ("ITEM_COIN") dari GameManager.instance.assetLoader.
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

  //Menghadirkan koin jika gambar aset gagal dimuat.	
  //Menggambar bentuk koin sederhana (lingkaran kuning emas dengan sedikit detail) menggunakan fungsi gambar dasar Canvas API.
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
