# 🎮 Rare Angon - Testing Checklist

## ✅ Pre-Test Setup
- [x] Hard refresh browser (Ctrl+Shift+R)
- [x] Open DevTools Console (F12)
- [x] Check for errors

## 🎯 Test 1: Game Starts & Entities Visible
**Steps:**
1. Click "▶️ TERBANG" button
2. Observe gameplay

**Expected Results:**
- ✅ Canvas visible with blue gradient background
- ✅ Player (red kite) visible at bottom center
- ✅ Obstacles (black birds) spawn from top and move down
- ✅ Coins (gold circles with square hole) spawn and move down
- ✅ Score in HUD increases (top left)
- ✅ Coin count in HUD shows collected coins

**Status:** ___________

---

## 🛒 Test 2: Shop Items Display
**Steps:**
1. From menu, click "🛒 WARUNG"
2. Check all items visible

**Expected Results:**
- ✅ 3 items displayed:
  - 🪁 BEBEAN STANDAR (0 koin) - "Layangan klasik untuk pemula"
  - 💜 PECUKAN LINCAH (100 koin) - "Layangan ungu yang gesit"
  - 🖤 JANGGAN LEGENDA (500 koin) - "Layangan hitam legendaris"
- ✅ Each item has: emoji (48px), name, description, button
- ✅ Current coins displayed at top

**Status:** ___________

---

## 👤 Test 3: Guest Mode (Not Logged In)
**Steps:**
1. Ensure logged out (or use incognito)
2. Go to main menu
3. Check UI elements

**Expected Results:**
- ✅ NO username pill visible (👤 icon + name)
- ✅ Only coin count visible (🪙 number)
- ✅ "👤 MASUK" button text (not "PROFIL")
- ✅ Coin count shows LOCAL storage value

**Status:** ___________

---

## 🔐 Test 4: Login & Profile
**Steps:**
1. Click "👤 MASUK"
2. Click "🔐 MASUK DENGAN GOOGLE"
3. Complete Google login
4. Return to menu

**Expected Results:**
- ✅ Username pill appears with email prefix or custom username
- ✅ Button changes to "👤 PROFIL"
- ✅ Coin count loads from cloud (Supabase)

**Status:** ___________

---

## ✏️ Test 5: Edit Username
**Steps:**
1. While logged in, click "👤 PROFIL"
2. Edit username field to "TestPlayer"
3. Click 💾 save button
4. Return to menu

**Expected Results:**
- ✅ Alert "Username berhasil diubah!"
- ✅ Menu shows "TestPlayer" in username pill
- ✅ Profile screen shows "TestPlayer"

**Status:** ___________

---

## 🏆 Test 6: Leaderboard
**Steps:**
1. Click "🏆 PAPAN SKOR"
2. Check both tabs

**Expected Results:**
- ✅ "🌍 GLOBAL" tab shows top scores
- ✅ "👤 SAYA" tab shows personal best
- ✅ Ranks show #1, #2, #3 with colors (gold, silver, bronze)
- ✅ Each entry shows: rank, avatar emoji, username, score

**Status:** ___________

---

## 🚪 Test 7: Logout
**Steps:**
1. While logged in, click "👤 PROFIL"
2. Click "🚪 KELUAR"
3. Observe behavior

**Expected Results:**
- ✅ Alert "Berhasil keluar"
- ✅ Page reloads automatically
- ✅ Back to guest mode (no username pill)
- ✅ Coins show LOCAL value (not previous user's cloud value)

**Status:** ___________

---

## 🎮 Test 8: Gameplay Flow
**Steps:**
1. Start game
2. Play until game over
3. Check game over screen

**Expected Results:**
- ✅ Player moves left/right with keyboard (A/D)
- ✅ Collision with obstacle triggers game over
- ✅ Collecting coins increases count
- ✅ Game over screen shows: final score, high score, coins collected
- ✅ "🔄 MAIN LAGI" restarts game
- ✅ "🏠 MENU" returns to menu

**Status:** ___________

---

## 📱 Test 9: Mobile Responsive
**Steps:**
1. Open DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Select mobile device (e.g., iPhone 12)

**Expected Results:**
- ✅ Canvas scales to fit screen
- ✅ Touch control buttons appear at bottom
- ✅ Webcam preview smaller (bottom-right)
- ✅ All text readable
- ✅ Buttons tappable

**Status:** ___________

---

## 🔄 Test 10: Cloud Sync (If Logged In)
**Steps:**
1. Login on Browser A (Chrome)
2. Play game, collect 50 coins
3. Game over (auto-sync)
4. Open Browser B (Edge)
5. Login with same account

**Expected Results:**
- ✅ Browser B shows same coin count (50)
- ✅ Browser B shows same high score
- ✅ Leaderboard shows updated score

**Status:** ___________

---

## 🐛 Console Errors Check
**Expected:**
- ✅ NO red errors in console
- ⚠️ Yellow warnings OK (e.g., Supabase config if not set up)
- ✅ Blue info logs OK

**Actual Console Output:**
```
(Paste any errors here)
```

---

## 📊 Final Verification

| Feature | Working? | Notes |
|---------|----------|-------|
| Game starts | ☐ Yes ☐ No | |
| Entities visible | ☐ Yes ☐ No | |
| Score increases | ☐ Yes ☐ No | |
| Shop items (3) | ☐ Yes ☐ No | |
| Guest mode | ☐ Yes ☐ No | |
| Login | ☐ Yes ☐ No | |
| Profile | ☐ Yes ☐ No | |
| Leaderboard | ☐ Yes ☐ No | |
| Logout | ☐ Yes ☐ No | |
| Mobile | ☐ Yes ☐ No | |

---

## 🎉 Success Criteria
**ALL features must pass for production ready:**
- [ ] Game playable (entities visible, score works)
- [ ] Shop functional (3 items with emoji)
- [ ] Guest mode correct (no username, local coins)
- [ ] Login works (Google OAuth)
- [ ] Profile editable (username from database)
- [ ] Leaderboard loads
- [ ] Logout clears state
- [ ] Mobile responsive
- [ ] No console errors

**Overall Status:** ☐ PASS ☐ FAIL

**Notes:**
