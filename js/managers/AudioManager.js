import { ASSETS } from "../utils/Constants.js";
import { GameManager } from "../core/GameManager.js";

export class AudioManager {
  constructor() {
    this.bgm = null;
    this.isMuted = false;
    this.volume = 0.5;
  }

  playBGM() {
    // Placeholder for BGM logic
    // In the future, load a BGM file in AssetLoader and play it here
    // Example:
    // const bgm = GameManager.instance.assetLoader.getSound("BGM_MAIN");
    // if (bgm) {
    //   bgm.loop = true;
    //   bgm.volume = this.volume * 0.5; // BGM usually quieter
    //   bgm.play().catch(e => console.log("Audio play failed (user interaction needed)"));
    //   this.bgm = bgm;
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
      // Clone to allow overlapping sounds (e.g. rapid coin collection)
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
