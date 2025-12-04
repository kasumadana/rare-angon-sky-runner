// Mengimpor konstanta penting dan class utility
import { GAME_STATE, SHOP_ITEMS, ASSETS } from "../utils/Constants.js"; // Mengimpor konstanta global seperti state game, item shop, dan asset gambar
import { Storage } from "../utils/Storage.js"; // Mengimpor class Storage untuk menyimpan data lokal (coins, item, highscore, dll
import { AccountManager } from "../managers/AccountManager.js"; // Mengimpor pengelola akun (login, sync cloud, leaderboard, profile)
import { GameManager } from "../core/GameManager.js"; // Mengimpor GameManager (pengatur utama logika game)
import { supabaseService } from "../services/SupabaseService.js"; // Mengimpor layanan Supabase untuk komunikasi ke database cloud

export class UIManager {
  // Mendeklarasikan class UIManager yang menangani semua tampilan dan interaksi UI
  constructor(gameManager) {
    // Constructor dijalankan ketika UIManager dibuat
    this.gm = gameManager; // Menyimpan referensi GameManager ke dalam UIManager

    // Screens
    // Menyimpan referensi semua elemen layar (screen) yang ada di HTML
    this.screens = {
      loading: document.getElementById("screen-loading"), // Screen loading → ditampilkan saat game memuat asset

      menu: document.getElementById("screen-menu"), // Screen menu utama (Start, Shop, Leaderboard, Account)
      shop: document.getElementById("screen-shop"), // Screen untuk tampilan Shop (pilih & beli item)
      gameover: document.getElementById("screen-gameover"), // Screen Game Over (menampilkan score, coins, tombol restart)
      account: document.getElementById("screen-account"), // Screen akun pengguna (login, logout, edit profile, sync)
      leaderboard: document.getElementById("screen-leaderboard"), // Screen leaderboard untuk menampilkan peringkat pemain
    };

    // HUD Elements
    // Bagian elemen HUD (Heads-Up Display) yang muncul saat game dimainkan
    this.scoreEl = document.getElementById("hud-score"); // Mengambil elemen HTML yang menampilkan skor player di layar
    this.coinEl = document.getElementById("hud-coin"); // Mengambil elemen HTML yang menampilkan jumlah koin player di layar

    // Buat AccountManager
    this.accountManager = new AccountManager(this);

    // Cek device mobile
    this.isMobile =
      window.innerWidth < 768 ||
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );

    // Bind event
    this._bindEvents();
  }

  _bindEvents() {
    // Tombol Start
    document.getElementById("btn-start").onclick = () => {
      // Mainkan suara jika tersedia
      if (this.gm.assetLoader && this.gm.assetLoader.sounds) {
        this.gm.playSFX("SELECT");
      }
      // Ganti state ke PLAYING
      this.gm.changeState(GAME_STATE.PLAYING);
    };

    // Tombol Shop
    document.getElementById("btn-shop").onclick = () => {
      this.gm.playSFX("SELECT"); // Mainkan suara
      this._openShop(); // Buka shop
    };

    // Tombol Leaderboard
    document.getElementById("btn-leaderboard").onclick = () => {
      this.gm.playSFX("SELECT"); // Mainkan suara
      this._openLeaderboard(); // Buka leaderboard
    };

    // Tombol Account
    document.getElementById("btn-account").onclick = () => {
      this.gm.playSFX("SELECT"); // Mainkan suara
      this._openAccount(); // Buka account
    };

    // Tombol Shop Previous
    document.getElementById("btn-shop-prev").onclick = () => {
      this.gm.playSFX("SELECT"); // Mainkan suara
      this._navigateShop(-1); // Pergi ke item sebelumnya
    };

    // Tombol Shop Next
    document.getElementById("btn-shop-next").onclick = () => {
      this.gm.playSFX("SELECT"); // Mainkan suara
      this._navigateShop(1); // Pergi ke item berikutnya
    };

    // Tombol Shop Back
    document.getElementById("btn-shop-back").onclick = () => {
      this.gm.playSFX("SELECT"); // Mainkan suara
      this.gm.changeState(GAME_STATE.MENU); // Kembali ke menu utama
    };

    // Tombol Restart
    document.getElementById("btn-restart").onclick = () => {
      this.gm.playSFX("SELECT"); // Mainkan suara
      this.gm.changeState(GAME_STATE.PLAYING); // Mulai ulang permainan
    };

    // Tombol Menu
    document.getElementById("btn-menu").onclick = () => {
      this.gm.playSFX("SELECT"); // Mainkan suara
      this.gm.changeState(GAME_STATE.MENU); // Kembali ke menu utama
    };

    // Tombol Google Login
    document.getElementById("btn-google-login").onclick = async () => {
      this.gm.playSFX("SELECT"); // Mainkan suara
      await this.accountManager.login(); // Login akun
    };

    // Tombol Logout
    document.getElementById("btn-logout").onclick = async () => {
      this.gm.playSFX("SELECT"); // Mainkan suara
      await this.accountManager.logout(); // Logout akun
    };

    // Tombol Sync Data
    document.getElementById("btn-sync-data").onclick = async () => {
      this.gm.playSFX("SELECT"); // Mainkan suara
      await this.accountManager.syncData(); // Sinkronisasi data
      await this.accountManager.updateProfileDisplay(); // Update tampilan profil
    };

    // Tombol Save Username
    document.getElementById("btn-save-username").onclick = async () => {
      this.gm.playSFX("SELECT"); // Mainkan suara
      const newUsername = document
        .getElementById("profile-username-input")
        .value.trim(); // Ambil input username
      if (newUsername && newUsername.length >= 3) {
        await this.accountManager.updateUsername(newUsername); // Update username
      } else {
        alert("⚠️ Username minimal 3 karakter!"); // Peringatan jika terlalu pendek
      }
    };

    // Tombol Account Back
    document.getElementById("btn-account-back").onclick = () => {
      this.gm.playSFX("SELECT"); // Mainkan suara
      this.gm.changeState(GAME_STATE.MENU); // Kembali ke menu utama
    };

    // Tombol Profile Back
    document.getElementById("btn-profile-back").onclick = () => {
      this.gm.playSFX("SELECT"); // Mainkan suara
      this.gm.changeState(GAME_STATE.MENU); // Kembali ke menu utama
    };

   // Tombol Leaderboard Back
document.getElementById("btn-leaderboard-back").onclick = () => {
  this.gm.playSFX("SELECT"); // Mainkan suara
  this.gm.changeState(GAME_STATE.MENU); // Kembali ke menu utama
};

// Tab Leaderboard
const tabBtns = document.querySelectorAll(".tab-btn");
tabBtns.forEach((btn) => {
  btn.onclick = async () => {
    this.gm.playSFX("SELECT"); // Mainkan suara
    tabBtns.forEach((b) => b.classList.remove("active")); // Hapus class active semua tab
    btn.classList.add("active"); // Set tab yang dipilih menjadi active
    const type = btn.dataset.tab; 
    await this._loadLeaderboardData(type); // Load data leaderboard sesuai tab
  };
    });
  }

// Tampilkan / sembunyikan loading screen
showLoading(isLoading) {
  this.screens.loading.style.display = isLoading ? "flex" : "none";
}

// Update UI sesuai state permainan
updateUIState(state) {
  // Sembunyikan semua screen
  Object.values(this.screens).forEach((screen) => {
    if (screen) screen.style.display = "none";
  });

  // Tampilkan HUD hanya saat bermain
  const hud = document.getElementById("ui-hud");
  if (hud) {
    hud.style.display = state === GAME_STATE.PLAYING ? "block" : "none";
  }


   // Toggle Webcam & Mobile Controls
const webcamContainer = document.querySelector(".webcam-container");
const mobileControls = document.getElementById("mobile-controls");

if (state === GAME_STATE.PLAYING) {
  // Webcam hanya tampil jika bukan mobile
  if (webcamContainer) {
    webcamContainer.style.display = this.isMobile ? "none" : "block";
  }

  // Mobile controls hanya tampil jika mobile
  if (mobileControls) {
    mobileControls.style.display = this.isMobile ? "flex" : "none";
  }
} else {
  // Sembunyikan keduanya di menu atau screen lain
  if (webcamContainer) webcamContainer.style.display = "none";
  if (mobileControls) mobileControls.style.display = "none";
}

    // Tampilkan screen spesifik
switch (state) {
  case GAME_STATE.LOADING:
    this.screens.loading.style.display = "flex"; // Loading screen
    break;
  case GAME_STATE.MENU:
    this.screens.menu.style.display = "flex"; // Menu screen
    this._updateMenuDisplay(); // Update profil & coins
    break;
  case GAME_STATE.SHOP:
    this.screens.shop.style.display = "flex"; // Shop screen
    this.currentShopIndex = 0; // Reset index item
    this._renderShop(); // Render item pertama
    break;
  case GAME_STATE.GAMEOVER:
    this.screens.gameover.style.display = "flex"; // Game Over screen
    this._updateGameOverStats(); // Update skor & koin
    break;
    }
  }

// Update tampilan menu (coins & profil)
async _updateMenuDisplay() {
  const menuCoinsEl = document.getElementById("menu-coins");
  const userProfileEl = document.getElementById("user-profile");
  const userNameEl = document.getElementById("user-name");

  if (this.accountManager?.isLoggedIn) {
    userProfileEl.style.display = "flex"; // Tampilkan profil
    const username = this.accountManager.getDisplayUsername();
    userNameEl.textContent = username;

    try {
      const { profile } = await this.accountManager.loadProfile();
      if (profile) {
        menuCoinsEl.innerText = profile.total_coins || 0; // Coins dari profil
        Storage.setCoins(profile.total_coins || 0);
      } else {
        menuCoinsEl.innerText = Storage.getCoins(); // Coins lokal
      }
    } catch (e) {
      menuCoinsEl.innerText = Storage.getCoins(); // Fallback coins
    }
  } else {
    userProfileEl.style.display = "none"; // Sembunyikan profil
    menuCoinsEl.innerText = Storage.getCoins();
  }
}

// Update HUD saat bermain
updateHUD(score, coins) {
  if (this.scoreEl) this.scoreEl.innerText = score.toString().padStart(5, "0");
  if (this.coinEl) this.coinEl.innerText = coins;
}

// Update statistik Game Over
_updateGameOverStats() {
  document.getElementById("go-score").innerText = Math.floor(this.gm.score);
  document.getElementById("go-high").innerText = Storage.getHighScore();
  document.getElementById("go-coin").innerText = this.gm.coinsCollected;
}

// Buka Shop
_openShop() {
  this.screens.shop.style.display = "flex";
  this.currentShopIndex = 0; // Reset ke item pertama
  this._renderShop(); // Render item
}

// Navigasi Shop (prev/next)
_navigateShop(direction) {
  this.currentShopIndex += direction;
  if (this.currentShopIndex < 0) this.currentShopIndex = SHOP_ITEMS.length - 1;
  if (this.currentShopIndex >= SHOP_ITEMS.length) this.currentShopIndex = 0;
  this._renderShop(); // Render item baru
}

// Render item shop
_renderShop() {
  const container = document.getElementById("shop-item-display");
  const shopCoins = document.getElementById("shop-coins");
  shopCoins.innerText = Storage.getCoins(); // Update coins

  const item = SHOP_ITEMS[this.currentShopIndex];
  const isOwned = Storage.isItemOwned(item.id);
  const isSelected = Storage.getSelectedItem() === item.id;
  const canBuy = Storage.getCoins() >= item.cost;

  let btnText = "";
  let btnClass = "btn-retro";
  let btnDisabled = false;

  // Tentukan status tombol
  if (isSelected) {
    btnText = "TERPASANG";
    btnClass = "btn-retro secondary";
    btnDisabled = true;
  } else if (isOwned) {
    btnText = "PAKAI";
    btnClass = "btn-retro primary";
  } else {
    btnText = `BELI (${item.cost})`;
    if (!canBuy) {
      btnClass = "btn-retro secondary";
      btnDisabled = true;
    } else {
      btnClass = "btn-retro primary";
    }
  }

  const imgSrc = ASSETS.IMAGES[item.imageKey] || "assets/images/kite_bebean.png";

  // Render item
  container.innerHTML = `
    <img src="${imgSrc}" alt="${item.name}">
    <h3>${item.name}</h3>
    <p>${item.description}</p>
    <button id="btn-shop-action" class="${btnClass}" style="width: 100%; padding: 12px;">${btnText}</button>
  `;

  const btn = document.getElementById("btn-shop-action");
  if (btnDisabled) btn.disabled = true;

  // Klik tombol shop
  btn.onclick = async () => {
    if (isOwned) {
      this.gm.playSFX("SELECT"); // Suara pilih
      Storage.setSelectedItem(item.id); // Set item terpasang
      if (this.accountManager.isLoggedIn) await supabaseService.equipItem(item.id);
      this._renderShop(); // Update tampilan
    } else {
      if (Storage.spendCoins(item.cost)) {
        this.gm.playSFX("BUY"); // Suara beli
        Storage.saveOwnedItem(item.id); // Simpan kepemilikan
        Storage.setSelectedItem(item.id); // Set terpasang

        if (this.accountManager.isLoggedIn) {
          try {
            await supabaseService.purchaseItem(item.id, item.cost); // Cloud purchase
            await supabaseService.equipItem(item.id);
          } catch (e) {
            console.error("Cloud purchase failed:", e);
          }
        }
        this._renderShop(); // Update tampilan
      } else {
        alert("Koin tidak cukup!"); // Alert koin kurang
      }
    }
  };
}

// Buka Account
_openAccount() {
  this.screens.account.style.display = "flex";
  this.accountManager.updateUI(); // Update UI akun
}

// Buka Leaderboard
async _openLeaderboard() {
  this.screens.leaderboard.style.display = "flex";
  await this._loadLeaderboardData("global"); // Load data default
}

// Load data leaderboard
async _loadLeaderboardData(type) {
  const container = document.getElementById("leaderboard-content");
  container.innerHTML =
    '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Memuat...</div>'; // Loading

  const entries = await this.accountManager.loadLeaderboard(type); // Ambil data
  this.accountManager.renderLeaderboard(entries, container); // Render di UI
  }
}
