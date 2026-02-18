import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getScores, ScoreRecord } from '../utils/gameLogic';

type ScoreScreenProps = {
  score: number;
  moves: number;
  time: string;
  difficulty: string;
  won: boolean;
  onNewGame: () => void;
  onHome: () => void;
};

const ScoreScreen = ({ score, moves, time, difficulty, won, onNewGame, onHome }: ScoreScreenProps) => {
  const [pastScores, setPastScores] = useState<ScoreRecord[]>([]);
  const [totalScore, setTotalScore] = useState(0);

  useEffect(() => {
    const loadScores = async () => {
      const scores = await getScores();
      setPastScores(scores);
      const total = scores.reduce((sum, s) => sum + s.score, 0);
      setTotalScore(total);
    };
    loadScores();
  }, []);

  return (
    <LinearGradient colors={['#0f0c29', '#302b63', '#24243e']} style={styles.container}>

      <Text style={styles.title}>{won ? 'TEBRİKLER!' : 'SÜRE DOLDU!'}</Text>

      <View style={styles.statsCard}>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>SKOR</Text>
          <Text style={styles.statValueGold}>{score}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>HAMLE</Text>
          <Text style={styles.statValue}>{moves}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>SÜRE</Text>
          <Text style={styles.statValue}>{time}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>ZORLUK</Text>
          <Text style={styles.statValue}>{difficulty}</Text>
        </View>
      </View>

      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>TOPLAM PUAN</Text>
        <Text style={styles.totalValue}>{totalScore}</Text>
      </View>

      {pastScores.length > 0 && (
        <View style={styles.historyCard}>
          <Text style={styles.historyTitle}>GECMİŞ SKORLAR</Text>
          <FlatList
            data={pastScores}
            keyExtractor={(_, i) => i.toString()}
            showsVerticalScrollIndicator={false}
            renderItem={({ item, index }) => (
              <View style={styles.historyRow}>
                <Text style={styles.historyRank}>#{index + 1}</Text>
                <Text style={styles.historyScore}>{item.score}</Text>
                <Text style={styles.historyDiff}>{item.difficulty}</Text>
                <Text style={styles.historyTime}>{item.time}</Text>
              </View>
            )}
          />
        </View>
      )}

      <TouchableOpacity style={styles.newGameButton} onPress={onNewGame}>
        <LinearGradient
          colors={['#00c864', '#00a050']}
          style={styles.buttonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Text style={styles.buttonText}>YENİ OYUN</Text>
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity style={styles.homeButton} onPress={onHome}>
        <Text style={styles.homeButtonText}>ANA SAYFA</Text>
      </TouchableOpacity>

    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingTop: 50,
  },
  title: {
    fontSize: 30,
    fontWeight: '900',
    color: '#ffc107',
    letterSpacing: 4,
    marginBottom: 20,
  },
  statsCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 18,
    width: 280,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  statValueGold: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffc107',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  totalCard: {
    backgroundColor: 'rgba(255,199,7,0.1)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 20,
    width: 280,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,199,7,0.25)',
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 13,
    color: '#ffc107',
    letterSpacing: 1,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffc107',
  },
  historyCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    padding: 15,
    width: 280,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 15,
    flex: 1,
  },
  historyTitle: {
    fontSize: 12,
    color: '#a0a0b0',
    letterSpacing: 1,
    marginBottom: 10,
    textAlign: 'center',
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  historyRank: {
    fontSize: 14,
    color: '#a0a0b0',
    width: 30,
  },
  historyScore: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffc107',
    width: 70,
  },
  historyDiff: {
    fontSize: 12,
    color: '#a0a0b0',
    width: 50,
  },
  historyTime: {
    fontSize: 14,
    color: '#ffffff',
    width: 50,
    textAlign: 'right',
  },
  newGameButton: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 12,
  },
  buttonGradient: {
    paddingHorizontal: 50,
    paddingVertical: 16,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 3,
  },
  homeButton: {
    paddingHorizontal: 50,
    paddingVertical: 10,
    marginBottom: 20,
  },
  homeButtonText: {
    color: '#a0a0b0',
    fontSize: 16,
    letterSpacing: 2,
  },
});

export default ScoreScreen;