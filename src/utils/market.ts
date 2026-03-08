import AsyncStorage from '@react-native-async-storage/async-storage';

// --- Veri Tipleri ---

export type CardThemeColors = { normal: string; matched: string };

export type CardTheme = {
  id: string;
  name: string;
  colors: CardThemeColors;
  price: number;
};

export type BgTheme = {
  id: string;
  name: string;
  gradient: [string, string, string];
  price: number;
};

export type Consumable = {
  id: string;
  name: string;
  desc: string;
  price: number;
};

// --- Sabit Ürün Listeleri ---

export const CARD_THEMES: CardTheme[] = [
  { id: 'neon_blue', name: 'Neon Mavi', colors: { normal: '#00d4ff', matched: '#00c864' }, price: 500 },
  { id: 'fire_red', name: 'Kırmızı Ateş', colors: { normal: '#ff4444', matched: '#ff8800' }, price: 500 },
  { id: 'green_nature', name: 'Yeşil Doğa', colors: { normal: '#4caf50', matched: '#8bc34a' }, price: 500 },
];

export const BG_THEMES: BgTheme[] = [
  { id: 'ocean', name: 'Okyanus', gradient: ['#0f2027', '#203a43', '#2c5364'], price: 300 },
  { id: 'sunset', name: 'Gün Batımı', gradient: ['#2d1b69', '#6b3fa0', '#e94560'], price: 300 },
  { id: 'forest', name: 'Orman', gradient: ['#0a1a0a', '#1b4332', '#2d6a4f'], price: 300 },
];

export const CONSUMABLES: Consumable[] = [
  { id: 'extra_time', name: 'Ekstra Süre', desc: '+30 saniye bonus', price: 200 },
  { id: 'joker', name: 'Joker Kartı', desc: 'Tüm kartları 2 sn gösterir', price: 150 },
];

// Varsayılan renkler (tema seçilmediğinde)
export const DEFAULT_CARD_COLORS: CardThemeColors = { normal: '#00d4ff', matched: '#00c864' };
export const DEFAULT_BG_GRADIENT: [string, string, string] = ['#0f0c29', '#302b63', '#24243e'];

// --- AsyncStorage Anahtarları ---

const KEYS = {
  inventory: 'market_inventory',       // string[] - sahip olunan tema id'leri
  consumables: 'market_consumables',   // Record<string, number> - { extra_time: 2, joker: 1 }
  spent: 'market_spent',              // number - toplam harcanan puan
  activeCardTheme: 'active_card_theme', // string | null
  activeBgTheme: 'active_bg_theme',    // string | null
};

// --- Envanter Fonksiyonları ---

export const getInventory = async (): Promise<string[]> => {
  try {
    const data = await AsyncStorage.getItem(KEYS.inventory);
    return data ? JSON.parse(data) : [];
  } catch (_) {
    return [];
  }
};

export const getConsumables = async (): Promise<Record<string, number>> => {
  try {
    const data = await AsyncStorage.getItem(KEYS.consumables);
    return data ? JSON.parse(data) : {};
  } catch (_) {
    return {};
  }
};

export const getSpentPoints = async (): Promise<number> => {
  try {
    const data = await AsyncStorage.getItem(KEYS.spent);
    return data ? parseInt(data, 10) : 0;
  } catch (_) {
    return 0;
  }
};

export const getBalance = async (totalEarned: number): Promise<number> => {
  const spent = await getSpentPoints();
  return Math.max(0, totalEarned - spent);
};

// --- Satın Alma ---

export const purchaseTheme = async (themeId: string, price: number): Promise<boolean> => {
  try {
    const inventory = await getInventory();
    if (inventory.includes(themeId)) return false; // zaten sahip

    inventory.push(themeId);
    await AsyncStorage.setItem(KEYS.inventory, JSON.stringify(inventory));

    const spent = await getSpentPoints();
    await AsyncStorage.setItem(KEYS.spent, String(spent + price));

    return true;
  } catch (_) {
    return false;
  }
};

export const purchaseConsumable = async (itemId: string, price: number): Promise<boolean> => {
  try {
    const consumables = await getConsumables();
    consumables[itemId] = (consumables[itemId] || 0) + 1;
    await AsyncStorage.setItem(KEYS.consumables, JSON.stringify(consumables));

    const spent = await getSpentPoints();
    await AsyncStorage.setItem(KEYS.spent, String(spent + price));

    return true;
  } catch (_) {
    return false;
  }
};

export const useConsumable = async (itemId: string): Promise<boolean> => {
  try {
    const consumables = await getConsumables();
    if (!consumables[itemId] || consumables[itemId] <= 0) return false;

    consumables[itemId] -= 1;
    await AsyncStorage.setItem(KEYS.consumables, JSON.stringify(consumables));
    return true;
  } catch (_) {
    return false;
  }
};

// --- Aktif Tema ---

export const getActiveCardTheme = async (): Promise<CardThemeColors> => {
  try {
    const id = await AsyncStorage.getItem(KEYS.activeCardTheme);
    if (id) {
      const theme = CARD_THEMES.find((t) => t.id === id);
      if (theme) return theme.colors;
    }
  } catch (_) {
    // varsayılan
  }
  return DEFAULT_CARD_COLORS;
};

export const setActiveCardTheme = async (themeId: string | null): Promise<void> => {
  try {
    if (themeId) {
      await AsyncStorage.setItem(KEYS.activeCardTheme, themeId);
    } else {
      await AsyncStorage.removeItem(KEYS.activeCardTheme);
    }
  } catch (_) {
    // sessiz hata
  }
};

export const getActiveCardThemeId = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(KEYS.activeCardTheme);
  } catch (_) {
    return null;
  }
};

export const getActiveBgTheme = async (): Promise<[string, string, string]> => {
  try {
    const id = await AsyncStorage.getItem(KEYS.activeBgTheme);
    if (id) {
      const theme = BG_THEMES.find((t) => t.id === id);
      if (theme) return theme.gradient;
    }
  } catch (_) {
    // varsayılan
  }
  return DEFAULT_BG_GRADIENT;
};

export const setActiveBgTheme = async (themeId: string | null): Promise<void> => {
  try {
    if (themeId) {
      await AsyncStorage.setItem(KEYS.activeBgTheme, themeId);
    } else {
      await AsyncStorage.removeItem(KEYS.activeBgTheme);
    }
  } catch (_) {
    // sessiz hata
  }
};

export const getActiveBgThemeId = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(KEYS.activeBgTheme);
  } catch (_) {
    return null;
  }
};
