import { supabaseService } from '../services/SupabaseService.js';

export class Storage {
  // Mengambil skor tertinggi dari penyimpanan lokal
  static getHighScore() {
    return parseInt(localStorage.getItem("ra_highscore")) || 0;
  }

  // Menyimpan skor tertinggi ke penyimpanan lokal
  static setHighScore(score) {
    localStorage.setItem("ra_highscore", score);
  }

  // Mengambil jumlah koin dari penyimpanan lokal
  static getCoins() {
    return parseInt(localStorage.getItem("ra_coins")) || 0;
  }

  // Mengatur jumlah koin di penyimpanan lokal
  static setCoins(amount) {
    localStorage.setItem("ra_coins", amount);
  }

  // Menambahkan koin ke jumlah yang ada
  static addCoins(amount) {
    const current = this.getCoins();
    localStorage.setItem("ra_coins", current + amount);
  }

  // Mengambil daftar item yang dimiliki
  static getOwnedItems() {
    const items = localStorage.getItem("ra_owned_items");
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
      localStorage.setItem("ra_owned_items", JSON.stringify(items));
    }
  }

  // Mengambil item yang sedang dipilih/digunakan
  static getSelectedItem() {
    return localStorage.getItem("ra_selected_item") || "bebean_std";
  }

  // Mengatur item yang sedang dipilih/digunakan
  static setSelectedItem(itemId) {
    localStorage.setItem("ra_selected_item", itemId);
  }

  // Mengurangi koin untuk pembelian item
  static spendCoins(amount) {
    const current = this.getCoins();
    if (current >= amount) {
      localStorage.setItem("ra_coins", current - amount);
      return true; // Pembelian berhasil
    }
    return false; // Koin tidak cukup
  }
}
