import { supabaseService } from '../services/SupabaseService.js';
export class Storage {
  // Helper internal untuk akses localStorage yang aman
  static _safeGet(key) {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn(`Storage access restriction for ${key}:`, e);
      return null;
    }
  }

  static _safeSet(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn(`Storage write restriction for ${key}:`, e);
    }
  }

  // Mengambil skor tertinggi dari penyimpanan lokal
  static getHighScore() {
    return parseInt(this._safeGet("ra_highscore")) || 0;
  }

  // Menyimpan skor tertinggi ke penyimpanan lokal
  static setHighScore(score) {
    this._safeSet("ra_highscore", score);
  }

  // Mengambil jumlah koin dari penyimpanan lokal
  static getCoins() {
    return parseInt(this._safeGet("ra_coins")) || 0;
  }

  // Mengatur jumlah koin di penyimpanan lokal
  static setCoins(amount) {
    this._safeSet("ra_coins", amount);
  }

  // Menambahkan koin ke jumlah yang ada
  static addCoins(amount) {
    const current = this.getCoins();
    this._safeSet("ra_coins", current + amount);
  }

  // Mengambil daftar item yang dimiliki
  static getOwnedItems() {
    const items = this._safeGet("ra_owned_items");
    return items ? JSON.parse(items) : ["bebean_std"];
  }

  // Memeriksa apakah item tertentu sudah dimiliki
  static isItemOwned(itemId) {
    const items = this.getOwnedItems();
    return items.includes(itemId);
  }

  // Menyimpan item baru ke daftar item yang dimiliki
  static saveOwnedItem(itemId) {
    const items = this.getOwnedItems();
    if (!items.includes(itemId)) {
      items.push(itemId);
      this._safeSet("ra_owned_items", JSON.stringify(items));
    }
  }

  // Mengambil item yang sedang dipilih/digunakan
  static getSelectedItem() {
    return this._safeGet("ra_selected_item") || "bebean_std";
  }

  // Mengatur item yang sedang dipilih/digunakan
  static setSelectedItem(itemId) {
    this._safeSet("ra_selected_item", itemId);
  }

  // Mengurangi koin untuk pembelian item
  static spendCoins(amount) {
    const current = this.getCoins();
    if (current >= amount) {
      this._safeSet("ra_coins", current - amount);
      return true; // Pembelian berhasil
    }
    return false; // Koin tidak cukup
  }
}
