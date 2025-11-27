export const GAME_STATE = {
  LOADING: "LOADING",
  MENU: "MENU",
  SHOP: "SHOP",
  PLAYING: "PLAYING",
  GAMEOVER: "GAMEOVER",
};

export const CONFIG = {
  CANVAS_WIDTH: 800,
  CANVAS_HEIGHT: 600,
  BASE_SPEED: 250,
  LANE_WIDTH: 100,
  SPAWN_RATE: 1.2,
  DEBUG_MODE: true,
};

export const LANES = {
  LEFT: 0,
  CENTER: 1,
  RIGHT: 2,
};

export const OBSTACLE_TYPE = {
  BIRD: "BIRD",
  DRONE: "DRONE",
};

// PALETTE BARU: "Bali Sky Day"
export const PALETTE = {
  // Entitas
  BATA: "#E53935", // Merah Cabai (Lebih cerah agar pop di langit biru)
  EMAS: "#FFD700", // Emas Murni
  HITAM: "#263238", // Charcoal Blue (Bukan hitam pekat, lebih lembut)
  PUTIH: "#FFFFFF", // Awan Putih

  // Objek
  CYAN: "#00E5FF", // Aksen Tech
  COIN: "#FFC107", // Kuning Matahari

  // Background Langit (Gradasi Biru Cerah)
  SKY_TOP: "#00B4DB", // Biru Langit Cerah
  SKY_BOTTOM: "#B2FEFA", // Biru Pucat/Awan di horizon
};
