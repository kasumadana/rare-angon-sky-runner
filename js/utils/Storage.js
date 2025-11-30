import { supabaseService } from '../services/SupabaseService.js';

export class Storage {
  static getHighScore() {
    return parseInt(localStorage.getItem("ra_highscore")) || 0;
  }

  static setHighScore(score) {
    localStorage.setItem("ra_highscore", score);
  }

  static getCoins() {
    return parseInt(localStorage.getItem("ra_coins")) || 0;
  }

  static setCoins(amount) {
    localStorage.setItem("ra_coins", amount);
  }

  static addCoins(amount) {
    const current = this.getCoins();
    localStorage.setItem("ra_coins", current + amount);
  }

  static getOwnedItems() {
    const items = localStorage.getItem("ra_owned_items");
    return items ? JSON.parse(items) : ["bebean_std"];
  }

  static isItemOwned(itemId) {
    const items = this.getOwnedItems();
    return items.includes(itemId);
  }

  static saveOwnedItem(itemId) {
    const items = this.getOwnedItems();
    if (!items.includes(itemId)) {
      items.push(itemId);
      localStorage.setItem("ra_owned_items", JSON.stringify(items));
    }
  }

  static getSelectedItem() {
    return localStorage.getItem("ra_selected_item") || "bebean_std";
  }

  static setSelectedItem(itemId) {
    localStorage.setItem("ra_selected_item", itemId);
  }

  static spendCoins(amount) {
    const current = this.getCoins();
    if (current >= amount) {
      localStorage.setItem("ra_coins", current - amount);
      return true;
    }
    return false;
  }
}
