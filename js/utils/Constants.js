export const GAME_STATE = { //menyimpan semua data besar yang di gunakan di seluruh game
  LOADING: "LOADING", // Status saat game sedang memuat aset
  MENU: "MENU", // Status saat berada di menu utama
  SHOP: "SHOP", // Status saat berada di toko
  PLAYING: "PLAYING", // Status saat permainan sedang berlangsung
  GAMEOVER: "GAMEOVER", // Status saat permainan berakhir
};

export const CONFIG = { // mengatur alur game
  CANVAS_WIDTH: 800, // Lebar kanvas permainan
  CANVAS_HEIGHT: 600, // Tinggi kanvas permainan
  BASE_SPEED: 250, // Kecepatan dasar pergerakan objek
  LANE_WIDTH: 150, // Lebar setiap jalur lintasan
  SPAWN_RATE: 1.2, // Tingkat kemunculan rintangan
  DEBUG_MODE: false, // Mode debug untuk pengembangan
};

export const LANES = { // digunakan untuk posisi pemain
  LEFT: 0, // Jalur kiri
  CENTER: 1, // Jalur tengah
  RIGHT: 2, // Jalur kanan
};

export const OBSTACLE_TYPE = {
  BIRD: "BIRD", // Rintangan tipe burung
  DRONE: "DRONE", // Rintangan tipe drone
};

export const PALETTE = {
  SKY_TOP: "#48CAE4", // Warna langit bagian atas
  SKY_BOTTOM: "#ADE8F4", // Warna langit bagian bawah
  EMAS: "#FFE66D", // Warna emas
  BATA: "#FF6B6B", // Warna merah bata
  BIRU_LANGIT: "#48CAE4", // Warna biru langit
  DARK: "#2C3E50", // Warna gelap
  COIN: "#FFC107", // Warna koin
  CYAN: "#00BCD4", // Warna cyan
};

export const ASSETS = {
  IMAGES: {
    // Skin Layangan
    SKIN_PECUKAN: "assets/images/kite_pecukan.png", // Gambar skin Pecukan
    SKIN_BEBEAN: "assets/images/kite_bebean.png", // Gambar skin Bebean
    SKIN_KUWIR: "assets/images/kite_kuwir.png", // Gambar skin Kuwir
    
    // Musuh
    OBS_BIRD_1: "assets/images/obs_bird_1.png", // Gambar burung variasi 1
    OBS_BIRD_2: "assets/images/obs_bird_2.png", // Gambar burung variasi 2
    OBS_BIRD_3: "assets/images/obs_bird_3.png", // Gambar burung variasi 3
    OBS_DRONE: "assets/images/obs_drone.png", // Gambar drone
    
    // Lingkungan
    CLOUD_SMALL: "assets/images/bg_cloud_small.png", // Gambar awan kecil
    CLOUD_BIG: "assets/images/bg_cloud_big.png", // Gambar awan besar
    
    // Item
    ITEM_COIN: "assets/images/item_coin.png", // Gambar koin
    
    // Antarmuka Pengguna (UI)
    UI_ARROW: "assets/images/ui_arrow.png", // Gambar panah UI
  },
  SOUNDS: {
    SELECT: "assets/sounds/sfx-select.mp3", // Suara saat memilih menu
    WHOOSH: "assets/sounds/sfx-whoosh.mp3", // Suara desingan angin
    COIN: "assets/sounds/sfx-coin.mp3", // Suara saat mengambil koin
    HIT: "assets/sounds/sfx-hit.mp3", // Suara saat menabrak rintangan
    BUY: "assets/sounds/sfx-shop-buy.mp3", // Suara saat membeli item
    BGM_MENU: "assets/sounds/bgm-menu.mp3", // Musik latar menu
    BGM_GAMEPLAY: "assets/sounds/bgm-gameplay.mp3", // Musik latar permainan
  }
};

export const SPRITES = {
  BIRD: {
    FRAMES: ["OBS_BIRD_1", "OBS_BIRD_2", "OBS_BIRD_3"], // Frame animasi burung
    ANIMATION_SPEED: 0.15, // Kecepatan animasi burung
    WIDTH: 60, // Lebar sprite burung
    HEIGHT: 40 // Tinggi sprite burung
  },
  DRONE: {
    WIDTH: 50, // Lebar sprite drone
    HEIGHT: 50 // Tinggi sprite drone
  },
  PLAYER: {
    WIDTH: 120, // Lebar sprite pemain
    HEIGHT: 120 // Tinggi sprite pemain
  },
  COIN: {
    WIDTH: 40, // Lebar sprite koin
    HEIGHT: 40 // Tinggi sprite koin
  }
};

export const SHOP_ITEMS = [
  { 
    id: "bebean_std", // ID unik item
    name: "BEBEAN STANDAR", // Nama tampilan item
    cost: 0, // Harga item (gratis untuk default)
    imageKey: "SKIN_BEBEAN", // Kunci aset gambar
    description: "Layangan klasik untuk pemula" // Deskripsi item
  },
  { 
    id: "pecukan_agile", // ID unik item
    name: "PECUKAN LINCAH", // Nama tampilan item
    cost: 100, // Harga item
    imageKey: "SKIN_PECUKAN", // Kunci aset gambar
    description: "Layangan pecukan yang gesit" // Deskripsi item
  },
  { 
    id: "janggan_legend", // ID unik item
    name: "KUWIR LEGENDA", // Nama tampilan item
    cost: 500, // Harga item
    imageKey: "SKIN_KUWIR", // Kunci aset gambar
    description: "Layangan kuwir legendaris" // Deskripsi item
  },
];
