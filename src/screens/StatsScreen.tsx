import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAchievementEarnings } from '../utils/achievements';
import { getDailyRewardEarnings } from '../utils/dailyReward';
import { getScores, ScoreRecord } from '../utils/gameLogic';
import { t } from '../utils/i18n';
import { getSpentPoints } from '../utils/market';

type StatsScreenProps = {
  onBack: () => void;
};

type DifficultyStats = {
  games: number;
  wins: number;
  avgScore: number;
  bestScore: number;
  bestCombo: number;
};

const StatsScreen = ({ onBack }: StatsScreenProps) => {
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(true);
  const [totalGames, setTotalGames] = useState(0);
  const [totalWins, setTotalWins] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [totalEarned, setTotalEarned] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [diffStats, setDiffStats] = useState<Record<string, DifficultyStats>>({});

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const scores = await getScores();
      const dailyEarnings = await getDailyRewardEarnings();
      const achievementEarnings = await getAchievementEarnings();
      const spent = await getSpentPoints();

      setTotalGames(scores.length);
      setTotalWins(scores.filter((s) => s.score > 0).length);
      setHighScore(scores.length > 0 ? Math.max(0, ...scores.map((s) => s.score)) : 0);
      setBestCombo(scores.length > 0 ? Math.max(0, ...scores.map((s) => s.maxCombo || 0)) : 0);

      const gameEarnings = scores.reduce((sum, s) => sum + (s.earnedCoins || 0), 0);
      setTotalEarned(gameEarnings + dailyEarnings + achievementEarnings);
      setTotalSpent(spent);

      // Zorluk bazında istatistikler
      const byDifficulty: Record<string, ScoreRecord[]> = {};
      for (const s of scores) {
        if (!byDifficulty[s.difficulty]) byDifficulty[s.difficulty] = [];
        byDifficulty[s.difficulty].push(s);
      }

      const stats: Record<string, DifficultyStats> = {};
      for (const [diff, records] of Object.entries(byDifficulty)) {
        if (records.length === 0) continue;
        const wins = records.filter((r) => r.score > 0).length;
        const avgScore = Math.round(records.reduce((sum, r) => sum + r.score, 0) / records.length);
        const best = Math.max(0, ...records.map((r) => r.score));
        const combo = Math.max(0, ...records.map((r) => r.maxCombo || 0));
        stats[diff] = { games: records.length, wins, avgScore, bestScore: best, bestCombo: combo };
      }
      setDiffStats(stats);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <LinearGradient colors={['#0f0c29', '#302b63', '#24243e']} style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00d4ff" />
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </LinearGradient>
    );
  }

  const winRate = totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0;

  return (
    <LinearGradient colors={['#0f0c29', '#302b63', '#24243e']} style={styles.container}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 10 }]} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{t('stats.title')}</Text>

        {/* Genel İstatistikler */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('stats.general')}</Text>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>{t('stats.totalGames')}</Text>
            <Text style={styles.statValue}>{totalGames}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>{t('stats.wins')}</Text>
            <Text style={styles.statValueGreen}>{totalWins}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>{t('stats.winRate')}</Text>
            <Text style={styles.statValueCyan}>{winRate}%</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>{t('stats.highScore')}</Text>
            <Text style={styles.statValueGold}>{highScore}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>{t('stats.bestCombo')}</Text>
            <Text style={styles.statValueGold}>{bestCombo}x</Text>
          </View>
        </View>

        {/* Ekonomi */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('stats.economy')}</Text>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>{t('stats.totalEarned')}</Text>
            <Text style={styles.statValueGreen}>{totalEarned}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>{t('stats.totalSpent')}</Text>
            <Text style={styles.statValueRed}>{totalSpent}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>{t('stats.currentBalance')}</Text>
            <Text style={styles.statValueGold}>{Math.max(0, totalEarned - totalSpent)}</Text>
          </View>
        </View>

        {/* Zorluk Bazında */}
        {Object.entries(diffStats).map(([diff, stats]) => (
          <View key={diff} style={styles.card}>
            <Text style={styles.cardTitle}>{diff}</Text>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>{t('stats.games')}</Text>
              <Text style={styles.statValue}>{stats.games}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>{t('stats.winning')}</Text>
              <Text style={styles.statValueGreen}>
                {stats.games > 0 ? Math.round((stats.wins / stats.games) * 100) : 0}%
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>{t('stats.avgScore')}</Text>
              <Text style={styles.statValue}>{stats.avgScore}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>{t('stats.bestScore')}</Text>
              <Text style={styles.statValueGold}>{stats.bestScore}</Text>
            </View>
          </View>
        ))}

        {totalGames === 0 && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>{t('stats.empty')}</Text>
            <Text style={styles.emptySubText}>{t('stats.emptyDesc')}</Text>
          </View>
        )}

        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>{t('common.back')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 4,
    marginBottom: 25,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 18,
    width: '100%',
    maxWidth: 340,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 13,
    color: '#00d4ff',
    letterSpacing: 2,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 7,
  },
  statLabel: {
    fontSize: 13,
    color: '#a0a0b0',
    letterSpacing: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  statValueGold: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffc107',
  },
  statValueGreen: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00c864',
  },
  statValueCyan: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00d4ff',
  },
  statValueRed: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e94560',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  emptyCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 30,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 15,
  },
  emptyText: {
    fontSize: 16,
    color: '#a0a0b0',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 13,
    color: 'rgba(160,160,176,0.6)',
    textAlign: 'center',
  },
  backButton: {
    marginTop: 10,
    paddingVertical: 12,
  },
  backButtonText: {
    color: '#a0a0b0',
    fontSize: 16,
    letterSpacing: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#a0a0b0',
    fontSize: 14,
    marginTop: 12,
    letterSpacing: 1,
  },
});

export default StatsScreen;
