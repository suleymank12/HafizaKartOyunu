import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Card, { ALL_ICON_NAMES } from '../components/Card';
import { saveScore } from '../utils/gameLogic';
import ScoreScreen from './ScoreScreen';

type Difficulty = {
  name: string;
  pairs: number;
  time: number;
  cols: number;
};

const DIFFICULTIES: Record<string, Difficulty> = {
  easy: { name: 'KOLAY', pairs: 6, time: 60, cols: 3 },
  medium: { name: 'ORTA', pairs: 8, time: 90, cols: 4 },
  hard: { name: 'ZOR', pairs: 10, time: 120, cols: 4 },
};

const shuffleCards = (pairCount: number) => {
  const shuffled = [...ALL_ICON_NAMES].sort(() => Math.random() - 0.5);
  const symbols = shuffled.slice(0, pairCount);
  const pairs = [...symbols, ...symbols];
  return pairs
    .sort(() => Math.random() - 0.5)
    .map((symbol, index) => ({
      id: index,
      symbol,
      isFlipped: false,
      isMatched: false,
    }));
};

const formatTime = (seconds: number) => {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${min}:${sec < 10 ? '0' : ''}${sec}`;
};

type GameScreenProps = {
  onHome: () => void;
};

const GameScreen = ({ onHome }: GameScreenProps) => {
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [cards, setCards] = useState<any[]>([]);
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(0);
  const [combo, setCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [firstCard, setFirstCard] = useState<number | null>(null);
  const [secondCard, setSecondCard] = useState<number | null>(null);
  const [disabled, setDisabled] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const comboAnim = useRef(new Animated.Value(0)).current;

  // Geri sayim
  useEffect(() => {
    if (gameStarted && !gameOver && !isPaused) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            saveScore({
              score,
              moves,
              time: formatTime(difficulty ? difficulty.time : 0),
              difficulty: difficulty ? difficulty.name : '',
              date: new Date().toLocaleDateString('tr-TR'),
            });
            setGameOver(true);
            setGameWon(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameStarted, gameOver, isPaused]);

  // Combo animasyonu
  useEffect(() => {
    if (combo > 1) {
      comboAnim.setValue(0);
      Animated.sequence([
        Animated.timing(comboAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(comboAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [combo]);

  const startGame = (diff: Difficulty) => {
    setDifficulty(diff);
    setCards(shuffleCards(diff.pairs));
    setTimeLeft(diff.time);
    setScore(0);
    setMoves(0);
    setCombo(0);
    setGameStarted(false);
    setGameOver(false);
    setGameWon(false);
    setIsPaused(false);
  };

  const handleCardPress = (id: number) => {
    if (disabled || gameOver || isPaused) return;
    const card = cards.find((c) => c.id === id);
    if (!card || card.isFlipped || card.isMatched) return;

    if (!gameStarted) setGameStarted(true);

    setCards((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isFlipped: true } : c))
    );

    if (firstCard === null) {
      setFirstCard(id);
    } else {
      setSecondCard(id);
      setDisabled(true);
      setMoves((prev) => prev + 1);
    }
  };

  useEffect(() => {
    if (firstCard === null || secondCard === null) return;

    const first = cards.find((c) => c.id === firstCard);
    const second = cards.find((c) => c.id === secondCard);

    if (first && second && first.symbol === second.symbol) {
      const newCombo = combo + 1;
      setCombo(newCombo);
      setScore((prev) => prev + 100 * newCombo);
      setCards((prev) =>
        prev.map((c) =>
          c.id === firstCard || c.id === secondCard
            ? { ...c, isMatched: true }
            : c
        )
      );
      setFirstCard(null);
      setSecondCard(null);
      setDisabled(false);
    } else {
      setCombo(0);
      setTimeout(() => {
        setCards((prev) =>
          prev.map((c) =>
            c.id === firstCard || c.id === secondCard
              ? { ...c, isFlipped: false }
              : c
          )
        );
        setFirstCard(null);
        setSecondCard(null);
        setDisabled(false);
      }, 1000);
    }
  }, [secondCard]);

  // Tum kartlar eslesti mi
  useEffect(() => {
    if (cards.length > 0 && cards.every((c) => c.isMatched)) {
      if (timerRef.current) clearInterval(timerRef.current);
      const elapsed = difficulty ? difficulty.time - timeLeft : 0;
      saveScore({
        score,
        moves,
        time: formatTime(elapsed),
        difficulty: difficulty ? difficulty.name : '',
        date: new Date().toLocaleDateString('tr-TR'),
      });
      setTimeout(() => {
        setGameOver(true);
        setGameWon(true);
      }, 500);
    }
  }, [cards]);

  const handleNewGame = () => {
    if (difficulty) startGame(difficulty);
  };

  const handleHome = () => {
    onHome();
  };

  const togglePause = () => {
    setIsPaused((prev) => !prev);
  };

  // Zorluk secimi
  if (!difficulty) {
    return (
      <LinearGradient colors={['#0f0c29', '#302b63', '#24243e']} style={styles.diffContainer}>
        <ScrollView contentContainerStyle={styles.diffContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.diffTitle}>ZORLUK SEVİYESİ</Text>
          <Text style={styles.diffDesc}>Bir zorluk seviyesi seç</Text>

          <TouchableOpacity style={styles.diffButton} onPress={() => startGame(DIFFICULTIES.easy)}>
            <LinearGradient colors={['#00c864', '#00a050']} style={styles.diffButtonGradient}>
              <Text style={styles.diffButtonText}>KOLAY</Text>
              <Text style={styles.diffButtonInfo}>6 çift  •  60 saniye</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.diffButton} onPress={() => startGame(DIFFICULTIES.medium)}>
            <LinearGradient colors={['#ffc107', '#e6a800']} style={styles.diffButtonGradient}>
              <Text style={styles.diffButtonText}>ORTA</Text>
              <Text style={styles.diffButtonInfo}>8 çift  •  90 saniye</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.diffButton} onPress={() => startGame(DIFFICULTIES.hard)}>
            <LinearGradient colors={['#e94560', '#c81d4e']} style={styles.diffButtonGradient}>
              <Text style={styles.diffButtonText}>ZOR</Text>
              <Text style={styles.diffButtonInfo}>10 çift  •  120 saniye</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.backButton} onPress={onHome}>
            <Text style={styles.backButtonText}>GERİ DÖN</Text>
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>
    );
  }

  // Skor ekrani
  if (gameOver) {
    return (
      <ScoreScreen
        score={score}
        moves={moves}
        time={formatTime(difficulty.time - timeLeft)}
        difficulty={difficulty.name}
        won={gameWon}
        onNewGame={() => setDifficulty(null)}
        onHome={handleHome}
      />
    );
  }

  const comboScale = comboAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1.2],
  });

  const comboOpacity = comboAnim.interpolate({
    inputRange: [0, 0.2, 1],
    outputRange: [0, 1, 0],
  });

  return (
    <LinearGradient colors={['#0f0c29', '#302b63', '#24243e']} style={styles.container}>

      <Text style={styles.title}>HAFIZA KARTI OYUNU</Text>

      {combo > 1 && (
        <Animated.Text
          style={[
            styles.comboText,
            {
              opacity: comboOpacity,
              transform: [{ scale: comboScale }],
            },
          ]}
        >
          x{combo} COMBO!
        </Animated.Text>
      )}

      <View style={styles.boardContainer}>
        <View style={[styles.board, { width: difficulty.cols === 3 ? 260 : 340 }]}>
          {cards.map((card) => (
            <Card
              key={card.id}
              symbol={card.symbol}
              isFlipped={card.isFlipped}
              isMatched={card.isMatched}
              onPress={() => handleCardPress(card.id)}
            />
          ))}
        </View>
      </View>

      <View style={styles.statsBarWrapper}>
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>SKOR</Text>
            <Text style={styles.statValueGold}>{score}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>HAMLE</Text>
            <Text style={styles.statValue}>{moves}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>SURE</Text>
            <Text style={[styles.statValue, timeLeft <= 10 && styles.statValueDanger]}>
              {formatTime(timeLeft)}
            </Text>
          </View>
        </View>
      </View>

      {/* Pause butonu */}
      {gameStarted && (
        <TouchableOpacity style={styles.pauseButton} onPress={togglePause}>
          <Text style={styles.pauseButtonText}>| |</Text>
        </TouchableOpacity>
      )}

      {/* Pause overlay */}
      {isPaused && (
        <View style={styles.pauseOverlay}>
          <View style={styles.pauseCard}>
            <Text style={styles.pauseTitle}>DURAKLATILDI</Text>

            <TouchableOpacity style={styles.pauseResumeButton} onPress={togglePause}>
              <LinearGradient
                colors={['#00c864', '#00a050']}
                style={styles.pauseResumeGradient}
              >
                <Text style={styles.pauseResumeText}>DEVAM ET</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.pauseRestartButton} onPress={() => setDifficulty(null)}>
              <Text style={styles.pauseRestartText}>YENİ OYUN</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.pauseHomeButton} onPress={onHome}>
              <Text style={styles.pauseHomeText}>ANA SAYFA</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
    alignItems: 'center',
  },
  title: {
    fontSize: 25,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 4,
    textAlign: 'center',
  },
  comboText: {
    position: 'absolute',
    top: 95,
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffc107',
    letterSpacing: 2,
  },
  statsBarWrapper: {
    position: 'absolute',
    top: 130,
    left: 0,
    right: 0,
    alignItems: 'center',
    pointerEvents: 'none',
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    width: 320,
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 10,
    color: '#a0a0b0',
    letterSpacing: 1,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  statValueGold: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffc107',
  },
  statValueDanger: {
    color: '#e94560',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  boardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 70,
  },
  board: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  pauseButton: {
    position: 'absolute',
    top: 215,
    right: 50,
    width: 50,
    height: 50,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  pauseButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  pauseOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15,12,41,1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pauseCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    width: 320,
  },
  pauseTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 3,
    marginBottom: 30,
  },
  pauseResumeButton: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 15,
    width: 200,
  },
  pauseResumeGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  pauseResumeText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 3,
  },
  pauseRestartButton: {
    paddingVertical: 12,
    marginBottom: 5,
  },
  pauseRestartText: {
    color: '#a0a0b0',
    fontSize: 15,
    letterSpacing: 2,
  },
  pauseHomeButton: {
    paddingVertical: 12,
  },
  pauseHomeText: {
    color: '#a0a0b0',
    fontSize: 15,
    letterSpacing: 2,
  },
  diffContainer: {
    flex: 1,
    paddingHorizontal: 30,
  },
  diffContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  diffTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 4,
    marginBottom: 10,
  },
  diffDesc: {
    fontSize: 14,
    color: '#a0a0b0',
    marginBottom: 25,
  },
  diffButton: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 12,
    width: 250,
  },
  diffButtonGradient: {
    paddingVertical: 15,
    alignItems: 'center',
  },
  diffButtonText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 3,
  },
  diffButtonInfo: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginTop: 4,
  },
  backButton: {
    marginTop: 15,
    paddingVertical: 10,
  },
  backButtonText: {
    color: '#a0a0b0',
    fontSize: 16,
    letterSpacing: 2,
  },
});

export default GameScreen;