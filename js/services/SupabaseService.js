// Ambil/Impor Supabase dari CDN (sudah dimuat di file index.html)
// Cek apakah Supabase sudah bisa dipakai/tersedia
if (typeof window.supabase === 'undefined') {
  console.error('❌ Supabase CDN not loaded! Coba cek script tag di index.html.');
}

import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config/supabase.config.js'; // Ambil alamat dan kunci rahasia Supabase

/**
 * Lapisan Layanan (Service Layer) Supabase 🛠️
 * Ini adalah "jembatan" kita ke server Supabase. Dia mengurus semua urusan data
 * di belakang layar: Login, Profil, Papan Skor, dan Inventaris.
 */
class SupabaseService {
  constructor() {
    // Coba hubungkan ke Supabase.
    if (window.supabase && window.supabase.createClient) {
      this.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY); // Buat klien Supabase
      this.currentUser = null; // Data pengguna yang sedang aktif
      console.log('✅ Supabase siap dipakai!');
    } else {
      console.warn('⚠️ Supabase tidak ditemukan, fitur online dimatikan.');
      this.supabase = null;
      this.currentUser = null;
    }
  }

  // ==================== OTENTIKASI (LOGIN/LOGOUT) ====================

  /**
   * Masuk (Sign In) pakai akun Google.
   * @returns {Promise<{user, session, error}>} Hasilnya adalah data {pengguna, sesi, atau error}
   */
  async signInWithGoogle() {
    const { data, error } = await this.supabase.auth.signInWithOAuth({
      provider: 'google', // Gunakan Google sebagai penyedia login
      options: {
        redirectTo: window.location.origin // Balik lagi ke halaman utama kita setelah login
      }
    });
    
    if (!error && data.user) {
      this.currentUser = data.user; // Simpan data pengguna yang baru masuk
    }
    
    return { user: data.user, session: data.session, error }; // Kembalikan hasilnya
  }

  /**
   * Masuk (Sign In) pakai Email dan Kata Sandi.
   * @param {string} email Alamat email pengguna
   * @param {string} password Kata sandi pengguna
   * @returns {Promise<{user, session, error}>} Hasilnya adalah data {pengguna, sesi, atau error}
   */
  async signInWithEmail(email, password) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (!error && data.user) {
      this.currentUser = data.user; // Simpan data pengguna
    }
    
    return { user: data.user, session: data.session, error };
  }

  /**
   * Daftar (Sign Up) untuk pengguna baru.
   * @param {string} email Email yang mau dipakai
   * @param {string} password Kata sandi yang mau dibuat
   * @param {string} username Nama tampilan (display name)
   * @returns {Promise<{user, session, error}>} Hasilnya adalah data {pengguna, sesi, atau error}
   */
  async signUp(email, password, username) {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: { // Tambahkan data awal, misalnya username
          username: username || `Player${Date.now()}` // Username default jika kosong
        }
      }
    });
    
    return { user: data.user, session: data.session, error };
  }

  /**
   * Keluar (Sign Out) dari akun yang sedang aktif.
   * @returns {Promise<{error}>} Hasilnya adalah {error} jika gagal
   */
  async signOut() {
    const { error } = await this.supabase.auth.signOut(); // Proses keluar dari Supabase
    this.currentUser = null; // Hapus data pengguna lokal
    return { error };
  }

  /**
   * Ambil sesi login yang sedang aktif.
   * @returns {Promise<{session, error}>} Hasilnya adalah {detail sesi atau error}
   */
  async getSession() {
    const { data, error } = await this.supabase.auth.getSession(); // Ambil sesi
    if (data.session) {
      this.currentUser = data.session.user; // Simpan pengguna dari sesi
    }
    return { session: data.session, error };
  }

  /**
   * Dengarkan setiap ada perubahan status login (misalnya dari log in ke log out).
   * @param {Function} callback Fungsi yang akan dipanggil saat status berubah
   */
  onAuthStateChange(callback) {
    return this.supabase.auth.onAuthStateChange(callback);
  }

  // ==================== PENGELOLAAN PROFIL ====================

  /**
   * Ambil data profil (username, koin, dll.) pengguna.
   * @param {string} userId ID pengguna (kalau kosong, pakai pengguna yang lagi login)
   * @returns {Promise<{profile, error}>} Hasilnya adalah {data profil atau error}
   */
  async getProfile(userId = null) {
    const id = userId || this.currentUser?.id; // Tentukan ID pengguna
    if (!id) return { profile: null, error: new Error('Tidak ada ID pengguna') };

    const { data, error } = await this.supabase
      .from('profiles') // Ambil dari tabel 'profiles'
      .select('*')
      .eq('id', id) // Filter berdasarkan ID pengguna
      .single(); // Kita hanya berharap satu hasil

    return { profile: data, error };
  }

  /**
   * Perbarui data profil pengguna (misalnya ganti username).
   * @param {Object} updates Bagian-bagian profil yang mau diubah
   * @returns {Promise<{profile, error}>} Hasilnya adalah {profil yang sudah diupdate atau error}
   */
  async updateProfile(updates) {
    if (!this.currentUser) return { profile: null, error: new Error('Harus login dulu') };

    const { data, error } = await this.supabase
      .from('profiles')
      .update({
        ...updates, // Gabungkan perubahan yang diminta
        updated_at: new Date().toISOString() // Catat waktu update
      })
      .eq('id', this.currentUser.id) // Pastikan update hanya untuk pengguna ini
      .select()
      .single();

    return { profile: data, error };
  }

  /**
   * Tambahkan koin ke profil pengguna.
   * @param {number} amount Jumlah koin yang mau ditambahkan
   * @returns {Promise<{profile, error}>} Hasilnya adalah {profil yang sudah diupdate atau error}
   */
  async addCoins(amount) {
    if (!this.currentUser) return { profile: null, error: new Error('Harus login dulu') };

    // Langkah 1: Ambil koin yang ada sekarang.
    const { profile, error: fetchError } = await this.getProfile();
    if (fetchError) return { profile: null, error: fetchError };

    // Langkah 2: Hitung total baru dan update.
    const newTotal = (profile.total_coins || 0) + amount;
    return await this.updateProfile({ total_coins: newTotal });
  }

  // ==================== LEADERBOARD (PAPAN SKOR) ====================

  /**
   * Kirim skor baru ke papan peringkat.
   * @param {number} score Nilai skor yang akan dicatat
   * @returns {Promise<{entry, error}>} Hasilnya adalah {detail pencatatan skor atau error}
   */
  async submitScore(score) {
    if (!this.currentUser) return { entry: null, error: new Error('Harus login dulu') };

    const { data, error } = await this.supabase
      .from('leaderboards') // Masukkan ke tabel 'leaderboards'
      .insert({
        user_id: this.currentUser.id,
        score: Math.floor(score) // Pastikan skor adalah angka bulat
      })
      .select()
      .single();

    return { entry: data, error };
  }

  /**
   * Ambil daftar skor terbaik global (top scores).
   * @param {number} limit Jumlah data yang mau diambil (default 100)
   * @returns {Promise<{leaderboard, error}>} Hasilnya adalah {daftar peringkat atau error}
   */
  async getLeaderboard(limit = 100) {
    // Coba pakai fungsi khusus dari database (RPC) untuk efisiensi.
    const { data, error } = await this.supabase.rpc('get_leaderboard', {
      limit_count: limit // Kirim batas jumlah data
    });

    // Kalau RPC gagal (misalnya karena belum disetup di database), pakai cara lama (fallback query).
    if (error && (error.code === '42883' || error.code === 'PGRST202')) {
      console.warn('Fungsi RPC tidak ditemukan, menggunakan cara cadangan...');
      const { data: allScores, error: fetchError } = await this.supabase
        .from('leaderboards')
        .select(`
          user_id,
          score,
          created_at,
          profiles (username, avatar_id)
        `)
        .order('score', { ascending: false }); // Urutkan dari skor tertinggi

      if (fetchError) return { leaderboard: null, error: fetchError };

      // Kelompokkan skor: Ambil hanya skor terbaik untuk setiap pengguna.
      const bestScores = {};
      allScores.forEach(entry => {
        const userId = entry.user_id;
        if (!bestScores[userId] || entry.score > bestScores[userId].score) {
          bestScores[userId] = entry;
        }
      });

      // Jadikan array lagi, urutkan, dan batasi jumlahnya.
      const leaderboard = Object.values(bestScores)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      return { leaderboard, error: null };
    }

    return { leaderboard: data, error }; // Kembalikan hasil dari RPC
  }

  /**
   * Ambil skor terbaik pribadi (Personal Best Score) pengguna yang sedang login.
   * @returns {Promise<{bestScore, error}>} Hasilnya adalah {nilai skor terbaik atau error}
   */
  async getPersonalBest() {
    if (!this.currentUser) return { bestScore: 0, error: null };

    const { data, error } = await this.supabase
      .from('leaderboards')
      .select('score')
      .eq('user_id', this.currentUser.id) // Hanya milik pengguna ini
      .order('score', { ascending: false }) // Ambil yang paling besar
      .limit(1)
      .single();

    return { bestScore: data?.score || 0, error }; // Kembalikan skor, defaultnya 0
  }

  // ==================== INVENTARIS (BARANG) ========================

  /**
   * Ambil daftar semua barang (inventory) milik pengguna.
   * @returns {Promise<{inventory, error}>} Hasilnya adalah {daftar barang atau error}
   */
  async getInventory() {
    if (!this.currentUser) return { inventory: [], error: new Error('Harus login dulu') };

    const { data, error } = await this.supabase
      .from('user_inventory')
      .select('*')
      .eq('user_id', this.currentUser.id);

    return { inventory: data || [], error };
  }

  /**
   * Beli barang dan masukkan ke inventaris (sekaligus memotong koin).
   * @param {string} itemId ID barang yang mau dibeli
   * @param {number} cost Harga barang
   * @returns {Promise<{item, error}>} Hasilnya adalah {detail barang yang dibeli atau error}
   */
  async purchaseItem(itemId, cost) {
    if (!this.currentUser) return { item: null, error: new Error('Harus login dulu') };

    // Langkah 1: Cek koin pengguna.
    const { profile, error: profileError } = await this.getProfile();
    if (profileError) return { item: null, error: profileError };

    if ((profile.total_coins || 0) < cost) {
      return { item: null, error: new Error('Koin tidak cukup!') };
    }

    // Langkah 2: Kurangi koin.
    const { error: deductError } = await this.updateProfile({
      total_coins: profile.total_coins - cost
    });
    if (deductError) return { item: null, error: deductError };

    // Langkah 3: Tambahkan barang ke inventaris.
    const { data, error } = await this.supabase
      .from('user_inventory')
      .insert({
        user_id: this.currentUser.id,
        item_id: itemId,
        is_equipped: false // Awalnya tidak langsung dipakai
      })
      .select()
      .single();

    return { item: data, error };
  }

  /**
   * Pasang (Equip) sebuah item/barang dari inventaris.
   * @param {string} itemId ID barang yang mau dipakai
   * @returns {Promise<{success, error}>} Hasilnya adalah {status berhasil atau error}
   */
  async equipItem(itemId) {
    if (!this.currentUser) return { success: false, error: new Error('Harus login dulu') };

    // Langkah 1: Lepas dulu semua item yang sedang dipakai (set `is_equipped: false`).
    await this.supabase
      .from('user_inventory')
      .update({ is_equipped: false })
      .eq('user_id', this.currentUser.id);

    // Langkah 2: Pasang (Equip) item yang baru (set `is_equipped: true`).
    const { error } = await this.supabase
      .from('user_inventory')
      .update({ is_equipped: true })
      .eq('user_id', this.currentUser.id)
      .eq('item_id', itemId);

    return { success: !error, error };
  }

  /**
   * Ambil ID item/barang yang sedang dipakai (equipped) saat ini.
   * @returns {Promise<{equippedItem, error}>} Hasilnya adalah {ID item yang dipakai atau error}
   */
  async getEquippedItem() {
    if (!this.currentUser) return { equippedItem: null, error: null };

    const { data, error } = await this.supabase
      .from('user_inventory')
      .select('item_id')
      .eq('user_id', this.currentUser.id)
      .eq('is_equipped', true) // Cari yang statusnya sedang dipakai
      .single();

    return { equippedItem: data?.item_id || 'bebean_std', error }; // Kembalikan ID item, default 'bebean_std'
  }
}

// Ekspor objek ini biar bisa dipakai di file lain
export const supabaseService = new SupabaseService();
export { supabaseService as default };
