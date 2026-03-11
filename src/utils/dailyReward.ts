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
  const [y1, m1, day1] = d1.split('-').map(Number);
  const [y2, m2, day2] = d2.split('-').map(Number);
  const date1 = new Date(y1, m1 - 1, day1);
  const date2 = new Date(y2, m2 - 1, day2);
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
  } catch (e) {
    console.warn('DailyReward hatası:', e);
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
  } catch (e) {
    console.warn('DailyReward hatası:', e);
    return 0;
  }
};

export const getDailyRewardEarnings = async (): Promise<number> => {
  try {
    const data = await AsyncStorage.getItem(KEYS.totalEarnedCoins);
    return data ? parseInt(data, 10) : 0;
  } catch (e) {
    console.warn('DailyReward hatası:', e);
    return 0;
  }
};
