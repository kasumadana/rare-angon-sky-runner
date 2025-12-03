<div>
<br class="Apple-interchange-newline">
import { supabaseService } from '../services/SupabaseService.js'; // Ambil "tukang layanan" Supabase (untuk database dan login)
import { Storage } from '../utils/Storage.js'; // Ambil tempat simpan data di HP/komputer pengguna

/**
 * Account Manager
 * Ini adalah bagian yang mengurus login, data profil, dan papan skor (leaderboard)
 */
export class AccountManager {
  constructor(uiManager) {
    this.uiManager = uiManager; // Kita butuh ini buat ngobrol sama tampilan game (UI)
    this.currentUser = null; // Data pengguna yang sedang masuk (misalnya dari Google)
    this.currentProfile = null; // Data tambahan profil pengguna (misalnya koin, username)
    this.isLoggedIn = false; // Status: Sudah login atau belum?
    
    this.checkSession(); // Langsung cek, jangan-jangan dia sudah pernah login sebelumnya
  }

  async checkSession() {
    const { session } = await supabaseService.getSession(); // Cek ada sesi login yang tersimpan enggak?
    if (session) {
      this.currentUser = session.user; // Kalau ada, simpan data penggunanya
      this.isLoggedIn = true; // Oke, dia sudah login!
      const { profile } = await this.loadProfile(); // Ambil data profilnya juga
      this.currentProfile = profile; // Simpan data profilnya di sini
      
      await this.syncInventory(); // Penting: Satukan item-item (inventaris) lokal dengan yang di cloud
      
      this.updateUI(); // Perbarui tampilan supaya tahu kalau dia sudah login
    }
  }

  async login() {
    try {
      const { error } = await supabaseService.signInWithGoogle(); // Coba masuk pakai akun Google
      
      if (error) {
        console.error('Login error:', error); // Kalau gagal, catat kesalahannya
        alert('❌ Duh, gagal masuk: ' + error.message); // Kasih tahu pengguna
        return false;
      }
      return true; // Berhasil masuk!
    } catch (e) {
      console.error('Login exception:', e); // Kalau ada error mendadak (exception)
      alert('❌ Ada error lain: ' + e.message);
      return false;
    }
  }

  async logout() {
    try {
      await supabaseService.signOut(); // Keluar dari akun
      this.currentUser = null; // Kosongkan data pengguna
      this.currentProfile = null; // Kosongkan data profil
      this.isLoggedIn = false; // Ubah status jadi belum login
      
      localStorage.clear(); // Hapus semua data yang tersimpan di lokal (biar bersih)
      window.location.reload(); // Muat ulang halaman biar segar
      return true;
    } catch (e) {
      console.error('Logout error:', e); // Kalau gagal keluar
      alert('❌ Gagal keluar: ' + e.message);
      return false;
    }
  }

  async loadProfile() {
    if (!this.currentUser) return { profile: null, error: null }; // Enggak usah cek kalau belum ada pengguna

    const { profile, error } = await supabaseService.getProfile(); // Ambil data profil dari database
    
    if (error && error.code === 'PGRST116') { // Kode ini biasanya artinya data profilnya belum ada (baru pertama kali)
      return { profile: null, error: null }; // Anggap saja enggak ada masalah
    }

    if (profile) {
      this.currentProfile = profile; // Kalau ketemu, simpan data profilnya
    }

    return { profile, error };
  }

  async syncInventory() {
    if (!this.currentUser) return; // Enggak perlu sinkron kalau belum login

    try {
      const { inventory } = await supabaseService.getInventory(); // Ambil daftar item dari cloud
      if (inventory && inventory.length > 0) {
        // Jika ada item dari cloud, perbarui simpanan lokal kita
        inventory.forEach(item => {
          Storage.saveOwnedItem(item.item_id); // Simpan item ini di lokal
          if (item.is_equipped) {
            Storage.setSelectedItem(item.item_id); // Kalau lagi dipakai, set juga di lokal
          }
        });
        console.log("✅ Inventaris berhasil disatukan dari cloud");
      }
    } catch (e) {
      console.error("Sinkronisasi inventaris gagal:", e); // Kasih tahu kalau ada error
    }
  }

  async syncData() {
    if (!this.isLoggedIn) {
      alert('⚠️ Harus login dulu ya, baru bisa simpan data ke cloud!');
      return false;
    }

    try {
      await this._syncToCloud(); // Proses menyimpan koin dan skor ke cloud
      await this.syncInventory(); // Setelah itu, tarik lagi inventaris (untuk memastikan item baru juga masuk)
      alert('✅ Data berhasil disimpan ke cloud!');
      return true;
    } catch (e) {
      console.error('Gagal sinkron:', e);
      alert('❌ Gagal sinkronisasi: ' + e.message);
      return false;
    }
  }

  async _syncToCloud() {
    const localCoins = Storage.getCoins(); // Ambil koin dari simpanan lokal
    const localHighScore = Storage.getHighScore(); // Ambil skor tertinggi dari simpanan lokal

    await supabaseService.updateProfile({ total_coins: localCoins }); // Kirim total koin terbaru ke profil

    if (localHighScore > 0) {
      await supabaseService.submitScore(localHighScore); // Kirim skor tertinggi ke papan skor
    }
  }

  async updateUsername(newUsername) {
    if (!this.isLoggedIn) {
      alert('⚠️ Harus login dulu untuk ganti nama!');
      return false;
    }

    try {
      const { profile, error } = await supabaseService.updateProfile({ 
        username: newUsername // Coba ganti username di database
      });

      if (error) {
        alert('❌ Gagal update username: ' + error.message);
        return false;
      }

      this.currentProfile = profile; // Simpan data profil yang baru (username baru)
      alert('✅ Nama berhasil diganti!');
      this.updateUI(); // Segarkan tampilan utama
      await this.updateProfileDisplay(); // Perbarui tampilan detail profil
      return true;
    } catch (e) {
      console.error('Update username error:', e);
      alert('❌ Ada error: ' + e.message);
      return false;
    }
  }

  async loadLeaderboard(type = 'global') {
    try {
      if (type === 'global') {
        const { leaderboard, error } = await supabaseService.getLeaderboard(100); // Ambil 100 skor terbaik global
        if (error) {
          console.error('Leaderboard error:', error);
          return [];
        }
        return leaderboard || [];
      } else if (type === 'personal') {
        if (!this.isLoggedIn) return []; // Kalau belum login, enggak ada skor pribadi
        
        const { bestScore } = await supabaseService.getPersonalBest(); // Ambil skor terbaik pengguna ini
        const username = this.getDisplayUsername(); // Dapatkan nama untuk ditampilkan
        
        return [{ // Kembalikan skor pribadi dalam format seperti leaderboard
          score: bestScore,
          profiles: {
            username: username,
            avatar_id: 'bebean_std'
          }
        }];
      }
    } catch (e) {
      console.error('Gagal memuat leaderboard:', e);
      return [];
    }
  }

  updateUI() {
    const btnAccount = document.getElementById('btn-account-text'); // Tombol yang ada di menu utama
    if (this.isLoggedIn && this.currentUser) {
      btnAccount.textContent = 'PROFIL'; // Kalau sudah login, ganti teks jadi PROFIL
    } else {
      btnAccount.textContent = 'MASUK'; // Kalau belum, suruh MASUK
    }

    const accountLogin = document.getElementById('account-login'); // Kotak tampilan login
    const accountProfile = document.getElementById('account-profile'); // Kotak tampilan profil

    if (this.isLoggedIn) {
      accountLogin.style.display = 'none'; // Sembunyikan kotak login
      accountProfile.style.display = 'block'; // Tampilkan kotak profil
      this.updateProfileDisplay(); // Tampilkan detail data di kotak profil
    } else {
      accountLogin.style.display = 'block'; // Tampilkan kotak login
      accountProfile.style.display = 'none'; // Sembunyikan kotak profil
    }
  }

  async updateProfileDisplay() {
    if (!this.isLoggedIn || !this.currentUser) return; // Jangan lakukan apa-apa kalau belum login

    const { profile } = await supabaseService.getProfile(); // Ambil lagi data profil terbaru dari cloud
    if (profile) {
      this.currentProfile = profile; // Simpan data profil yang baru
    }

    const displayName = this.getDisplayUsername(); // Tentukan nama yang mau ditampilkan
    
    const usernameInput = document.getElementById('profile-username-input'); // Kolom input nama pengguna
    if (usernameInput) {
      usernameInput.value = displayName; // Isi kolom input dengan nama pengguna saat ini
    }
    
    document.getElementById('profile-email').textContent = this.currentUser.email || '-'; // Tampilkan alamat email

    try {
      if (this.currentProfile) {
        document.getElementById('profile-coins').textContent = this.currentProfile.total_coins || 0; // Tampilkan koin dari cloud
      } else {
        document.getElementById('profile-coins').textContent = Storage.getCoins(); // Kalau profil cloud belum ada, pakai koin lokal dulu
      }

      const { bestScore } = await supabaseService.getPersonalBest(); // Ambil skor terbaik pribadi dari cloud
      document.getElementById('profile-best').textContent = bestScore || Storage.getHighScore(); // Tampilkan skor terbaik (utamakan cloud, fallback ke lokal)
    } catch (e) {
      console.error('Gagal memuat data profil:', e); // Kalau ada masalah, tampilkan data lokal sebagai cadangan
      document.getElementById('profile-coins').textContent = Storage.getCoins();
      document.getElementById('profile-best').textContent = Storage.getHighScore();
    }
  }

  renderLeaderboard(entries, container) {
    if (!entries || entries.length === 0) { // Kalau enggak ada data, kasih pesan
      container.innerHTML = `<br>
        <div class="empty-state"><br>
          <p><i class="fas fa-scroll"></i> Belum ada data leaderboard.</p><br>
          <p>Mainkan game dan submit skor Anda!</p><br>
        </div><br>
      `;
      return;
    }

    container.innerHTML = entries.map((entry, index) => { // Buat tampilan untuk setiap baris skor
      const rank = index + 1; // Hitung peringkatnya
      const rankClass = rank <= 3 ? `top-${rank}` : ''; // Beri warna khusus untuk peringkat 1-3
      const username = entry.username || entry.profiles?.username || 'Anonymous'; // Ambil nama pengguna
      const avatar = entry.avatar_id || entry.profiles?.avatar_id || 'bebean_std'; // Ambil ID avatar
      const score = entry.score || 0; // Ambil skornya

      return `<br>
        <div class="leaderboard-entry"><br>
          <div class="leaderboard-rank ${rankClass}">#${rank}</div><br>
          <div class="leaderboard-user"><br>
            <div class="leaderboard-name">${username}</div><br>
          </div><br>
          <div class="leaderboard-score">${score.toLocaleString()}</div><br>
        </div><br>
      `;
    }).join(''); // Gabungkan semua baris menjadi satu HTML
  }

  getAvatarEmoji(avatarId) {
    const avatars = { // Daftar gambar avatar
      'bebean_std': 'assets/images/kite_bebean.png',
      'pecukan_agile': 'assets/images/kite_pecukan.png',
      'janggan_legend': 'assets/images/kite_kuwir.png'
    };
    
    const src = avatars[avatarId] || 'assets/images/kite_bebean.png'; // Tentukan gambar yang dipakai
    return `<img src="${src}" class="icon-sm" alt="Avatar" style="vertical-align: middle;">`; // Kembalikan tag HTML gambarnya
  }

  getDisplayUsername() {
    return this.currentProfile?.username || // Coba pakai username di profil
           this.currentUser?.email?.split('@')[0] || // Kalau belum ada, pakai bagian email sebelum '@'
           'Player'; // Kalau masih belum ada juga, pakai nama default 'Player'
  }
}
</div>
