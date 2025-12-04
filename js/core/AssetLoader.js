import { ASSETS } from "../utils/Constants.js";

export class AssetLoader {
  constructor() {
    this.images = {};
    this.sounds = {};
    this.loadedCount = 0;
    this.totalAssets = 0;
  }

  async loadAll() {
    const imageKeys = Object.keys(ASSETS.IMAGES);
    const soundKeys = Object.keys(ASSETS.SOUNDS);

    this.totalAssets = imageKeys.length + soundKeys.length;
    console.log(`⏳ Starting load of ${this.totalAssets} assets...`);

    const imagePromises = imageKeys.map((key) =>
      this.loadImage(key, ASSETS.IMAGES[key])
    );

    const soundPromises = soundKeys.map((key) =>
      this.loadSound(key, ASSETS.SOUNDS[key])
    );

    try {
      await Promise.all([...imagePromises, ...soundPromises]);
      console.log("✅ All assets loaded successfully!");
    } catch (error) {
      console.error(
        "⚠️ Some assets failed to load, game will continue with fallbacks.",
        error
      );
    }
  }

  loadImage(key, url) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        this.images[key] = img;
        this.loadedCount++;
        // console.log(`Loaded image: ${key}`);
        resolve(img);
      };
      img.onerror = (e) => {
        console.error(`❌ Failed to load image: ${key} (${url})`);
        this.images[key] = null; // Mark as null so we know to use fallback
        this.loadedCount++;
        resolve(null); // Resolve anyway to not block Promise.all
      };
      img.src = url;
    });
  }

  loadSound(key, url) {
    return new Promise((resolve) => {
      const audio = new Audio();
      audio.oncanplaythrough = () => {
        this.sounds[key] = audio;
        this.loadedCount++;
        // console.log(`Loaded sound: ${key}`);
        resolve(audio);
      };
      audio.onerror = (e) => {
        console.warn(`❌ Failed to load sound: ${key} (${url})`);
        this.sounds[key] = null;
        this.loadedCount++;
        resolve(null);
      };

      // Setup for loading
      audio.preload = "auto";
      audio.src = url;
      audio.load();

      // Timeout fallback if sound takes too long (browser policy or network)
      setTimeout(() => {
        if (!this.sounds[key]) {
          // console.warn(`Sound load timeout: ${key}`);
          this.sounds[key] = audio; // Try to use it anyway
          resolve(audio);
        }
      }, 2000);
    });
  }

  getImage(key) {
    return this.images[key];
  }

  getSound(key) {
    return this.sounds[key];
  }
}
