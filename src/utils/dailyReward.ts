import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  lastClaim: 'daily_reward_last_claim',
  streak: 'daily_reward_streak',
  totalEarnedCoins: 'daily_reward_total_earned',
};

export type DailyRewardInfo = {
  canClaim: boolean;
  streak: number;
  reward: number;
  isDay7Bonus: boolean;
};

const getDayString = (date: Date): string => {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
};

const daysBetween = (d1: string, d2: string): number => {
  const date1 = new Date(d1.replace(/-/g, '/'));
  const date2 = new Date(d2.replace(/-/g, '/'));
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

export const checkDailyReward = async (): Promise<DailyRewardInfo> => {
  try {
    const lastClaim = await AsyncStorage.getItem(KEYS.lastClaim);
    const streakStr = await AsyncStorage.getItem(KEYS.streak);
    const today = getDayString(new Date());

    if (lastClaim === today) {
      const streak = streakStr ? parseInt(streakStr, 10) : 0;
      return { canClaim: false, streak, reward: 0, isDay7Bonus: false };
    }

    let streak = streakStr ? parseInt(streakStr, 10) : 0;

    if (lastClaim) {
      const diff = daysBetween(lastClaim, today);
      if (diff === 1) {
        streak += 1;
      } else {
        streak = 1;
      }
    } else {
      streak = 1;
    }

    const isDay7Bonus = streak === 7;
    const reward = isDay7Bonus ? 500 : 50;

    return { canClaim: true, streak, reward, isDay7Bonus };
  } catch (_) {
    return { canClaim: false, streak: 0, reward: 0, isDay7Bonus: false };
  }
};

export const claimDailyReward = async (): Promise<number> => {
  try {
    const info = await checkDailyReward();
    if (!info.canClaim) return 0;

    const today = getDayString(new Date());
    const newStreak = info.streak >= 7 ? 0 : info.streak;

    await AsyncStorage.setItem(KEYS.lastClaim, today);
    await AsyncStorage.setItem(KEYS.streak, String(newStreak));

    const existingStr = await AsyncStorage.getItem(KEYS.totalEarnedCoins);
    const existing = existingStr ? parseInt(existingStr, 10) : 0;
    await AsyncStorage.setItem(KEYS.totalEarnedCoins, String(existing + info.reward));

    return info.reward;
  } catch (_) {
    return 0;
  }
};

export const getDailyRewardEarnings = async (): Promise<number> => {
  try {
    const data = await AsyncStorage.getItem(KEYS.totalEarnedCoins);
    return data ? parseInt(data, 10) : 0;
  } catch (_) {
    return 0;
  }
};
