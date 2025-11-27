export class AssetLoader {
  constructor() {
    this.assets = {};
  }

  async loadAll() {
    // Simulasi loading aset (karena kita pakai procedural art di canvas)
    // Di masa depan, load images/sounds di sini.
    return new Promise((resolve) => setTimeout(resolve, 1000));
  }
}
