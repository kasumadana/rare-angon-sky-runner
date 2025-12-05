//pernyataan import dari JavaScript untuk mengambil objek dari assets berkas.
import { ASSETS } from "../utils/Constants.js";

//Metode khusus yang dipanggil saat objek AssetLoader baru dibuat dan menganalisis properti properti pada objek.
export class AssetLoader {
  constructor() {
    this.images = {}; //Membuat objek kosong images untuk menyimpan objek gambar
    this.sounds = {}; //Membuat objek kosong sounds untuk menyimpan objek audio
    this.loadedCount = 0; //Menghitung jumlah total aset (gambar dan suara) yang sudah selesai dimuat
    this.totalAssets = 0; //Menghitung jumlah total aset yang harus dimuat
  }

  //Metode utama berjenis async (asinkron) yang mengatur seluruh proses pemuatan.
  async loadAll() {
    const imageKeys = Object.keys(ASSETS.IMAGES);
    const soundKeys = Object.keys(ASSETS.SOUNDS);

    this.totalAssets = imageKeys.length + soundKeys.length;
    console.log(`⏳ Starting load of ${this.totalAssets} assets...`); //Mencetak pesan ke konsol yang menunjukkan proses pemuatan telah dimulai

    const imagePromises = imageKeys.map((key) =>
      this.loadImage(key, ASSETS.IMAGES[key])
    );

    const soundPromises = soundKeys.map((key) =>
      this.loadSound(key, ASSETS.SOUNDS[key])
    );

    try {
      await Promise.all([...imagePromises, ...soundPromises]);
      console.log("✅ All assets loaded successfully!"); //Mencetak pesan sukses ke konsol jika semua aset dimuat tanpa kesalahan yang menghentikan proses
    } catch (error) {
      console.error(
        "⚠️ Some assets failed to load, game will continue with fallbacks.",
        error
      );
    }
  }

  //Metode yang memuat satu berkas gambar, mengembalikan sebuah Promise dan dapat membuat objek image baru.
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

  //Metode yang memuat satu berkas suara, mengembalikan sebuah Promise dan dapat membuat objek audio baru.
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

      // Timeout fallback jika suara terlalu lama (kebijakan browser atau jaringan)
      setTimeout(() => {
        if (!this.sounds[key]) {
          // console.warn(`Sound load timeout: ${key}`);
          this.sounds[key] = audio; // Try to use it anyway
          resolve(audio);
        }
      }, 2000);
    });
  }

  //Metode getter sederhana untuk mengamnbil objek image yang sudah dimuat dari koleksi this.image.
  getImage(key) {
    return this.images[key];
  }

  //Metode getter sederhana untuk mengambil objek audio yang sudah dimuat dari koleksi this.sounds.
  getSound(key) {
    return this.sounds[key];
  }
}
