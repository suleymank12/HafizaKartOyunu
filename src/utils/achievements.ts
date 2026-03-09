import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  unlocked: 'achievements_unlocked',
  earnedCoins: 'achievements_earned_coins',
};

export type Achievement = {
  id: string;
  name: string;
  description: string;
  reward: number;
  icon: string;
  color: string;
};

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_game', name: 'İlk Oyun', description: 'İlk oyununu tamamla', reward: 50, icon: '🎮', color: '#00c864' },
  { id: 'combo_5', name: '5 Combo', description: '5 combo yap', reward: 100, icon: '🔥', color: '#ff6b35' },
  { id: 'combo_10', name: '10 Combo', description: '10 combo yap', reward: 200, icon: '💥', color: '#e94560' },
  { id: 'games_50', name: '50 Oyun', description: '50 oyun tamamla', reward: 300, icon: '🏆', color: '#ffc107' },
  { id: 'perfect_10', name: 'Mükemmel x10', description: 'Tüm kartları 10 kez eşleştir', reward: 250, icon: '⭐', color: '#00d4ff' },
  { id: 'first_purchase', name: 'İlk Alışveriş', description: 'Marketten ilk alışverişini yap', reward: 100, icon: '🛒', color: '#9c27b0' },
];

export const getUnlockedAchievements = async (): Promise<string[]> => {
  try {
    const data = await AsyncStorage.getItem(KEYS.unlocked);
    return data ? JSON.parse(data) : [];
  } catch (_) {
    return [];
  }
};

export const unlockAchievement = async (achievementId: string): Promise<number> => {
  try {
    const unlocked = await getUnlockedAchievements();
    if (unlocked.includes(achievementId)) return 0;

    const achievement = ACHIEVEMENTS.find((a) => a.id === achievementId);
    if (!achievement) return 0;

    unlocked.push(achievementId);
    await AsyncStorage.setItem(KEYS.unlocked, JSON.stringify(unlocked));

    const existingStr = await AsyncStorage.getItem(KEYS.earnedCoins);
    const existing = existingStr ? parseInt(existingStr, 10) : 0;
    await AsyncStorage.setItem(KEYS.earnedCoins, String(existing + achievement.reward));

    return achievement.reward;
  } catch (_) {
    return 0;
  }
};

export const getAchievementEarnings = async (): Promise<number> => {
  try {
    const data = await AsyncStorage.getItem(KEYS.earnedCoins);
    return data ? parseInt(data, 10) : 0;
  } catch (_) {
    return 0;
  }
};

export const checkGameAchievements = async (
  totalGames: number,
  maxCombo: number,
  totalWins: number,
): Promise<string[]> => {
  const newlyUnlocked: string[] = [];
  const unlocked = await getUnlockedAchievements();

  if (!unlocked.includes('first_game') && totalGames >= 1) {
    await unlockAchievement('first_game');
    newlyUnlocked.push('first_game');
  }

  if (!unlocked.includes('combo_5') && maxCombo >= 5) {
    await unlockAchievement('combo_5');
    newlyUnlocked.push('combo_5');
  }

  if (!unlocked.includes('combo_10') && maxCombo >= 10) {
    await unlockAchievement('combo_10');
    newlyUnlocked.push('combo_10');
  }

  if (!unlocked.includes('games_50') && totalGames >= 50) {
    await unlockAchievement('games_50');
    newlyUnlocked.push('games_50');
  }

  if (!unlocked.includes('perfect_10') && totalWins >= 10) {
    await unlockAchievement('perfect_10');
    newlyUnlocked.push('perfect_10');
  }

  return newlyUnlocked;
};

export const checkPurchaseAchievement = async (): Promise<boolean> => {
  const unlocked = await getUnlockedAchievements();
  if (!unlocked.includes('first_purchase')) {
    await unlockAchievement('first_purchase');
    return true;
  }
  return false;
};
