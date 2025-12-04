import { CONFIG, LANES, SPRITES } from "../utils/Constants.js";
import { GameManager } from "../core/GameManager.js";

//Menginisialisasi posisi, dimensi, dan skin pemain.	Menetapkan this.width dan this.height.
//Menghitung posisi X awal di tengah layar (canvasWidth / 2) dan posisi Y awal di bagian bawah layar (CONFIG.CANVAS_HEIGHT - 150).
export class Player {
  constructor(skinId = "bebean_std") {
    this.width = SPRITES.PLAYER.WIDTH;
    this.height = SPRITES.PLAYER.HEIGHT;
    
    // FIX: Use dynamic canvas width if available, else fallback to CONFIG
    const canvas = document.getElementById('gameCanvas');
    const canvasWidth = canvas ? canvas.width : CONFIG.CANVAS_WIDTH;
    
    this.x = canvasWidth / 2;
    this.y = CONFIG.CANVAS_HEIGHT - 150;

    //Mengelola posisi jalur pemain.	this.currentLane (jalur saat ini, misalnya 0, 1, atau 2). this.targetX adalah koordinat X tujuan yang diinginkan.
    this.currentLane = LANES.CENTER;
    this.targetX = this.x;

    //Mengelola tampilan visual pemain.	this.skinId (ID yang dipilih pengguna, mis. 'bebean_std'). this.skinKey (kunci aset yang sesuai, mis. 'SKIN_BEBEAN') yang didapatkan melalui _getSkinKey.
    this.skinId = skinId;
    this.skinKey = this._getSkinKey(skinId);
  }

  //Penerjemah ID SkinMenerjemahkan ID skin yang ramah pengguna ('pecukan_agile') menjadi kunci aset yang dapat digunakan untuk memuat gambar ('SKIN_PECUKAN').
  _getSkinKey(id) {
    switch(id) {
      case 'pecukan_agile': return 'SKIN_PECUKAN';
      case 'janggan_legend': return 'SKIN_KUWIR';
      default: return 'SKIN_BEBEAN';
    }
  }

  //Logika pergerakan halus dan animasi per frame.	Pergerakan Halus: Menggerakkan posisi X pemain secara bertahap menuju this.targetX.
  //Rumus this.x += (this.targetX - this.x) * speed menciptakan efek "smoothing" (meluncur) ke jalur target, bukan lompatan instan.
  update(dt) {
    // Smooth movement
    const speed = 15 * dt;
    this.x += (this.targetX - this.x) * speed;
    
    // Bobbing animation
    //Menciptakan efek gerakan mengambang.	Menggunakan Math.sin(Date.now() / 200) * 5 untuk mengubah posisi Y sedikit demi sedikit secara sinusoidal, meniru gerakan naik-turun yang ringan.
    this.y = (CONFIG.CANVAS_HEIGHT - 150) + Math.sin(Date.now() / 200) * 5;
  }

  //Menggambar visual pemain di Canvas.	Mengambil kunci aset (this.skinKey) dan mendapatkan gambar dari GameManager.instance.assetLoader.
  //Menggunakan ctx.drawImage untuk menggambar skin pemain di posisi X dan Y yang sudah di-update.
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
      //Visualisasi jika aset gambar gagal dimuat.	Jika gambar aset tidak tersedia, ia menggambar kotak berwarna merah sederhana di posisi pemain.
      ctx.fillStyle = "red";
      ctx.fillRect(
        this.x - this.width / 2, 
        this.y - this.height / 2, 
        this.width, 
        this.height
      );
    }
  }
//Antarmuka publik untuk pergerakan.	Memeriksa apakah jalur yang dituju valid (tidak melewati batas LANES.LEFT atau LANES.RIGHT) sebelum memanggil moveLane().
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

  //Logika perubahan jalur.	Menerima -1 (kiri) atau 1 (kanan). Jika jalur baru valid, ia memperbarui this.currentLane, memanggil _updateTargetX() untuk mengatur koordinat X tujuan, dan memainkan SFX 'WHOOSH'.
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

  //Menghitung koordinat X tujuan.	Mengambil lebar Canvas terbaru.
  //Menghitung this.targetX dengan mengambil pusat layar (center) dan menambah atau menguranginya dengan CONFIG.LANE_WIDTH (lebar jarak antar jalur) sesuai dengan this.currentLane yang baru.
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
