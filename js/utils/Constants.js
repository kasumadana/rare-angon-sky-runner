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
  LANE_WIDTH: 150, 
  SPAWN_RATE: 1.2,
  DEBUG_MODE: false,
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

export const PALETTE = {
  SKY_TOP: "#48CAE4",
  SKY_BOTTOM: "#ADE8F4",
  EMAS: "#FFE66D",
  BATA: "#FF6B6B",
  BIRU_LANGIT: "#48CAE4",
  DARK: "#2C3E50",
  COIN: "#FFC107",
  CYAN: "#00BCD4",
};

export const ASSETS = {
  IMAGES: {
    // Skins
    SKIN_PECUKAN: "assets/images/kite_pecukan.png",
    SKIN_BEBEAN: "assets/images/kite_bebean.png",
    SKIN_KUWIR: "assets/images/kite_kuwir.png",
    
    // Enemies
    OBS_BIRD_1: "assets/images/obs_bird_1.png",
    OBS_BIRD_2: "assets/images/obs_bird_2.png",
    OBS_BIRD_3: "assets/images/obs_bird_3.png",
    OBS_DRONE: "assets/images/obs_drone.png",
    
    // Environment
    CLOUD_SMALL: "assets/images/bg_cloud_small.png",
    CLOUD_BIG: "assets/images/bg_cloud_big.png",
    
    // Items
    ITEM_COIN: "assets/images/item_coin.png",
    
    // UI
    UI_ARROW: "assets/images/ui_arrow.png",
  },
  SOUNDS: {
    SELECT: "assets/sounds/sfx-select.mp3",
    WHOOSH: "assets/sounds/sfx-whoosh.mp3",
    COIN: "assets/sounds/sfx-coin.mp3",
    HIT: "assets/sounds/sfx-hit.mp3",
    BUY: "assets/sounds/sfx-shop-buy.mp3",
    BGM_MENU: "assets/sounds/bgm-menu.mp3",
    BGM_GAMEPLAY: "assets/sounds/bgm-gameplay.mp3",
  }
};

export const SPRITES = {
  BIRD: {
    FRAMES: ["OBS_BIRD_1", "OBS_BIRD_2", "OBS_BIRD_3"],
    ANIMATION_SPEED: 0.15,
    WIDTH: 60,
    HEIGHT: 40
  },
  DRONE: {
    WIDTH: 50,
    HEIGHT: 50
  },
  PLAYER: {
    WIDTH: 120,
    HEIGHT: 120
  },
  COIN: {
    WIDTH: 40,
    HEIGHT: 40
  }
};

export const SHOP_ITEMS = [
  { 
    id: "bebean_std", 
    name: "BEBEAN STANDAR", 
    cost: 0,
    imageKey: "SKIN_BEBEAN",
    description: "Layangan klasik untuk pemula"
  },
  { 
    id: "pecukan_agile", 
    name: "PECUKAN LINCAH", 
    cost: 100,
    imageKey: "SKIN_PECUKAN",
    description: "Layangan pecukan yang gesit"
  },
  { 
    id: "janggan_legend", 
    name: "KUWIR LEGENDA", 
    cost: 500,
    imageKey: "SKIN_KUWIR",
    description: "Layangan kuwir legendaris"
  },
];
