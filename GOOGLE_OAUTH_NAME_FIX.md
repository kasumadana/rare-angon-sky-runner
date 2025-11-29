# 🔧 Cara Mengubah Nama di Google Login

Jika saat login Google muncul nama "hvmxltyneaarfxjgsrpb.supabase.co" instead of "Rare Angon", ikuti langkah berikut:

## Langkah 1: Buka Google Cloud Console

1. Buka [https://console.cloud.google.com](https://console.cloud.google.com)
2. Pilih project yang Anda gunakan untuk OAuth (rare-angon-oauth atau nama lain)

## Langkah 2: Edit OAuth Consent Screen

1. Di sidebar kiri, klik **APIs & Services** → **OAuth consent screen**
2. Klik tombol **EDIT APP** di bagian atas
3. Ubah informasi berikut:
   - **App name**: `Rare Angon` (atau nama yang Anda inginkan)
   - **User support email**: Email Anda
   - **App logo** (opsional): Upload logo 120x120px
   - **Application home page** (opsional): URL website Anda
   - **Authorized domains**: Tambahkan `supabase.co`
4. Klik **SAVE AND CONTINUE**
5. Di halaman **Scopes**, klik **SAVE AND CONTINUE** (tidak perlu ubah)
6. Di halaman **Test users**, klik **SAVE AND CONTINUE**
7. Klik **BACK TO DASHBOARD**

## Langkah 3: Publish App (Opsional)

Jika ingin semua orang bisa login (bukan hanya test users):

1. Di OAuth consent screen, klik **PUBLISH APP**
2. Klik **CONFIRM**

**Note**: Untuk production, Google akan review app Anda (bisa 1-2 minggu). Untuk development, mode "Testing" sudah cukup.

## Langkah 4: Test Login

1. Logout dari game (jika sudah login)
2. Clear browser cache (Ctrl+Shift+Delete)
3. Login lagi
4. Sekarang harus muncul "Rare Angon" instead of URL Supabase

---

## Troubleshooting

**Masih muncul URL Supabase?**
- Clear browser cache dan cookies
- Logout dari Google account, lalu login lagi
- Tunggu 5-10 menit untuk propagasi perubahan

**Error "Access blocked: This app's request is invalid"?**
- Pastikan email Anda ada di Test users list
- Atau publish app ke production
