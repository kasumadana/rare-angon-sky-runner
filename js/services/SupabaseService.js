// Import Supabase from CDN (loaded in index.html)
// Check if Supabase is available
if (typeof window.supabase === 'undefined') {
  console.error('❌ Supabase CDN not loaded! Add script tag to index.html');
}

import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config/supabase.config.js';

/**
 * Supabase Service Layer
 * Handles all backend operations: Auth, Profiles, Leaderboard, Inventory
 */
class SupabaseService {
  constructor() {
    // Use global supabase from CDN
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

  // ==================== AUTHENTICATION ====================

  /**
   * Sign in with Google OAuth
   * @returns {Promise<{user, session, error}>}
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
   * Sign in with Email & Password
   * @param {string} email 
   * @param {string} password 
   * @returns {Promise<{user, session, error}>}
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
   * Sign up with Email & Password
   * @param {string} email 
   * @param {string} password 
   * @param {string} username 
   * @returns {Promise<{user, session, error}>}
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
   * Sign out current user
   * @returns {Promise<{error}>}
   */
  async signOut() {
    const { error } = await this.supabase.auth.signOut();
    this.currentUser = null;
    return { error };
  }

  /**
   * Get current session
   * @returns {Promise<{session, error}>}
   */
  async getSession() {
    const { data, error } = await this.supabase.auth.getSession();
    if (data.session) {
      this.currentUser = data.session.user;
    }
    return { session: data.session, error };
  }

  /**
   * Listen to auth state changes
   * @param {Function} callback - Called with (event, session)
   */
  onAuthStateChange(callback) {
    return this.supabase.auth.onAuthStateChange(callback);
  }

  // ==================== PROFILE MANAGEMENT ====================

  /**
   * Get user profile
   * @param {string} userId - User ID (optional, defaults to current user)
   * @returns {Promise<{profile, error}>}
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
   * Update user profile
   * @param {Object} updates - Profile fields to update
   * @returns {Promise<{profile, error}>}
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
   * Add coins to user profile
   * @param {number} amount - Coins to add
   * @returns {Promise<{profile, error}>}
   */
  async addCoins(amount) {
    if (!this.currentUser) return { profile: null, error: new Error('Not authenticated') };

    // Get current coins
    const { profile, error: fetchError } = await this.getProfile();
    if (fetchError) return { profile: null, error: fetchError };

    // Update with new total
    const newTotal = (profile.total_coins || 0) + amount;
    return await this.updateProfile({ total_coins: newTotal });
  }

  // ==================== LEADERBOARD ====================

  /**
   * Submit score to leaderboard
   * @param {number} score 
   * @returns {Promise<{entry, error}>}
   */
  async submitScore(score) {
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
   * Get top scores from leaderboard (best score per player)
   * @param {number} limit - Number of entries to fetch
   * @returns {Promise<{leaderboard, error}>}
   */
  async getLeaderboard(limit = 100) {
    // Use a view or subquery to get best score per user
    const { data, error } = await this.supabase.rpc('get_leaderboard', {
      limit_count: limit
    });

    // Fallback if RPC doesn't exist (PGRST202) or undefined function (42883)
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

      // Group by user_id and keep only best score
      const bestScores = {};
      allScores.forEach(entry => {
        const userId = entry.user_id;
        if (!bestScores[userId] || entry.score > bestScores[userId].score) {
          bestScores[userId] = entry;
        }
      });

      // Convert to array and sort
      const leaderboard = Object.values(bestScores)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      return { leaderboard, error: null };
    }

    return { leaderboard: data, error };
  }

  /**
   * Get user's personal best score
   * @returns {Promise<{bestScore, error}>}
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

  // ==================== INVENTORY ====================

  /**
   * Get user's inventory
   * @returns {Promise<{inventory, error}>}
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
   * Purchase item and add to inventory
   * @param {string} itemId 
   * @param {number} cost 
   * @returns {Promise<{item, error}>}
   */
  async purchaseItem(itemId, cost) {
    if (!this.currentUser) return { item: null, error: new Error('Not authenticated') };

    // Check if user has enough coins
    const { profile, error: profileError } = await this.getProfile();
    if (profileError) return { item: null, error: profileError };

    if ((profile.total_coins || 0) < cost) {
      return { item: null, error: new Error('Insufficient coins') };
    }

    // Deduct coins
    const { error: deductError } = await this.updateProfile({
      total_coins: profile.total_coins - cost
    });
    if (deductError) return { item: null, error: deductError };

    // Add item to inventory
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
   * Equip an item from inventory
   * @param {string} itemId 
   * @returns {Promise<{success, error}>}
   */
  async equipItem(itemId) {
    if (!this.currentUser) return { success: false, error: new Error('Not authenticated') };

    // Unequip all items first
    await this.supabase
      .from('user_inventory')
      .update({ is_equipped: false })
      .eq('user_id', this.currentUser.id);

    // Equip selected item
    const { error } = await this.supabase
      .from('user_inventory')
      .update({ is_equipped: true })
      .eq('user_id', this.currentUser.id)
      .eq('item_id', itemId);

    return { success: !error, error };
  }

  /**
   * Get currently equipped item
   * @returns {Promise<{equippedItem, error}>}
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

// Export singleton instance
export const supabaseService = new SupabaseService();
export { supabaseService as default };
