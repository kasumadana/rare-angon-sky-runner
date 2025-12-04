import { ASSETS } from "../utils/Constants.js"; // Daftar aset (suara, gambar, dll.)
import { GameManager } from "../core/GameManager.js"; // Butuh ini untuk akses loader aset

export class AudioManager {
  constructor() {
    this.bgm = null; // Tempat menyimpan objek Musik Latar (Background Music)
    this.isMuted = false; // Status suara: Mati (true) atau Nyala (false)?
    this.volume = 0.5; // Level volume standar (setengah)
  }

  playBGM() {
    // Ini cuma tempat sementara (placeholder) untuk memutar Musik Latar
    // Nanti, kita ambil file BGM dari si "AssetLoader" terus langsung putar di sini.
    // Contoh logikanya:
    // const bgm = GameManager.instance.assetLoader.getSound("BGM_MAIN"); // Ambil suara BGM utama
    // if (bgm) {
    //   bgm.loop = true; // Musiknya diputar berulang-ulang terus
    //   bgm.volume = this.volume * 0.5; // Volume BGM sengaja dikecilin sedikit (setengah dari volume total)
    //   bgm.play().catch(e => console.log("Gagal putar audio (coba klik layar dulu ya)")); // Coba putar. Kalau gagal (biasanya browser minta pengguna klik dulu), kasih tahu.
    //   this.bgm = bgm; // Simpan objek BGM-nya biar bisa kita kontrol nanti
    // }
    console.log("🎵 BGM Sambil Nunggu: Musik latar diputar..."); // Pesan kalau BGM sedang dimainkan
  }

  stopBGM() {
    if (this.bgm) { // Kalau ada BGM yang sedang jalan
      this.bgm.pause(); // Jeda (pause) musiknya
      this.bgm.currentTime = 0; // Kembalikan ke detik awal (reset)
    }
  }

  playSFX(key) {
    if (this.isMuted) return; // Kalau lagi di-mute, enggak usah putar efek suara (SFX)

    const sound = GameManager.instance.assetLoader.getSound(key); // Ambil efek suara yang diminta (berdasarkan 'key')
    if (sound) {
      // Kita "duplikat" dulu suaranya biar bisa diputar berkali-kali tanpa menunggu selesai 
      // (misalnya saat klik banyak koin secara cepat)
      const clone = sound.cloneNode(true); 
      clone.volume = this.volume; // Set volume-nya
      clone.play().catch(e => {}); // Mainkan! (Error diabaikan, biasanya terkait browser)
    } else {
      console.warn(`🔊 Efek Suara (SFX) tidak ditemukan: ${key}`); // Kasih peringatan kalau suara enggak ada
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted; // Balikkan status Mute (true jadi false, false jadi true)
    if (this.isMuted) {
      this.stopBGM(); // Kalau sekarang di-mute, matikan BGM
    } else {
      this.playBGM(); // Kalau sekarang tidak di-mute, putar BGM lagi
    }
    return this.isMuted; // Kembalikan status mute yang baru
  }
}
