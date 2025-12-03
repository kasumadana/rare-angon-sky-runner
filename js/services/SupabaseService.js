// Ambil/Impor Supabase dari CDN (sudah dimuat di file index.html)
// Cek apakah Supabase sudah bisa dipakai/tersedia
if (typeof window.supabase === 'undefined') {
  console.error('❌ Supabase CDN not loaded! Add script tag to index.html');
}

import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config/supabase.config.js';

/**
 * Lapisan Layanan (Service Layer) Supabase
 * Mengurus semua operasi backend (sistem belakang): Otentikasi (Auth), Profil,
 * Papan Peringkat (Leaderboard), dan Inventaris.
 */
class SupabaseService {
  constructor() {
    // Gunakan supabase global dari CDN.
    if (window.supabase && window.supabase.createClient) {
      this.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      this.currentUser = null;
      console.log('✅ Supabase initialized');
    } else {
      console.warn('⚠️ Supabase not available, features disabled');
      this.supabase = null;
      this.currentUser = null;
    }
  }

  // ==================== OTENTIKASI ====================

 /**
 * Masuk (Sign In) menggunakan Google OAuth
 * @returns {Promise<{user, session, error}>}
 * Mengembalikan sebuah Promise (Janji) yang akan memberikan Objek yang berisi
 * data {user (pengguna), session (sesi login), atau error (kesalahan)}
 */
  async signInWithGoogle() {
    const { data, error } = await this.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    
    if (!error && data.user) {
      this.currentUser = data.user;
    }
    
    return { user: data.user, session: data.session, error };
  }

/**
 * Masuk (Sign In) menggunakan Email dan Kata Sandi
 * @param {string} email 
 * Parameter: Alamat email pengguna (berupa teks)
 * @param {string} password 
 * Parameter: Kata sandi pengguna (berupa teks)
 * @returns {Promise<{user, session, error}>}
 * Mengembalikan sebuah Promise (Janji) yang akan memberikan Objek yang berisi
 * data {user (pengguna), session (sesi login), atau error (kesalahan)}
 */
  async signInWithEmail(email, password) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (!error && data.user) {
      this.currentUser = data.user;
    }
    
    return { user: data.user, session: data.session, error };
  }

/**
 * Daftar (Sign Up) menggunakan Email dan Kata Sandi
 * @param {string} email 
 * Parameter: Alamat email pengguna yang baru (berupa teks)
 * @param {string} password 
 * Parameter: Kata sandi yang ingin dibuat pengguna (berupa teks)
 * @param {string} username 
 * Parameter: Nama pengguna/Nama tampilan yang ingin dibuat (berupa teks)
 * @returns {Promise<{user, session, error}>}
 * Mengembalikan sebuah Promise (Janji) yang akan memberikan Objek yang berisi
 * data {user (pengguna), session (sesi login), atau error (kesalahan)}
 */
  async signUp(email, password, username) {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username || `Player${Date.now()}`
        }
      }
    });
    
    return { user: data.user, session: data.session, error };
  }

/**
 * Keluar (Sign Out) dari akun pengguna yang sedang aktif
 * @returns {Promise<{error}>}
 * Mengembalikan sebuah Promise (Janji) yang akan memberikan Objek yang berisi
 * {error (kesalahan)} jika proses keluar gagal.
 */
  async signOut() {
    const { error } = await this.supabase.auth.signOut();
    this.currentUser = null;
    return { error };
  }

/**
 * Ambil atau dapatkan sesi (session) yang sedang aktif sekarang
 * @returns {Promise<{session, error}>}
 * Mengembalikan sebuah Promise (Janji) yang akan memberikan Objek yang berisi
 * {session (detail sesi aktif) atau error (kesalahan)}
 */
  async getSession() {
    const { data, error } = await this.supabase.auth.getSession();
    if (data.session) {
      this.currentUser = data.session.user;
    }
    return { session: data.session, error };
  }

/**
 * Dengarkan perubahan status otentikasi (auth state changes)
 * @param {Function} callback - Dipanggil dengan (kejadian/event, sesi/session)
 * Parameter: Sebuah Fungsi yang akan dipanggil setiap kali status login berubah.
 */
  onAuthStateChange(callback) {
    return this.supabase.auth.onAuthStateChange(callback);
  }

  // ==================== PENGELOLAAN PROFIL ====================

/**
 * Ambil data profil pengguna
 * @param {string} userId - ID Pengguna (opsional, jika kosong akan menggunakan pengguna yang sedang login)
 * @returns {Promise<{profile, error}>}
 * Mengembalikan sebuah Promise (Janji) yang akan memberikan Objek yang berisi
 * {profile (detail data profil) atau error (kesalahan)}
 */
  async getProfile(userId = null) {
    const id = userId || this.currentUser?.id;
    if (!id) return { profile: null, error: new Error('No user ID') };

    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    return { profile: data, error };
  }

/**
 * Perbarui data profil pengguna
 * @param {Object} updates - Bidang-bidang (fields) profil yang ingin diperbarui (berupa Objek)
 * @returns {Promise<{profile, error}>}
 * Mengembalikan sebuah Promise (Janji) yang akan memberikan Objek yang berisi
 * {profile (detail data profil yang sudah diperbarui) atau error (kesalahan)}
 */
  async updateProfile(updates) {
    if (!this.currentUser) return { profile: null, error: new Error('Not authenticated') };

    const { data, error } = await this.supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', this.currentUser.id)
      .select()
      .single();

    return { profile: data, error };
  }

/**
 * Tambahkan koin ke profil pengguna
 * @param {number} amount - Jumlah koin yang akan ditambahkan (berupa angka)
 * @returns {Promise<{profile, error}>}
 * Mengembalikan sebuah Promise (Janji) yang akan memberikan Objek yang berisi
 * {profile (detail data profil yang sudah diperbarui) atau error (kesalahan)}
 */
  async addCoins(amount) {
    if (!this.currentUser) return { profile: null, error: new Error('Not authenticated') };

    // Dapatkan jumlah koin saat ini.
    const { profile, error: fetchError } = await this.getProfile();
    if (fetchError) return { profile: null, error: fetchError };

    // Update with new total
    const newTotal = (profile.total_coins || 0) + amount;
    return await this.updateProfile({ total_coins: newTotal });
  }

  // ==================== LEADERBOARD ====================

/**
 * Kirim skor ke papan peringkat (leaderboard)
 * @param {number} score 
 * Parameter: Nilai skor yang akan dikirim (berupa angka)
 * @returns {Promise<{entry, error}>}
 * Mengembalikan sebuah Promise (Janji) yang akan memberikan Objek yang berisi
 * {entry (detail entri/pencatatan skor) atau error (kesalahan)}
 */
  submitScore(score) {
    if (!this.currentUser) return { entry: null, error: new Error('Not authenticated') };

    const { data, error } = await this.supabase
      .from('leaderboards')
      .insert({
        user_id: this.currentUser.id,
        score: Math.floor(score)
      })
      .select()
      .single();

    return { entry: data, error };
  }

/**
 * Ambil skor-skor teratas dari papan peringkat (leaderboard)
 * (Hanya skor terbaik per pemain yang diambil)
 * @param {number} limit - Jumlah entri/data yang mau diambil (berupa angka)
 * @returns {Promise<{leaderboard, error}>}
 * Mengembalikan sebuah Promise (Janji) yang akan memberikan Objek yang berisi
 * {leaderboard (detail daftar peringkat) atau error (kesalahan)}
 */
  async getLeaderboard(limit = 100) {
    // Use a view or subquery to get best score per user
    const { data, error } = await this.supabase.rpc('get_leaderboard', {
      limit_count: limit
    });

    // Pakai opsi lain (Fallback) kalau RPC-nya tidak ada (Kode Kesalahan PGRST202) atau fungsinya tidak terdefinisi (Kode Kesalahan 42883).
    if (error && (error.code === '42883' || error.code === 'PGRST202')) {
      console.warn('RPC function not found, using fallback query');
      const { data: allScores, error: fetchError } = await this.supabase
        .from('leaderboards')
        .select(`
          user_id,
          score,
          created_at,
          profiles (username, avatar_id)
        `)
        .order('score', { ascending: false });

      if (fetchError) return { leaderboard: null, error: fetchError };

      // Kelompokkan berdasarkan ID pengguna (user_id) dan ambil/pertahankan hanya skor terbaik.
      const bestScores = {};
      allScores.forEach(entry => {
        const userId = entry.user_id;
        if (!bestScores[userId] || entry.score > bestScores[userId].score) {
          bestScores[userId] = entry;
        }
      });

      // Konversi ke bentuk array (larik) lalu urutkan.
      const leaderboard = Object.values(bestScores)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      return { leaderboard, error: null };
    }

    return { leaderboard: data, error };
  }

/**
 * Ambil skor terbaik pribadi (personal best score) milik pengguna
 * @returns {Promise<{bestScore, error}>}
 * Mengembalikan sebuah Promise (Janji) yang akan memberikan Objek yang berisi
 * {bestScore (nilai skor terbaik) atau error (kesalahan)}
 */
  async getPersonalBest() {
    if (!this.currentUser) return { bestScore: 0, error: null };

    const { data, error } = await this.supabase
      .from('leaderboards')
      .select('score')
      .eq('user_id', this.currentUser.id)
      .order('score', { ascending: false })
      .limit(1)
      .single();

    return { bestScore: data?.score || 0, error };
  }

 // ==================== INVENTARIS ========================

/**
 * Ambil atau dapatkan daftar inventaris/barang milik pengguna
 * @returns {Promise<{inventory, error}>}
 * Mengembalikan sebuah Promise (Janji) yang akan memberikan Objek yang berisi
 * {inventory (detail daftar barang) atau error (kesalahan)}
 */
  async getInventory() {
    if (!this.currentUser) return { inventory: [], error: new Error('Not authenticated') };

    const { data, error } = await this.supabase
      .from('user_inventory')
      .select('*')
      .eq('user_id', this.currentUser.id);

    return { inventory: data || [], error };
  }

/**
 * Beli item/barang dan tambahkan ke dalam inventaris
 * @param {string} itemId 
 * Parameter: ID item/barang yang akan dibeli (berupa teks)
 * @param {number} cost 
 * Parameter: Harga item/barang tersebut (berupa angka)
 * @returns {Promise<{item, error}>}
 * Mengembalikan sebuah Promise (Janji) yang akan memberikan Objek yang berisi
 * {item (detail item yang dibeli) atau error (kesalahan)}
 */
  async purchaseItem(itemId, cost) {
    if (!this.currentUser) return { item: null, error: new Error('Not authenticated') };

    // Cek apakah koin pengguna cukup.
    const { profile, error: profileError } = await this.getProfile();
    if (profileError) return { item: null, error: profileError };

    if ((profile.total_coins || 0) < cost) {
      return { item: null, error: new Error('Insufficient coins') };
    }

    // kurangi koin
    const { error: deductError } = await this.updateProfile({
      total_coins: profile.total_coins - cost
    });
    if (deductError) return { item: null, error: deductError };

    // Menambahkan barang menuju inventaris
    const { data, error } = await this.supabase
      .from('user_inventory')
      .insert({
        user_id: this.currentUser.id,
        item_id: itemId,
        is_equipped: false
      })
      .select()
      .single();

    return { item: data, error };
  }

/**
 * Pasang/Pakai (Equip) sebuah item/barang dari inventaris
 * @param {string} itemId 
 * Parameter: ID item/barang yang ingin dipakai (berupa teks)
 * @returns {Promise<{success, error}>}
 * Mengembalikan sebuah Promise (Janji) yang akan memberikan Objek yang berisi
 * {success (status berhasil) atau error (kesalahan)}
 */
  async equipItem(itemId) {
    if (!this.currentUser) return { success: false, error: new Error('Not authenticated') };

    // Lepas semua item/barang dulu.
    await this.supabase
      .from('user_inventory')
      .update({ is_equipped: false })
      .eq('user_id', this.currentUser.id);

    //Pakai (Equip) item/barang yang dipilih
    const { error } = await this.supabase
      .from('user_inventory')
      .update({ is_equipped: true })
      .eq('user_id', this.currentUser.id)
      .eq('item_id', itemId);

    return { success: !error, error };
  }

/**
 * Ambil item/barang yang sedang dipakai (equipped) saat ini
 * @returns {Promise<{equippedItem, error}>}
 * Mengembalikan sebuah Promise (Janji) yang akan memberikan Objek yang berisi
 * {equippedItem (detail item yang dipakai) atau error (kesalahan)}
 */
  async getEquippedItem() {
    if (!this.currentUser) return { equippedItem: null, error: null };

    const { data, error } = await this.supabase
      .from('user_inventory')
      .select('item_id')
      .eq('user_id', this.currentUser.id)
      .eq('is_equipped', true)
      .single();

    return { equippedItem: data?.item_id || 'bebean_std', error };
  }
}

// Ekspor (Kirim keluar) instance/objek tunggal
export const supabaseService = new SupabaseService();
export { supabaseService as default };
