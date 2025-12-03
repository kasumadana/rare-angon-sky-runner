import { ASSETS } from "../utils/Constants.js";
import { GameManager } from "../core/GameManager.js";

export class AudioManager {
  constructor() {
    this.bgm = null;
    this.isMuted = false;
    this.volume = 0.5;
  }

  playBGM() {
// Tempat sementara buat logika BGM (Musik Latar)
// Nanti, kita akan ambil file BGM di 'AssetLoader' terus diputar di sini
// Contohnya:
// const bgm = GameManager.instance.assetLoader.getSound("BGM_MAIN"); // Ambil suara BGM utama
// if (bgm) {
//   bgm.loop = true; // BGM-nya diputar berulang-ulang (looping)
//   bgm.volume = this.volume * 0.5; // Volume BGM biasanya agak dikecilin (setengahnya)
//   bgm.play().catch(e => console.log("Gagal putar audio (perlu interaksi dari pengguna)")); // Coba putar, kalau gagal kasih tahu (biasanya karena perlu klik dari pengguna dulu)
//   this.bgm = bgm; // Simpan objek BGM-nya
// }
    console.log("🎵 BGM Placeholder: Playing background music...");
  }

  stopBGM() {
    if (this.bgm) {
      this.bgm.pause();
      this.bgm.currentTime = 0;
    }
  }

  playSFX(key) {
    if (this.isMuted) return;

    const sound = GameManager.instance.assetLoader.getSound(key);
    if (sound) {
      // Gandakan untuk memungkinkan suara saling tumpang tindih (misalnya, saat cepat-cepat ambil koin).
      const clone = sound.cloneNode(true);
      clone.volume = this.volume;
      clone.play().catch(e => {});
    } else {
      console.warn(`🔊 SFX not found: ${key}`);
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopBGM();
    } else {
      this.playBGM();
    }
    return this.isMuted;
  }
}
