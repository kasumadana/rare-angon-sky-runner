# 📘 Tutorial Lengkap: Integrasi Supabase untuk Rare Angon

## 🎯 Tujuan
Menghubungkan game dengan cloud backend Supabase untuk fitur:
- 🔐 **Authentication** (Login dengan Google/Email)
- 🏆 **Leaderboard** (Top 100 skor global)
- 💰 **Cloud Save** (Coins & Inventory sync)

---

## 📋 Prasyarat

- ✅ Akun Supabase (gratis di [supabase.com](https://supabase.com))
- ✅ Node.js terinstall (untuk npm)
- ✅ Browser modern (Chrome/Edge recommended)

---

## 🚀 Langkah 1: Install Dependencies

Buka terminal di folder proyek dan jalankan:

```bash
cd D:\Development\KKPW\rare-angon-sky-runner
npm install
```

**Output yang diharapkan:**
```
added 1 package, and audited 2 packages in 3s
found 0 vulnerabilities
```

---

## 🔧 Langkah 2: Buat Project Supabase

### 2.1 Daftar/Login ke Supabase
1. Buka [https://supabase.com](https://supabase.com)
2. Klik **"Start your project"** atau **"Sign In"**
3. Login dengan GitHub (recommended) atau Email

### 2.2 Buat Project Baru
1. Klik **"New Project"** di dashboard
2. Isi form:
   - **Name**: `rare-angon` (atau nama lain)
   - **Database Password**: Buat password kuat (SIMPAN INI!)
   - **Region**: Pilih **Southeast Asia (Singapore)** untuk latency rendah
   - **Pricing Plan**: **Free** (cukup untuk development)
3. Klik **"Create new project"**
4. **Tunggu ~2 menit** sampai project selesai di-setup

---

## 🔑 Langkah 3: Dapatkan API Credentials

### 3.1 Buka Settings
1. Di sidebar kiri, klik **⚙️ Settings**
2. Pilih **API** di menu Settings

### 3.2 Copy Credentials
Anda akan melihat 2 nilai penting:

**A. Project URL**
```
https://xxxxxxxxxxxxx.supabase.co
```
Copy nilai ini (contoh: `https://abcdefghijk.supabase.co`)

**B. anon/public Key**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS...
```
Copy string panjang ini (dimulai dengan `eyJ...`)

### 3.3 Update Config File
1. Buka file `js/config/supabase.config.js`
2. Ganti placeholder dengan credentials Anda:

```javascript
export const SUPABASE_URL = 'https://abcdefghijk.supabase.co'; // ← GANTI INI
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // ← GANTI INI
```

3. **Save file** (Ctrl+S)

---

## 🗄️ Langkah 4: Setup Database (SQL Migration)

### 4.1 Buka SQL Editor
1. Di sidebar Supabase, klik **🔨 SQL Editor**
2. Klik **"New Query"** (tombol hijau)

### 4.2 Jalankan Migration Script

Copy-paste SQL berikut **SECARA LENGKAP** dan klik **"Run"**:

```sql
-- ============================================
-- RARE ANGON DATABASE SCHEMA
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLE: profiles
-- Menyimpan data user (username, coins, avatar)
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  avatar_id TEXT DEFAULT 'bebean_std',
  total_coins INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: leaderboards
-- Menyimpan skor game
-- ============================================
CREATE TABLE IF NOT EXISTS leaderboards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: user_inventory
-- Menyimpan item yang dimiliki user
-- ============================================
CREATE TABLE IF NOT EXISTS user_inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  is_equipped BOOLEAN DEFAULT FALSE,
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, item_id)
);

-- ============================================
-- INDEXES (untuk performa query)
-- ============================================
CREATE INDEX IF NOT EXISTS idx_leaderboards_score 
  ON leaderboards(score DESC);

CREATE INDEX IF NOT EXISTS idx_leaderboards_user 
  ON leaderboards(user_id);

CREATE INDEX IF NOT EXISTS idx_inventory_user 
  ON user_inventory(user_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- Mengaktifkan keamanan tingkat baris
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_inventory ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLICIES: profiles
-- ============================================
DROP POLICY IF EXISTS "Public profiles viewable" ON profiles;
CREATE POLICY "Public profiles viewable" 
  ON profiles FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" 
  ON profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- ============================================
-- POLICIES: leaderboards
-- ============================================
DROP POLICY IF EXISTS "Leaderboards viewable by all" ON leaderboards;
CREATE POLICY "Leaderboards viewable by all" 
  ON leaderboards FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Users can insert own scores" ON leaderboards;
CREATE POLICY "Users can insert own scores" 
  ON leaderboards FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- POLICIES: user_inventory
-- ============================================
DROP POLICY IF EXISTS "Users view own inventory" ON user_inventory;
CREATE POLICY "Users view own inventory" 
  ON user_inventory FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own inventory" ON user_inventory;
CREATE POLICY "Users manage own inventory" 
  ON user_inventory FOR ALL 
  USING (auth.uid() = user_id);

-- ============================================
-- FUNCTION: Auto-create profile on signup
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_id, total_coins)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'Player' || substr(NEW.id::text, 1, 8)),
    'bebean_std',
    0
  );
  RETURN NEW;
END;
$$;

-- ============================================
-- TRIGGER: Create profile on user signup
-- ============================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();
```

### 4.3 Verifikasi
Setelah klik **"Run"**, Anda harus melihat:
```
Success. No rows returned
```

**Jika ada error**, screenshot dan kirim ke saya.

---

## 🔐 Langkah 5: Setup Google OAuth (Opsional)

### 5.1 Aktifkan Google Provider
1. Di Supabase sidebar, klik **🔒 Authentication**
2. Klik **Providers** tab
3. Cari **Google** dan klik untuk expand

### 5.2 Dapatkan Google Credentials

#### A. Buka Google Cloud Console
1. Buka [https://console.cloud.google.com](https://console.cloud.google.com)
2. Login dengan akun Google Anda
3. Klik **"Select a project"** → **"New Project"**
4. Nama project: `rare-angon-oauth`
5. Klik **"Create"**

#### B. Enable Google+ API
1. Di sidebar, klik **"APIs & Services"** → **"Library"**
2. Search: `Google+ API`
3. Klik **"Enable"**

#### C. Buat OAuth Credentials
1. Klik **"APIs & Services"** → **"Credentials"**
2. Klik **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
3. Jika diminta, klik **"Configure Consent Screen"**:
   - User Type: **External**
   - App name: `Rare Angon`
   - User support email: (email Anda)
   - Developer contact: (email Anda)
   - Klik **"Save and Continue"** sampai selesai
4. Kembali ke **"Credentials"** → **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
5. Application type: **Web application**
6. Name: `Rare Angon Web`
7. **Authorized redirect URIs**: Klik **"+ ADD URI"**
   - Paste: `https://xxxxxxxxxxxxx.supabase.co/auth/v1/callback`
   - (Ganti `xxxxxxxxxxxxx` dengan Project URL Anda dari Langkah 3)
8. Klik **"Create"**

#### D. Copy Credentials ke Supabase
1. Copy **Client ID** (contoh: `123456789-abc.apps.googleusercontent.com`)
2. Copy **Client Secret** (contoh: `GOCSPX-abcdefg...`)
3. Kembali ke **Supabase** → **Authentication** → **Providers** → **Google**
4. Paste:
   - **Client ID** → field "Client ID"
   - **Client Secret** → field "Client Secret"
5. Toggle **"Enable Sign in with Google"** → ON
6. Klik **"Save"**

---

## ✅ Langkah 6: Test Koneksi

### 6.1 Buka Browser Console
1. Buka game di browser (`http://localhost:3000`)
2. Tekan **F12** untuk buka DevTools
3. Klik tab **Console**

### 6.2 Test Query
Paste kode berikut di console dan tekan Enter:

```javascript
import('http://localhost:3000/js/services/SupabaseService.js').then(async (module) => {
  const { supabaseService } = module;
  const { data, error } = await supabaseService.supabase.from('profiles').select('*');
  console.log('✅ Test connection:', data, error);
});
```

**Output yang diharapkan:**
```javascript
✅ Test connection: [] null
```

Jika melihat `[]` (array kosong) dan `null` (no error), **SUKSES!** ✅

---

## 🎮 Langkah 7: Integrasi ke Game

Sekarang kita hubungkan `Storage.js` dengan Supabase:

### 7.1 Update Storage.js

Buka `js/utils/Storage.js` dan tambahkan import:

```javascript
import { supabaseService } from '../services/SupabaseService.js';
```

### 7.2 Test Login di Game

Tambahkan tombol login sementara di `index.html` (di dalam `screen-menu`):

```html
<button id="btn-login-test" class="btn-pixel" style="margin-top: 20px;">
  🔐 TEST LOGIN
</button>
```

Tambahkan event listener di `UIManager.js`:

```javascript
document.getElementById("btn-login-test").onclick = async () => {
  const { user, error } = await supabaseService.signInWithGoogle();
  if (error) {
    alert('Login gagal: ' + error.message);
  } else {
    alert('Login sukses! User: ' + user.email);
  }
};
```

---

## 🐛 Troubleshooting

### Error: "relation 'profiles' does not exist"
**Solusi**: SQL migration belum dijalankan. Ulangi Langkah 4.

### Error: "Invalid API key"
**Solusi**: 
1. Periksa `js/config/supabase.config.js`
2. Pastikan tidak ada spasi/typo di `SUPABASE_ANON_KEY`
3. Re-copy dari Supabase Dashboard

### Error: "new row violates row-level security policy"
**Solusi**: RLS policies belum di-setup. Pastikan semua `CREATE POLICY` di Langkah 4 dijalankan.

### Warning: "Function has a role mutable search_path"
**Solusi**: Ini warning keamanan. Sudah diperbaiki dengan menambahkan `SET search_path = public` di function. Jalankan ulang SQL di Langkah 4.

### Loading Screen Stuck
**Solusi**: 
1. Buka Console (F12) dan cek error
2. Jika ada error "Webcam permission denied", klik **Allow** saat browser minta izin
3. Jika tetap stuck, refresh page (Ctrl+R)

---

## 📞 Bantuan Lebih Lanjut

Jika masih ada masalah:
1. Screenshot error di Console (F12)
2. Screenshot Supabase Dashboard (bagian yang error)
3. Kirim ke saya untuk debugging

**Selamat! Anda sudah siap menggunakan Supabase!** 🎉
