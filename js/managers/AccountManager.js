import { supabaseService } from '../services/SupabaseService.js';
import { Storage } from '../utils/Storage.js';

/**
 * Account Manager
 * Handles authentication, profile sync, and leaderboard
 */
export class AccountManager {
  constructor(uiManager) {
    this.uiManager = uiManager;
    this.currentUser = null;
    this.currentProfile = null;
    this.isLoggedIn = false;
    
    this.checkSession();
  }

  async checkSession() {
    const { session } = await supabaseService.getSession();
    if (session) {
      this.currentUser = session.user;
      this.isLoggedIn = true;
      const { profile } = await this.loadProfile();
      this.currentProfile = profile;
      
      // Sync Inventory
      await this.syncInventory();
      
      this.updateUI();
    }
  }

  async login() {
    try {
      const { error } = await supabaseService.signInWithGoogle();
      
      if (error) {
        console.error('Login error:', error);
        alert('❌ Login gagal: ' + error.message);
        return false;
      }
      return true;
    } catch (e) {
      console.error('Login exception:', e);
      alert('❌ Error: ' + e.message);
      return false;
    }
  }

  async logout() {
    try {
      await supabaseService.signOut();
      this.currentUser = null;
      this.currentProfile = null;
      this.isLoggedIn = false;
      
      localStorage.clear();
      window.location.reload();
      return true;
    } catch (e) {
      console.error('Logout error:', e);
      alert('❌ Gagal keluar: ' + e.message);
      return false;
    }
  }

  async loadProfile() {
    if (!this.currentUser) return { profile: null, error: null };

    const { profile, error } = await supabaseService.getProfile();
    
    if (error && error.code === 'PGRST116') {
      return { profile: null, error: null };
    }

    if (profile) {
      this.currentProfile = profile;
    }

    return { profile, error };
  }

  async syncInventory() {
    if (!this.currentUser) return;

    try {
      const { inventory } = await supabaseService.getInventory();
      if (inventory && inventory.length > 0) {
        // Update local storage with cloud inventory
        inventory.forEach(item => {
          Storage.saveOwnedItem(item.item_id);
          if (item.is_equipped) {
            Storage.setSelectedItem(item.item_id);
          }
        });
        console.log("✅ Inventory synced from cloud");
      }
    } catch (e) {
      console.error("Inventory sync failed:", e);
    }
  }

  async syncData() {
    if (!this.isLoggedIn) {
      alert('⚠️ Anda harus login terlebih dahulu!');
      return false;
    }

    try {
      await this._syncToCloud();
      await this.syncInventory(); // Also pull latest inventory
      alert('✅ Data berhasil disinkronkan ke cloud!');
      return true;
    } catch (e) {
      console.error('Sync error:', e);
      alert('❌ Gagal sinkronisasi: ' + e.message);
      return false;
    }
  }

  async _syncToCloud() {
    const localCoins = Storage.getCoins();
    const localHighScore = Storage.getHighScore();

    await supabaseService.updateProfile({ total_coins: localCoins });

    if (localHighScore > 0) {
      await supabaseService.submitScore(localHighScore);
    }
  }

  async updateUsername(newUsername) {
    if (!this.isLoggedIn) {
      alert('⚠️ Anda harus login terlebih dahulu!');
      return false;
    }

    try {
      const { profile, error } = await supabaseService.updateProfile({ 
        username: newUsername 
      });

      if (error) {
        alert('❌ Gagal update username: ' + error.message);
        return false;
      }

      this.currentProfile = profile;
      alert('✅ Username berhasil diubah!');
      this.updateUI();
      await this.updateProfileDisplay();
      return true;
    } catch (e) {
      console.error('Update username error:', e);
      alert('❌ Error: ' + e.message);
      return false;
    }
  }

  async loadLeaderboard(type = 'global') {
    try {
      if (type === 'global') {
        const { leaderboard, error } = await supabaseService.getLeaderboard(100);
        if (error) {
          console.error('Leaderboard error:', error);
          return [];
        }
        return leaderboard || [];
      } else if (type === 'personal') {
        if (!this.isLoggedIn) return [];

        const { bestScore } = await supabaseService.getPersonalBest();
        const username = this.getDisplayUsername();
        
        return [{
          score: bestScore,
          profiles: {
            username: username,
            avatar_id: 'bebean_std'
          }
        }];
      }
    } catch (e) {
      console.error('Load leaderboard error:', e);
      return [];
    }
  }

  updateUI() {
    const btnAccount = document.getElementById('btn-account-text');
    if (this.isLoggedIn && this.currentUser) {
      btnAccount.textContent = 'PROFIL';
    } else {
      btnAccount.textContent = 'MASUK';
    }

    const accountLogin = document.getElementById('account-login');
    const accountProfile = document.getElementById('account-profile');

    if (this.isLoggedIn) {
      accountLogin.style.display = 'none';
      accountProfile.style.display = 'block';
      this.updateProfileDisplay();
    } else {
      accountLogin.style.display = 'block';
      accountProfile.style.display = 'none';
    }
  }

  async updateProfileDisplay() {
    if (!this.isLoggedIn || !this.currentUser) return;

    const { profile } = await supabaseService.getProfile();
    if (profile) {
      this.currentProfile = profile;
    }

    const displayName = this.getDisplayUsername();
    
    const usernameInput = document.getElementById('profile-username-input');
    if (usernameInput) {
      usernameInput.value = displayName;
    }
    
    document.getElementById('profile-email').textContent = this.currentUser.email || '-';

    try {
      if (this.currentProfile) {
        document.getElementById('profile-coins').textContent = this.currentProfile.total_coins || 0;
      } else {
        document.getElementById('profile-coins').textContent = Storage.getCoins();
      }

      const { bestScore } = await supabaseService.getPersonalBest();
      document.getElementById('profile-best').textContent = bestScore || Storage.getHighScore();
    } catch (e) {
      console.error('Error loading profile data:', e);
      document.getElementById('profile-coins').textContent = Storage.getCoins();
      document.getElementById('profile-best').textContent = Storage.getHighScore();
    }
  }

  renderLeaderboard(entries, container) {
    if (!entries || entries.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p><i class="fas fa-scroll"></i> Belum ada data leaderboard.</p>
          <p>Mainkan game dan submit skor Anda!</p>
        </div>
      `;
      return;
    }

    container.innerHTML = entries.map((entry, index) => {
      const rank = index + 1;
      const rankClass = rank <= 3 ? `top-${rank}` : '';
      // FIX: Handle nested profiles object correctly
      const username = entry.username || entry.profiles?.username || 'Anonymous';
      const avatar = entry.avatar_id || entry.profiles?.avatar_id || 'bebean_std';
      const score = entry.score || 0;

      return `
        <div class="leaderboard-entry">
          <div class="leaderboard-rank ${rankClass}">#${rank}</div>
          <div class="leaderboard-user">
            <div class="leaderboard-name">${username}</div>
          </div>
          <div class="leaderboard-score">${score.toLocaleString()}</div>
        </div>
      `;
    }).join('');
  }

  getAvatarEmoji(avatarId) {
    // Return HTML for the avatar icon
    const avatars = {
      'bebean_std': 'assets/images/kite_bebean.png',
      'pecukan_agile': 'assets/images/kite_pecukan.png',
      'janggan_legend': 'assets/images/kite_kuwir.png'
    };
    
    const src = avatars[avatarId] || 'assets/images/kite_bebean.png';
    return `<img src="${src}" class="icon-sm" alt="Avatar" style="vertical-align: middle;">`;
  }

  getDisplayUsername() {
    return this.currentProfile?.username || 
           this.currentUser?.email?.split('@')[0] || 
           'Player';
  }
}
