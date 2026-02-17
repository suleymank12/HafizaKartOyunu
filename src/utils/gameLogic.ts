import AsyncStorage from '@react-native-async-storage/async-storage';

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
    if (scores.length > 20) scores.pop();
    await AsyncStorage.setItem('scores', JSON.stringify(scores));
  } catch (e) {
    console.log('Skor kaydetme hatasi:', e);
  }
};

export const getScores = async (): Promise<ScoreRecord[]> => {
  try {
    const data = await AsyncStorage.getItem('scores');
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.log('Skor okuma hatasi:', e);
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
  } catch (e) {
    console.log('Skor temizleme hatasi:', e);
  }
};