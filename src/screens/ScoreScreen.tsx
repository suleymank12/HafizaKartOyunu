import { LinearGradient } from 'expo-linear-gradient';
import * as StoreReview from 'expo-store-review';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAchievementEarnings } from '../utils/achievements';
import { getDailyRewardEarnings } from '../utils/dailyReward';
import { getScores, ScoreRecord } from '../utils/gameLogic';
import { t, tOr } from '../utils/i18n';
import { getSpentPoints } from '../utils/market';

type ScoreScreenProps = {
  score: number;
  moves: number;
  time: string;
  difficulty: string;
  won: boolean;
  earnedCoins: number;
  onNewGame: () => void;
  onHome: () => void;
};

const ScoreScreen = ({ score, moves, time, difficulty, won, earnedCoins, onNewGame, onHome }: ScoreScreenProps) => {
  const insets = useSafeAreaInsets();
  const [pastScores, setPastScores] = useState<ScoreRecord[]>([]);
  const [totalScore, setTotalScore] = useState(0);
  const [balanceScore, setBalanceScore] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const difficultyDisplay = tOr(`diff.${difficulty}`, difficulty);

  useEffect(() => {
    const loadScores = async () => {
      try {
        const scores = await getScores();
        setPastScores(scores);
        const total = scores.reduce((sum, s) => sum + s.score, 0);
        setTotalScore(total);
        const totalCoins = scores.reduce((sum, s) => sum + (s.earnedCoins || 0), 0);
        const dailyEarnings = await getDailyRewardEarnings();
        const achievementEarnings = await getAchievementEarnings();
        const spent = await getSpentPoints();
        setBalanceScore(Math.max(0, totalCoins + dailyEarnings + achievementEarnings - spent));

        if (won && scores.length >= 5) {
          const alreadyAsked = await AsyncStorage.getItem('review_requested');
          if (!alreadyAsked) {
            const isAvailable = await StoreReview.isAvailableAsync();
            if (isAvailable) {
              await StoreReview.requestReview();
              await AsyncStorage.setItem('review_requested', 'true');
            }
          }
        }
      } finally {
        setIsLoading(false);
      }
    };
    loadScores();
  }, []);

  if (isLoading) {
    return (
      <LinearGradient colors={['#0f0c29', '#302b63', '#24243e']} style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00d4ff" />
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#0f0c29', '#302b63', '#24243e']} style={styles.container}>
      <View style={[styles.inner, { paddingTop: insets.top + 10 }]}>
        <Text style={styles.title}>{won ? t('score.win') : t('score.lose')}</Text>

        <View style={styles.statsCard}>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>{t('game.score')}</Text>
            <Text style={styles.statValueGold}>{score}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>{t('score.earned')}</Text>
            <Text style={styles.statValueGreen}>{earnedCoins}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>{t('game.moves')}</Text>
            <Text style={styles.statValue}>{moves}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>{t('game.time')}</Text>
            <Text style={styles.statValue}>{time}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>{t('score.difficulty')}</Text>
            <Text style={styles.statValue}>{difficultyDisplay}</Text>
          </View>
        </View>

        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>{t('score.totalScore')}</Text>
          <Text style={styles.totalValue}>{totalScore}</Text>
        </View>

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>{t('score.balance')}</Text>
          <Text style={styles.balanceValue}>{balanceScore}</Text>
        </View>

        {pastScores.length > 0 && (
          <View style={styles.historyCard}>
            <Text style={styles.historyTitle}>{t('score.history')}</Text>
            <FlatList
              data={pastScores}
              keyExtractor={(_, i) => i.toString()}
              showsVerticalScrollIndicator={false}
              renderItem={({ item, index }) => (
                <View style={styles.historyRow}>
                  <Text style={styles.historyRank}>#{index + 1}</Text>
                  <Text style={styles.historyScore}>{item.score}</Text>
                  <Text style={styles.historyDiff}>{tOr(`diff.${item.difficulty}`, item.difficulty)}</Text>
                  <Text style={styles.historyTime}>{item.time}</Text>
                </View>
              )}
            />
          </View>
        )}

        <TouchableOpacity style={styles.newGameButton} onPress={onNewGame}>
          <LinearGradient colors={['#00c864', '#00a050']} style={styles.buttonGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={styles.buttonText}>{t('game.newGame')}</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.homeButton} onPress={onHome}>
          <Text style={styles.homeButtonText}>{t('game.home')}</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, alignItems: 'center', paddingHorizontal: 20 },
  title: { fontSize: 30, fontWeight: '900', color: '#ffc107', letterSpacing: 4, marginBottom: 20 },
  statsCard: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 16, padding: 18, width: '100%', maxWidth: 340, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', marginBottom: 12 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 7 },
  statLabel: { fontSize: 13, color: '#a0a0b0', letterSpacing: 1 },
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#ffffff' },
  statValueGold: { fontSize: 20, fontWeight: 'bold', color: '#ffc107' },
  statValueGreen: { fontSize: 20, fontWeight: 'bold', color: '#00c864' },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  totalCard: { backgroundColor: 'rgba(255,199,7,0.1)', borderRadius: 14, paddingVertical: 12, paddingHorizontal: 20, width: '100%', maxWidth: 340, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,199,7,0.25)', marginBottom: 12 },
  totalLabel: { fontSize: 13, color: '#ffc107', letterSpacing: 1, fontWeight: 'bold' },
  totalValue: { fontSize: 22, fontWeight: 'bold', color: '#ffc107' },
  balanceCard: { backgroundColor: 'rgba(0,200,100,0.08)', borderRadius: 14, paddingVertical: 10, paddingHorizontal: 20, width: '100%', maxWidth: 340, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,200,100,0.2)', marginBottom: 12 },
  balanceLabel: { fontSize: 12, color: '#00c864', letterSpacing: 1, fontWeight: 'bold' },
  balanceValue: { fontSize: 20, fontWeight: 'bold', color: '#00c864' },
  historyCard: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 15, width: '100%', maxWidth: 340, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginBottom: 15, flex: 1 },
  historyTitle: { fontSize: 12, color: '#a0a0b0', letterSpacing: 1, marginBottom: 10, textAlign: 'center' },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  historyRank: { fontSize: 14, color: '#a0a0b0', width: 30 },
  historyScore: { fontSize: 16, fontWeight: 'bold', color: '#ffc107', flex: 1 },
  historyDiff: { fontSize: 12, color: '#a0a0b0', flex: 1, textAlign: 'center' },
  historyTime: { fontSize: 14, color: '#ffffff', width: 50, textAlign: 'right' },
  newGameButton: { borderRadius: 14, overflow: 'hidden', marginBottom: 12 },
  buttonGradient: { paddingHorizontal: 50, paddingVertical: 16 },
  buttonText: { color: '#ffffff', fontSize: 18, fontWeight: 'bold', letterSpacing: 3 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#a0a0b0', fontSize: 14, marginTop: 12, letterSpacing: 1 },
  homeButton: { paddingHorizontal: 50, paddingVertical: 10, marginBottom: 20 },
  homeButtonText: { color: '#a0a0b0', fontSize: 16, letterSpacing: 2 },
});

export default ScoreScreen;
