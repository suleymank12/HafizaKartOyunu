import AsyncStorage from '@react-native-async-storage/async-storage';

const MAX_SCORES = 50;

export type ScoreRecord = {
  score: number;
  moves: number;
  time: string;
  difficulty: string;
  date: string;
};

export const saveScore = async (record: ScoreRecord) => {
  try {
    const existing = await AsyncStorage.getItem('scores');
    const scores: ScoreRecord[] = existing ? JSON.parse(existing) : [];
    scores.push(record);
    while (scores.length > MAX_SCORES) {
      scores.shift();
    }
    await AsyncStorage.setItem('scores', JSON.stringify(scores));
  } catch (_) {
    // sessiz hata
  }
};

export const getScores = async (): Promise<ScoreRecord[]> => {
  try {
    const data = await AsyncStorage.getItem('scores');
    return data ? JSON.parse(data) : [];
  } catch (_) {
    return [];
  }
};

export const getHighScore = async (): Promise<number> => {
  const scores = await getScores();
  if (scores.length === 0) return 0;
  return Math.max(...scores.map((s) => s.score));
};

export const clearScores = async () => {
  try {
    await AsyncStorage.removeItem('scores');
  } catch (_) {
    // sessiz hata
  }
};
