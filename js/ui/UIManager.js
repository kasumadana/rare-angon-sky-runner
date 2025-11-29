import { GAME_STATE, SHOP_ITEMS, ASSETS } from "../utils/Constants.js";
import { Storage } from "../utils/Storage.js";
import { AccountManager } from "../managers/AccountManager.js";
import { GameManager } from "../core/GameManager.js";

export class UIManager {
  constructor(gameManager) {
    this.gm = gameManager;

    // Screens
    this.screens = {
      loading: document.getElementById("screen-loading"),
      menu: document.getElementById("screen-menu"),
      shop: document.getElementById("screen-shop"),
      gameover: document.getElementById("screen-gameover"),
      account: document.getElementById("screen-account"),
      leaderboard: document.getElementById("screen-leaderboard"),
    };

    // HUD Elements
    this.scoreEl = document.getElementById("hud-score");
    this.coinEl = document.getElementById("hud-coin");

    // Account Manager
    this.accountManager = new AccountManager(this);

    this._bindEvents();
  }

  _bindEvents() {
    // Main Menu
    document.getElementById("btn-start").onclick = () => {
      if (this.gm.assetLoader && this.gm.assetLoader.sounds) {
        this.gm.playSFX('SELECT'); 
      }
      this.gm.changeState(GAME_STATE.PLAYING);
    };
    
    document.getElementById("btn-shop").onclick = () => {
      this.gm.playSFX('SELECT');
      this._openShop();
    };
    
    document.getElementById("btn-leaderboard").onclick = () => {
      this.gm.playSFX('SELECT');
      this._openLeaderboard();
    };
    
    document.getElementById("btn-account").onclick = () => {
      this.gm.playSFX('SELECT');
      this._openAccount();
    };

    // Shop
    document.getElementById("btn-shop-back").onclick = () => {
      this.gm.playSFX('SELECT');
      this.gm.changeState(GAME_STATE.MENU);
    };

    // Game Over
    document.getElementById("btn-restart").onclick = () => {
      this.gm.playSFX('SELECT');
      this.gm.changeState(GAME_STATE.PLAYING);
    };
    
    document.getElementById("btn-menu").onclick = () => {
      this.gm.playSFX('SELECT');
      this.gm.changeState(GAME_STATE.MENU);
    };
    
    // Account Buttons
    document.getElementById("btn-google-login").onclick = async () => {
      this.gm.playSFX('SELECT');
      await this.accountManager.login();
    };

    document.getElementById("btn-logout").onclick = async () => {
      this.gm.playSFX('SELECT');
      await this.accountManager.logout();
    };

    document.getElementById("btn-sync-data").onclick = async () => {
      this.gm.playSFX('SELECT');
      await this.accountManager.syncData();
      await this.accountManager.updateProfileDisplay();
    };

    document.getElementById("btn-save-username").onclick = async () => {
      this.gm.playSFX('SELECT');
      const newUsername = document.getElementById("profile-username-input").value.trim();
      if (newUsername && newUsername.length >= 3) {
        await this.accountManager.updateUsername(newUsername);
      } else {
        alert('⚠️ Username minimal 3 karakter!');
      }
    };

    document.getElementById("btn-account-back").onclick = () => {
      this.gm.playSFX('SELECT');
      this.gm.changeState(GAME_STATE.MENU);
    };

    document.getElementById("btn-profile-back").onclick = () => {
      this.gm.playSFX('SELECT');
      this.gm.changeState(GAME_STATE.MENU);
    };

    // Leaderboard
    document.getElementById("btn-leaderboard-back").onclick = () => {
      this.gm.playSFX('SELECT');
      this.gm.changeState(GAME_STATE.MENU);
    };

    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
      btn.onclick = async () => {
        this.gm.playSFX('SELECT');
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const type = btn.dataset.tab;
        await this._loadLeaderboardData(type);
      };
    });
  }

  showLoading(isLoading) {
    this.screens.loading.style.display = isLoading ? "flex" : "none";
  }

  updateUIState(state) {
    // Hide all screens
    Object.values(this.screens).forEach(screen => {
      if (screen) screen.style.display = "none";
    });
    
    // Show HUD only in game
    const hud = document.getElementById("ui-hud");
    if (hud) {
      hud.style.display = (state === GAME_STATE.PLAYING) ? "block" : "none";
    }
    
    // Show specific screen
    switch (state) {
      case GAME_STATE.LOADING:
        this.screens.loading.style.display = "flex";
        break;
      case GAME_STATE.MENU:
        this.screens.menu.style.display = "flex";
        this._updateMenuDisplay();
        break;
      case GAME_STATE.SHOP:
        this.screens.shop.style.display = "flex";
        this._renderShop();
        break;
      case GAME_STATE.GAMEOVER:
        this.screens.gameover.style.display = "flex";
        this._updateGameOverStats();
        break;
    }
  }

  async _updateMenuDisplay() {
    const menuCoinsEl = document.getElementById("menu-coins");
    const userProfileEl = document.getElementById("user-profile");
    const userNameEl = document.getElementById("user-name");
    
    if (this.accountManager?.isLoggedIn) {
      userProfileEl.style.display = "flex";
      const username = this.accountManager.getDisplayUsername();
      userNameEl.textContent = username;
      
      try {
        const { profile } = await this.accountManager.loadProfile();
        if (profile) {
          menuCoinsEl.innerText = profile.total_coins || 0;
          Storage.setCoins(profile.total_coins || 0);
        } else {
          menuCoinsEl.innerText = Storage.getCoins();
        }
      } catch (e) {
        menuCoinsEl.innerText = Storage.getCoins();
      }
    } else {
      userProfileEl.style.display = "none";
      menuCoinsEl.innerText = Storage.getCoins();
    }
  }

  updateHUD(score, coins) {
    if (this.scoreEl) this.scoreEl.innerText = score.toString().padStart(5, "0");
    if (this.coinEl) this.coinEl.innerText = coins;
  }

  _updateGameOverStats() {
    document.getElementById("go-score").innerText = Math.floor(this.gm.score);
    document.getElementById("go-high").innerText = Storage.getHighScore();
    document.getElementById("go-coin").innerText = this.gm.coinsCollected;
  }

  _openShop() {
    this.screens.shop.style.display = "flex";
    this._renderShop();
  }

  _renderShop() {
    const container = document.getElementById("shop-items");
    const shopCoins = document.getElementById("shop-coins");
    shopCoins.innerText = Storage.getCoins();

    container.innerHTML = "";
    
    SHOP_ITEMS.forEach((item) => {
      const div = document.createElement("div");
      div.className = "shop-item";

      const isOwned = Storage.isItemOwned(item.id);
      const isSelected = Storage.getSelectedItem() === item.id;
      const canBuy = Storage.getCoins() >= item.cost;

      let btnText = "";
      let btnClass = "btn-retro";
      let btnDisabled = false;

      if (isSelected) {
        btnText = "✅ TERPASANG";
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

      // FIX: Use direct path from ASSETS instead of relying on loaded image object
      const imgSrc = ASSETS.IMAGES[item.imageKey] || "assets/images/kite_bebean.png";

      div.innerHTML = `
        <div class="shop-item-icon">
          <img src="${imgSrc}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: contain;">
        </div>
        <span style="font-weight: bold; font-size: 10px; margin: 5px 0;">${item.name}</span>
        <span style="font-size: 8px; color: #666; margin-bottom: 10px;">${item.description}</span>
        <button class="${btnClass}" style="width: 100%; padding: 8px;">${btnText}</button>
      `;

      const btn = div.querySelector("button");
      if (btnDisabled) btn.disabled = true;

      btn.onclick = () => {
        if (isOwned) {
          this.gm.playSFX('SELECT');
          Storage.setSelectedItem(item.id);
          this._renderShop();
        } else {
          if (Storage.spendCoins(item.cost)) {
            this.gm.playSFX('BUY');
            Storage.saveOwnedItem(item.id);
            Storage.setSelectedItem(item.id);
            this._renderShop();
          } else {
            alert("Koin tidak cukup!");
          }
        }
      };

      container.appendChild(div);
    });
  }

  _openAccount() {
    this.screens.account.style.display = "flex";
    this.accountManager.updateUI();
  }

  async _openLeaderboard() {
    this.screens.leaderboard.style.display = "flex";
    await this._loadLeaderboardData('global');
  }

  async _loadLeaderboardData(type) {
    const container = document.getElementById('leaderboard-content');
    container.innerHTML = '<div class="loading-spinner">⏳ Memuat...</div>';

    const entries = await this.accountManager.loadLeaderboard(type);
    this.accountManager.renderLeaderboard(entries, container);
  }
}
