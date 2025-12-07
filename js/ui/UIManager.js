//mengatur tampilan game tampilan, hud
// Mengimpor konstanta penting dan class utility
import { GAME_STATE, SHOP_ITEMS, ASSETS } from "../utils/Constants.js";
import { Storage } from "../utils/Storage.js";
import { AccountManager } from "../managers/AccountManager.js";
import { GameManager } from "../core/GameManager.js";
import { supabaseService } from "../services/SupabaseService.js";

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
      info: document.getElementById("screen-info"),
      paused: document.getElementById("screen-paused"),
    };

    // HUD Elements
    this.scoreEl = document.getElementById("hud-score");
    this.coinEl = document.getElementById("hud-coin");
    this.miniLeaderboardEl = document.getElementById("mini-leaderboard");

    this.accountManager = new AccountManager(this);

    this.isMobile =
      window.innerWidth < 768 ||
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );

    this._bindEvents();
  }

  _bindEvents() {
    // Tombol Start
    const btnStart = document.getElementById("btn-start");
    if (btnStart) {
        btnStart.onclick = async () => {
            if (this.gm.assetLoader && this.gm.assetLoader.sounds) {
                this.gm.playSFX("SELECT");
            }
            this.gm.changeState(GAME_STATE.PLAYING);
            if (!this.isMobile) await this._updateMiniLeaderboard();
        };
    }

    // Tombol Shop
    const btnShop = document.getElementById("btn-shop");
    if (btnShop) {
        btnShop.onclick = () => {
            this.gm.playSFX("SELECT"); 
            this._openShop(); 
        };
    }

    // Tombol Leaderboard
    const btnLeaderboard = document.getElementById("btn-leaderboard");
    if (btnLeaderboard) {
        btnLeaderboard.onclick = () => {
            this.gm.playSFX("SELECT"); 
            this._openLeaderboard(); 
        };
    }

    // Tombol Account
    const btnAccount = document.getElementById("btn-account");
    if (btnAccount) {
        btnAccount.onclick = () => {
            this.gm.playSFX("SELECT"); 
            this._openAccount(); 
        };
    }

    // Tombol Info (Panduan)
    const btnInfo = document.getElementById("btn-info");
    if (btnInfo) {
        btnInfo.onclick = () => {
            this.gm.playSFX("SELECT");
            this._openInfo();
        };
    }

    // Tombol Info Back
    const btnInfoBack = document.getElementById("btn-info-back");
    if (btnInfoBack) {
        btnInfoBack.onclick = () => {
            this.gm.playSFX("SELECT");
            this.gm.changeState(GAME_STATE.MENU); 
        };
    }

    // Shop Navigation
    const btnShopPrev = document.getElementById("btn-shop-prev");
    if (btnShopPrev) {
        btnShopPrev.onclick = () => {
            this.gm.playSFX("SELECT"); 
            this._navigateShop(-1); 
        };
    }

    const btnShopNext = document.getElementById("btn-shop-next");
    if (btnShopNext) {
        btnShopNext.onclick = () => {
            this.gm.playSFX("SELECT"); 
            this._navigateShop(1); 
        };
    }

    const btnShopBack = document.getElementById("btn-shop-back");
    if (btnShopBack) {
        btnShopBack.onclick = () => {
            this.gm.playSFX("SELECT"); 
            this.gm.changeState(GAME_STATE.MENU); 
        };
    }

    // Tombol Restart
    const btnRestart = document.getElementById("btn-restart");
    if (btnRestart) {
        btnRestart.onclick = async () => {
            this.gm.playSFX("SELECT"); 
            this.gm.changeState(GAME_STATE.PLAYING); 
            if (!this.isMobile) await this._updateMiniLeaderboard();
        };
    }

    // Tombol Menu
    const btnMenu = document.getElementById("btn-menu");
    if (btnMenu) {
        btnMenu.onclick = () => {
            this.gm.playSFX("SELECT"); 
            this.gm.changeState(GAME_STATE.MENU); 
        };
    }

    // Tombol Pause
    const btnPause = document.getElementById("btn-pause");
    if (btnPause) {
        btnPause.onclick = () => {
            this.gm.playSFX("SELECT");
            this.gm.togglePause();
        };
    }

    const btnResume = document.getElementById("btn-resume");
    if (btnResume) {
        btnResume.onclick = () => {
            this.gm.playSFX("SELECT");
            this.gm.togglePause();
        };
    }

    const btnQuitMenu = document.getElementById("btn-quit-menu");
    if (btnQuitMenu) {
        btnQuitMenu.onclick = () => {
            this.gm.playSFX("SELECT");
            this.gm.changeState(GAME_STATE.MENU);
        };
    }

    // Account Buttons
    const btnGoogle = document.getElementById("btn-google-login");
    if (btnGoogle) {
        btnGoogle.onclick = async () => {
            this.gm.playSFX("SELECT"); 
            await this.accountManager.login(); 
        };
    }

    const btnLogout = document.getElementById("btn-logout");
    if (btnLogout) {
        btnLogout.onclick = async () => {
            this.gm.playSFX("SELECT"); 
            await this.accountManager.logout(); 
        };
    }

    const btnSync = document.getElementById("btn-sync-data");
    if (btnSync) {
        btnSync.onclick = async () => {
            this.gm.playSFX("SELECT"); 
            await this.accountManager.syncData(); 
            await this.accountManager.updateProfileDisplay(); 
        };
    }

    const btnSaveUser = document.getElementById("btn-save-username");
    if (btnSaveUser) {
        btnSaveUser.onclick = async () => {
            this.gm.playSFX("SELECT"); 
            const newUsername = document.getElementById("profile-username-input").value.trim(); 
            if (newUsername && newUsername.length >= 3) {
                await this.accountManager.updateUsername(newUsername); 
            } else {
                alert("⚠️ Username minimal 3 karakter!"); 
            }
        };
    }

    const btnAccountBack = document.getElementById("btn-account-back");
    if (btnAccountBack) {
        btnAccountBack.onclick = () => {
            this.gm.playSFX("SELECT"); 
            this.gm.changeState(GAME_STATE.MENU); 
        };
    }

    const btnProfileBack = document.getElementById("btn-profile-back");
    if (btnProfileBack) {
        btnProfileBack.onclick = () => {
            this.gm.playSFX("SELECT"); 
            this.gm.changeState(GAME_STATE.MENU); 
        };
    }

    const btnLeaderboardBack = document.getElementById("btn-leaderboard-back");
    if (btnLeaderboardBack) {
        btnLeaderboardBack.onclick = () => {
            this.gm.playSFX("SELECT"); 
            this.gm.changeState(GAME_STATE.MENU); 
        };
    }

    // Tabs
    const tabBtns = document.querySelectorAll(".tab-btn");
    tabBtns.forEach((btn) => {
        btn.onclick = async () => {
            this.gm.playSFX("SELECT"); 
            tabBtns.forEach((b) => b.classList.remove("active")); 
            btn.classList.add("active"); 
            const type = btn.dataset.tab; 
            await this._loadLeaderboardData(type); 
        };
    });
  }

  showLoading(isLoading) {
    this.screens.loading.style.display = isLoading ? "flex" : "none";
  }

  showPaused(isPaused) {
      if (this.screens.paused) {
          this.screens.paused.style.display = isPaused ? "flex" : "none";
      }
  }

  updateUIState(state) {
    Object.values(this.screens).forEach((screen) => {
      if (screen) screen.style.display = "none";
    });

    const hud = document.getElementById("ui-hud");
    if (hud) {
      hud.style.display = state === GAME_STATE.PLAYING ? "flex" : "none";
    }

    const webcamContainer = document.querySelector(".webcam-container");
    const mobileControls = document.getElementById("mobile-controls");

    if (state === GAME_STATE.PLAYING) {
      if (webcamContainer) {
        webcamContainer.style.display = this.isMobile ? "none" : "flex";
      }
      if (mobileControls) {
        mobileControls.style.display = this.isMobile ? "flex" : "none";
      }
    } else {
      if (webcamContainer) webcamContainer.style.display = "none";
      if (mobileControls) mobileControls.style.display = "none";
    }

    switch (state) {
      case GAME_STATE.LOADING:
        if (this.screens.loading) this.screens.loading.style.display = "flex";
        break;
      case GAME_STATE.MENU:
        if (this.screens.menu) this.screens.menu.style.display = "flex";
        this._updateMenuDisplay();
        break;
      case GAME_STATE.SHOP:
        if (this.screens.shop) this.screens.shop.style.display = "flex";
        this.currentShopIndex = 0;
        this._renderShop();
        break;
      case GAME_STATE.GAMEOVER:
        if (this.screens.gameover) this.screens.gameover.style.display = "flex";
        this._updateGameOverStats();
        break;
    }
  }

  async _updateMenuDisplay() {
    const menuCoinsEl = document.getElementById("menu-coins");
    const userProfileEl = document.getElementById("user-profile");
    const userNameEl = document.getElementById("user-name");

    if (this.accountManager?.isLoggedIn) {
      if (userProfileEl) userProfileEl.style.display = "flex"; 
      const username = this.accountManager.getDisplayUsername();
      if (userNameEl) userNameEl.textContent = username;

      try {
        const { profile } = await this.accountManager.loadProfile();
        if (profile) {
          if (menuCoinsEl) menuCoinsEl.innerText = profile.total_coins || 0; 
          Storage.setCoins(profile.total_coins || 0);
        } else {
          if (menuCoinsEl) menuCoinsEl.innerText = Storage.getCoins(); 
        }
      } catch (e) {
        if (menuCoinsEl) menuCoinsEl.innerText = Storage.getCoins(); 
      }
    } else {
      if (userProfileEl) userProfileEl.style.display = "none"; 
      if (menuCoinsEl) menuCoinsEl.innerText = Storage.getCoins();
    }
  }

  updateHUD(score, coins) {
    if (this.scoreEl) this.scoreEl.innerText = score.toString().padStart(5, "0");
    if (this.coinEl) this.coinEl.innerText = coins;
  }

  _updateGameOverStats() {
    if (document.getElementById("go-score")) document.getElementById("go-score").innerText = Math.floor(this.gm.score);
    if (document.getElementById("go-high")) document.getElementById("go-high").innerText = Storage.getHighScore();
    if (document.getElementById("go-coin")) document.getElementById("go-coin").innerText = this.gm.coinsCollected;
  }

  _openShop() {
    this.screens.shop.style.display = "flex";
    this.currentShopIndex = 0; 
    this._renderShop(); 
  }

  _openInfo() {
      if (this.screens.menu) this.screens.menu.style.display = "none";
      if (this.screens.info) this.screens.info.style.display = "flex";
  }

  _navigateShop(direction) {
    this.currentShopIndex += direction;
    if (this.currentShopIndex < 0) this.currentShopIndex = SHOP_ITEMS.length - 1;
    if (this.currentShopIndex >= SHOP_ITEMS.length) this.currentShopIndex = 0;
    this._renderShop(); 
  }

  _renderShop() {
    const container = document.getElementById("shop-item-display");
    const shopCoins = document.getElementById("shop-coins");
    if (shopCoins) shopCoins.innerText = Storage.getCoins(); 

    const item = SHOP_ITEMS[this.currentShopIndex];
    if (!item) return;

    const isOwned = Storage.isItemOwned(item.id);
    const isSelected = Storage.getSelectedItem() === item.id;
    const canBuy = Storage.getCoins() >= item.cost;

    let btnText = "";
    let btnClass = "btn-retro";
    let btnDisabled = false;

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

    if (container) {
        container.innerHTML = `
            <img src="${imgSrc}" alt="${item.name}">
            <h3>${item.name}</h3>
            <p>${item.description}</p>
            <button id="btn-shop-action" class="${btnClass}" style="width: 100%; padding: 12px;">${btnText}</button>
        `;

        const btn = document.getElementById("btn-shop-action");
        if (btn) {
            if (btnDisabled) btn.disabled = true;

            btn.onclick = async () => {
                if (isOwned) {
                    this.gm.playSFX("SELECT"); 
                    Storage.setSelectedItem(item.id); 
                    if (this.accountManager.isLoggedIn) await supabaseService.equipItem(item.id);
                    this._renderShop(); 
                } else {
                    if (Storage.spendCoins(item.cost)) {
                        this.gm.playSFX("BUY"); 
                        Storage.saveOwnedItem(item.id); 
                        Storage.setSelectedItem(item.id); 
                        if (this.accountManager.isLoggedIn) {
                            try {
                                await supabaseService.purchaseItem(item.id, item.cost); 
                                await supabaseService.equipItem(item.id);
                            } catch (e) {
                                console.error("Cloud purchase failed:", e);
                            }
                        }
                        this._renderShop(); 
                    } else {
                        alert("Koin tidak cukup!"); 
                    }
                }
            };
        }
    }
  }

  _openAccount() {
    if (this.screens.account) this.screens.account.style.display = "flex";
    this.accountManager.updateUI(); 
  }

  async _openLeaderboard() {
    if (this.screens.leaderboard) this.screens.leaderboard.style.display = "flex";
    await this._loadLeaderboardData("global"); 
  }

  async _loadLeaderboardData(type) {
    const container = document.getElementById("leaderboard-content");
    if (container) {
        container.innerHTML =
            '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Memuat...</div>'; 

        const entries = await this.accountManager.loadLeaderboard(type); 
        this.accountManager.renderLeaderboard(entries, container); 
    }
  }

  // Mini Leaderboard (HUD) - Top 5 Global
  async _updateMiniLeaderboard() {
      const miniLbList = document.getElementById("mini-lb-list");
      if (!miniLbList) return;

      miniLbList.innerHTML = '<div class="mini-lb-item">Loading...</div>';

      try {
          // Standard Query with dedup logic in Service
          const { leaderboard, error } = await supabaseService.getLeaderboard(5); // Get top 5 sorted unique
          
          if (error) {
             console.warn("Mini LB Error:", error);
             throw new Error("Gagal memuat data");
          }

          if (!leaderboard || leaderboard.length === 0) {
              miniLbList.innerHTML = '<div class="mini-lb-item" style="justify-content:center;">Belum ada skor</div>';
              return;
          }

          miniLbList.innerHTML = leaderboard.map((entry, index) => {
              // Parse JOINED data: entry.profiles.username
              const profile = entry.profiles; 
              // Handle possibility of profile being null or username missing
              const name = (profile && profile.username) ? profile.username : 'Anonim';
              
              const score = entry.score.toLocaleString();
              // UPDATED TEXT COLORS FOR WHITE BACKGROUND
              let rankStyle = 'color: #2C3E50;'; // Default dark
              
              if (index === 0) rankStyle = 'color: #DAA520; font-weight: bold;'; // Dark Golden Rod
              if (index === 1) rankStyle = 'color: #7F8C8D; font-weight: bold;'; // Gray (Silver)
              if (index === 2) rankStyle = 'color: #A0522D; font-weight: bold;'; // Sienna (Bronze)

              const displayName = name.length > 10 ? name.substring(0, 10) + '..' : name;

              return `
                <div class="mini-lb-item">
                    <span class="rank" style="${rankStyle}">#${index + 1}</span>
                    <span class="name" style="${rankStyle}">${displayName}</span>
                    <span class="score" style="color: #E74C3C;">${score}</span>
                </div>
              `;
          }).join('');

      } catch (e) {
          console.warn("Mini LB failed:", e);
          miniLbList.innerHTML = '<div class="mini-lb-item" style="color: #FF6B6B;">Offline</div>';
      }
  }
}
