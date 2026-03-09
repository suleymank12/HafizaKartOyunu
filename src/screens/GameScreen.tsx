import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Card, { ALL_ICON_NAMES } from '../components/Card';
import { checkGameAchievements } from '../utils/achievements';
import { getScores, saveScore } from '../utils/gameLogic';
import {
  CardThemeColors, DEFAULT_BG_GRADIENT, DEFAULT_CARD_COLORS,
  getActiveBgTheme, getActiveCardTheme, getConsumables, useConsumable,
} from '../utils/market';
import {
  hapticCombo, hapticFlip, hapticMatch, hapticMismatch, hapticTimeUp,
  loadSettings, playComboSound, playFlipSound, playMatchSound, playMismatchSound,
  playTimeUpSound, playWinSound, saveSettings,
} from '../utils/sound';
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
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hapticEnabled, setHapticEnabled] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const comboAnim = useRef(new Animated.Value(0)).current;

  // Tema state'leri
  const [cardThemeColors, setCardThemeColors] = useState<CardThemeColors>(DEFAULT_CARD_COLORS);
  const [bgGradient, setBgGradient] = useState<[string, string, string]>(DEFAULT_BG_GRADIENT);

  // Consumable state'leri
  const [extraTimeAvailable, setExtraTimeAvailable] = useState(0);
  const [jokerAvailable, setJokerAvailable] = useState(0);
  const [useExtraTime, setUseExtraTime] = useState(false);
  const [useJokerFlag, setUseJokerFlag] = useState(false);
  const [jokerActive, setJokerActive] = useState(false);
  const [bonusTime, setBonusTime] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);

  // Ayarları ve temaları yükle
  useEffect(() => {
    loadSettings().then((s) => {
      setSoundEnabled(s.soundEnabled);
      setHapticEnabled(s.hapticEnabled);
    });
    getActiveCardTheme().then(setCardThemeColors);
    getActiveBgTheme().then(setBgGradient);
    loadConsumables();
  }, []);

  const loadConsumables = async () => {
    const cons = await getConsumables();
    setExtraTimeAvailable(cons['extra_time'] || 0);
    setJokerAvailable(cons['joker'] || 0);
  };

  // Geri sayım
  useEffect(() => {
    if (gameStarted && !gameOver && !isPaused && !jokerActive) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            playTimeUpSound();
            hapticTimeUp();
            const earnedCoins = Math.floor(score / 10);
            saveScore({
              score,
              moves,
              time: formatTime(difficulty ? difficulty.time + bonusTime : 0),
              difficulty: difficulty ? difficulty.name : '',
              date: new Date().toLocaleDateString('tr-TR'),
              earnedCoins,
            }).then(async () => {
              const scores = await getScores();
              const totalWins = scores.filter((s) => s.score > 0).length;
              await checkGameAchievements(scores.length, maxCombo, totalWins);
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
  }, [gameStarted, gameOver, isPaused, jokerActive]);

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

  const startGame = async (diff: Difficulty) => {
    let totalTime = diff.time;
    let usedBonus = 0;

    // Ekstra süre kullan
    if (useExtraTime) {
      totalTime += 30;
      usedBonus = 30;
      await useConsumable('extra_time');
      setExtraTimeAvailable((prev) => Math.max(0, prev - 1));
    }

    setBonusTime(usedBonus);

    const newCards = shuffleCards(diff.pairs);
    setDifficulty(diff);
    setCards(newCards);
    setTimeLeft(totalTime);
    setScore(0);
    setMoves(0);
    setCombo(0);
    setGameStarted(false);
    setGameOver(false);
    setGameWon(false);
    setIsPaused(false);

    // Joker kullan
    if (useJokerFlag) {
      await useConsumable('joker');
      setJokerAvailable((prev) => Math.max(0, prev - 1));
      setJokerActive(true);

      // Tüm kartları aç
      setCards(newCards.map((c) => ({ ...c, isFlipped: true })));
      setDisabled(true);

      // 2 saniye sonra kapat
      setTimeout(() => {
        setCards(newCards.map((c) => ({ ...c, isFlipped: false })));
        setDisabled(false);
        setJokerActive(false);
        setGameStarted(true);
      }, 2000);

      setUseJokerFlag(false);
    }

    setUseExtraTime(false);
  };

  const handleCardPress = (id: number) => {
    if (disabled || gameOver || isPaused || jokerActive) return;
    const card = cards.find((c) => c.id === id);
    if (!card || card.isFlipped || card.isMatched) return;

    if (!gameStarted) setGameStarted(true);

    playFlipSound();
    hapticFlip();

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
      if (newCombo > maxCombo) setMaxCombo(newCombo);
      setScore((prev) => prev + 50 * newCombo);

      playMatchSound();
      hapticMatch();
      if (newCombo > 1) {
        playComboSound(newCombo);
        hapticCombo();
      }

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
      playMismatchSound();
      hapticMismatch();
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

  // Tüm kartlar eşleşti mi
  useEffect(() => {
    if (cards.length > 0 && cards.every((c) => c.isMatched)) {
      if (timerRef.current) clearInterval(timerRef.current);
      playWinSound();
      const totalTime = difficulty ? difficulty.time + bonusTime : 0;
      const elapsed = totalTime - timeLeft;
      const earnedCoins = Math.floor(score / 10);
      saveScore({
        score,
        moves,
        time: formatTime(elapsed),
        difficulty: difficulty ? difficulty.name : '',
        date: new Date().toLocaleDateString('tr-TR'),
        earnedCoins,
      }).then(async () => {
        const scores = await getScores();
        const totalWins = scores.filter((s) => s.score > 0).length;
        await checkGameAchievements(scores.length, maxCombo, totalWins);
      });
      setTimeout(() => {
        setGameOver(true);
        setGameWon(true);
      }, 500);
    }
  }, [cards]);

  const handleHome = () => {
    onHome();
  };

  const togglePause = () => {
    setIsPaused((prev) => !prev);
  };

  const toggleSound = () => {
    const newVal = !soundEnabled;
    setSoundEnabled(newVal);
    saveSettings({ soundEnabled: newVal, hapticEnabled });
  };

  const toggleHaptic = () => {
    const newVal = !hapticEnabled;
    setHapticEnabled(newVal);
    saveSettings({ soundEnabled, hapticEnabled: newVal });
  };

  const goToDifficultySelect = () => {
    setDifficulty(null);
    setUseExtraTime(false);
    setUseJokerFlag(false);
    setBonusTime(0);
    loadConsumables();
  };

  // Zorluk seçimi
  if (!difficulty) {
    return (
      <LinearGradient colors={bgGradient} style={styles.diffContainer}>
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

          {/* Consumable toggle'ları */}
          {(extraTimeAvailable > 0 || jokerAvailable > 0) && (
            <View style={styles.consumableSection}>
              <Text style={styles.consumableTitle}>BONUS KULLAN</Text>

              {extraTimeAvailable > 0 && (
                <TouchableOpacity
                  style={[styles.consumableToggle, useExtraTime && styles.consumableToggleActive]}
                  onPress={() => setUseExtraTime((prev) => !prev)}
                >
                  <Text style={[styles.consumableText, useExtraTime && styles.consumableTextActive]}>
                    +30 SN  (x{extraTimeAvailable})
                  </Text>
                </TouchableOpacity>
              )}

              {jokerAvailable > 0 && (
                <TouchableOpacity
                  style={[styles.consumableToggle, useJokerFlag && styles.consumableToggleActive]}
                  onPress={() => setUseJokerFlag((prev) => !prev)}
                >
                  <Text style={[styles.consumableText, useJokerFlag && styles.consumableTextActive]}>
                    JOKER  (x{jokerAvailable})
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <TouchableOpacity style={styles.backButton} onPress={onHome}>
            <Text style={styles.backButtonText}>GERİ DÖN</Text>
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>
    );
  }

  // Skor ekranı
  if (gameOver) {
    return (
      <ScoreScreen
        score={score}
        moves={moves}
        time={formatTime(difficulty.time + bonusTime - timeLeft)}
        difficulty={difficulty.name}
        won={gameWon}
        earnedCoins={Math.floor(score / 10)}
        onNewGame={goToDifficultySelect}
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
    <LinearGradient colors={bgGradient} style={styles.container}>

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
              themeColors={cardThemeColors}
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
            <Text style={styles.statLabel}>SÜRE</Text>
            <Text style={[styles.statValue, timeLeft <= 10 && styles.statValueDanger]}>
              {formatTime(timeLeft)}
            </Text>
          </View>
        </View>
      </View>

      {/* Joker aktif göstergesi */}
      {jokerActive && (
        <View style={styles.jokerBanner}>
          <Text style={styles.jokerBannerText}>JOKER AKTIF - KARTLARI EZBERLE!</Text>
        </View>
      )}

      {/* Pause butonu */}
      {gameStarted && !jokerActive && (
        <TouchableOpacity style={styles.pauseButton} onPress={togglePause}>
          <Text style={styles.pauseButtonText}>| |</Text>
        </TouchableOpacity>
      )}

      {/* Pause overlay */}
      {isPaused && (
        <View style={styles.pauseOverlay}>
          <View style={styles.pauseCard}>
            <Text style={styles.pauseTitle}>DURAKLATILDI</Text>

            {/* Ayarlar */}
            <View style={styles.settingsRow}>
              <TouchableOpacity
                style={[styles.settingToggle, soundEnabled && styles.settingToggleActive]}
                onPress={toggleSound}
              >
                <Text style={[styles.settingIcon, soundEnabled && styles.settingIconActive]}>
                  {soundEnabled ? '🔊' : '🔇'}
                </Text>
                <Text style={[styles.settingLabel, soundEnabled && styles.settingLabelActive]}>
                  SES
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.settingToggle, hapticEnabled && styles.settingToggleActive]}
                onPress={toggleHaptic}
              >
                <Text style={[styles.settingIcon, hapticEnabled && styles.settingIconActive]}>
                  {hapticEnabled ? '📳' : '📴'}
                </Text>
                <Text style={[styles.settingLabel, hapticEnabled && styles.settingLabelActive]}>
                  TİTREŞİM
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.pauseResumeButton} onPress={togglePause}>
              <LinearGradient
                colors={['#00c864', '#00a050']}
                style={styles.pauseResumeGradient}
              >
                <Text style={styles.pauseResumeText}>DEVAM ET</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.pauseRestartButton} onPress={goToDifficultySelect}>
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
  comboText: {
    position: 'absolute',
    top: 115,
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffc107',
    letterSpacing: 2,
  },
  statsBarWrapper: {
    position: 'absolute',
    top: 50,
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
    paddingTop: 30,
  },
  board: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  jokerBanner: {
    position: 'absolute',
    top: 115,
    backgroundColor: 'rgba(255,199,7,0.2)',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,199,7,0.4)',
  },
  jokerBannerText: {
    color: '#ffc107',
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  pauseButton: {
    position: 'absolute',
    top: 120,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
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
    marginBottom: 20,
  },
  settingsRow: {
    flexDirection: 'row',
    marginBottom: 25,
    gap: 15,
  },
  settingToggle: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    minWidth: 100,
  },
  settingToggleActive: {
    backgroundColor: 'rgba(0,200,100,0.15)',
    borderColor: 'rgba(0,200,100,0.4)',
  },
  settingIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  settingIconActive: {
  },
  settingLabel: {
    fontSize: 11,
    color: '#666',
    letterSpacing: 1,
    fontWeight: 'bold',
  },
  settingLabelActive: {
    color: '#00c864',
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
  consumableSection: {
    marginTop: 20,
    alignItems: 'center',
    width: 250,
  },
  consumableTitle: {
    fontSize: 12,
    color: '#a0a0b0',
    letterSpacing: 2,
    marginBottom: 10,
  },
  consumableToggle: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginBottom: 8,
    width: 200,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  consumableToggleActive: {
    backgroundColor: 'rgba(255,199,7,0.15)',
    borderColor: 'rgba(255,199,7,0.4)',
  },
  consumableText: {
    color: '#a0a0b0',
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  consumableTextActive: {
    color: '#ffc107',
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
