import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, BackHandler, Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Reanimated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Card, { ALL_ICON_NAMES } from '../components/Card';
import { checkGameAchievements } from '../utils/achievements';
import {
  EXTRA_TIME_BONUS, JOKER_PREVIEW_MS, MATCH_BASE_SCORE,
  MISMATCH_DELAY_MS, WIN_DELAY_MS, COINS_PER_SCORE,
} from '../utils/constants';
import { getScores, saveScore } from '../utils/gameLogic';
import {
  CardThemeColors,
  consumeItem,
  DEFAULT_BG_GRADIENT, DEFAULT_CARD_COLORS,
  getActiveBgTheme, getActiveCardTheme, getConsumables,
} from '../utils/market';
import {
  hapticCombo, hapticFlip, hapticMatch, hapticMismatch, hapticTimeUp,
  loadSettings, playComboSound, playFlipSound, playMatchSound, playMismatchSound,
  playTimeUpSound, playWinSound, saveSettings,
} from '../utils/sound';
import { t } from '../utils/i18n';
import ScoreScreen from './ScoreScreen';

type Difficulty = {
  id: string;
  name: string;
  pairs: number;
  time: number;
  cols: number;
};

type CardData = {
  id: number;
  symbol: string;
  isFlipped: boolean;
  isMatched: boolean;
};

const getDifficulties = (): Record<string, Difficulty> => ({
  easy: { id: 'easy', name: t('diff.easy'), pairs: 6, time: 60, cols: 3 },
  medium: { id: 'medium', name: t('diff.medium'), pairs: 8, time: 90, cols: 4 },
  hard: { id: 'hard', name: t('diff.hard'), pairs: 10, time: 120, cols: 4 },
});

const fisherYatesShuffle = <T,>(array: T[]): T[] => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const shuffleCards = (pairCount: number): CardData[] => {
  const shuffled = fisherYatesShuffle(ALL_ICON_NAMES);
  const symbols = shuffled.slice(0, pairCount);
  const pairs = fisherYatesShuffle([...symbols, ...symbols]);
  return pairs.map((symbol, index) => ({
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

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const GameScreen = ({ onHome }: GameScreenProps) => {
  const insets = useSafeAreaInsets();
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [cards, setCards] = useState<CardData[]>([]);
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
  const isMountedRef = useRef(true);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const disabledRef = useRef(false);

  // Refs to avoid stale closures in useEffect callbacks
  const scoreRef = useRef(score);
  const movesRef = useRef(moves);
  const comboRef = useRef(combo);
  const maxComboRef = useRef(0);
  const difficultyRef = useRef(difficulty);
  const bonusTimeRef = useRef(0);
  const timeLeftRef = useRef(timeLeft);
  const firstCardRef = useRef(firstCard);

  // Keep refs in sync with state
  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { movesRef.current = moves; }, [moves]);
  useEffect(() => { comboRef.current = combo; }, [combo]);
  useEffect(() => { difficultyRef.current = difficulty; }, [difficulty]);
  useEffect(() => { timeLeftRef.current = timeLeft; }, [timeLeft]);
  useEffect(() => { firstCardRef.current = firstCard; }, [firstCard]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
      timeoutsRef.current.forEach(clearTimeout);
    };
  }, []);

  // Tema state'leri
  const [cardThemeColors, setCardThemeColors] = useState<CardThemeColors>(DEFAULT_CARD_COLORS);
  const [bgGradient, setBgGradient] = useState<[string, string, string]>(DEFAULT_BG_GRADIENT);

  // Consumable state'leri
  const [extraTimeAvailable, setExtraTimeAvailable] = useState(0);
  const [jokerAvailable, setJokerAvailable] = useState(0);
  const [useExtraTime, setUseExtraTime] = useState(false);
  const [useJokerFlag, setUseJokerFlag] = useState(false);
  const [jokerActive, setJokerActive] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);

  // Timer pulse animation (son 10 saniye)
  const timerPulseScale = useSharedValue(1);

  useEffect(() => {
    if (timeLeft <= 10 && timeLeft > 0 && gameStarted && !gameOver && !isPaused) {
      timerPulseScale.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 400 }),
          withTiming(1, { duration: 400 }),
        ),
        -1, // sonsuz tekrar
      );
    } else {
      cancelAnimation(timerPulseScale);
      timerPulseScale.value = withTiming(1, { duration: 100 });
    }
  }, [timeLeft <= 10, gameStarted, gameOver, isPaused]);

  const timerPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: timerPulseScale.value }],
  }));

  // Android geri tuşu yönetimi
  useEffect(() => {
    const backAction = () => {
      if (gameOver) {
        onHome();
        return true;
      }
      if (showExitModal) {
        setShowExitModal(false);
        setIsPaused(false);
        return true;
      }
      if (isPaused) {
        setIsPaused(false);
        return true;
      }
      if (gameStarted && !gameOver) {
        setIsPaused(true);
        setShowExitModal(true);
        return true;
      }
      // Difficulty selection screen - let parent handle
      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [gameStarted, gameOver, isPaused, showExitModal]);

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
            const currentScore = scoreRef.current;
            const currentMoves = movesRef.current;
            const currentMaxCombo = maxComboRef.current;
            const diff = difficultyRef.current;
            const bonus = bonusTimeRef.current;
            const earnedCoins = Math.floor(currentScore / COINS_PER_SCORE);
            saveScore({
              score: currentScore,
              moves: currentMoves,
              time: formatTime(diff ? diff.time + bonus : 0),
              difficulty: diff ? diff.id : '',
              date: new Date().toLocaleDateString('tr-TR'),
              earnedCoins,
              maxCombo: currentMaxCombo,
            }).then(async () => {
              const scores = await getScores();
              const totalWins = scores.filter((s) => s.score > 0).length;
              await checkGameAchievements(scores.length, currentMaxCombo, totalWins);
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
      totalTime += EXTRA_TIME_BONUS;
      usedBonus = EXTRA_TIME_BONUS;
      await consumeItem('extra_time');
      setExtraTimeAvailable((prev) => Math.max(0, prev - 1));
    }

    bonusTimeRef.current = usedBonus;

    const newCards = shuffleCards(diff.pairs);
    setDifficulty(diff);
    setCards(newCards);
    setTimeLeft(totalTime);
    setScore(0);
    setMoves(0);
    setCombo(0);
    maxComboRef.current = 0;
    setGameStarted(false);
    setGameOver(false);
    setGameWon(false);
    setIsPaused(false);

    // Joker kullan
    if (useJokerFlag) {
      await consumeItem('joker');
      setJokerAvailable((prev) => Math.max(0, prev - 1));
      setJokerActive(true);

      // Tüm kartları aç
      setCards(newCards.map((c) => ({ ...c, isFlipped: true })));
      setDisabled(true);
      disabledRef.current = true;

      // JOKER_PREVIEW_MS sonra kapat
      const t = setTimeout(() => {
        if (!isMountedRef.current) return;
        setCards(newCards.map((c) => ({ ...c, isFlipped: false })));
        setDisabled(false);
        disabledRef.current = false;
        setJokerActive(false);
        setGameStarted(true);
      }, JOKER_PREVIEW_MS);
      timeoutsRef.current.push(t);

      setUseJokerFlag(false);
    }

    setUseExtraTime(false);
  };

  const handleCardPress = useCallback((id: number) => {
    if (disabledRef.current) return;
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
      disabledRef.current = true;
      setMoves((prev) => prev + 1);
    }
  }, [disabled, gameOver, isPaused, jokerActive, cards, gameStarted, firstCard]);

  useEffect(() => {
    const currentFirstCard = firstCardRef.current;
    if (currentFirstCard === null || secondCard === null) return;

    const first = cards.find((c) => c.id === currentFirstCard);
    const second = cards.find((c) => c.id === secondCard);

    if (first && second && first.symbol === second.symbol) {
      const currentCombo = comboRef.current;
      const newCombo = currentCombo + 1;
      setCombo(newCombo);
      if (newCombo > maxComboRef.current) {
        maxComboRef.current = newCombo;
      }
      setScore((prev) => prev + MATCH_BASE_SCORE * newCombo);

      playMatchSound();
      hapticMatch();
      if (newCombo > 1) {
        playComboSound(newCombo);
        hapticCombo();
      }

      setCards((prev) =>
        prev.map((c) =>
          c.id === currentFirstCard || c.id === secondCard
            ? { ...c, isMatched: true }
            : c
        )
      );
      setFirstCard(null);
      setSecondCard(null);
      setDisabled(false);
      disabledRef.current = false;
    } else {
      setCombo(0);
      playMismatchSound();
      hapticMismatch();
      const t = setTimeout(() => {
        if (!isMountedRef.current) return;
        setCards((prev) =>
          prev.map((c) =>
            c.id === currentFirstCard || c.id === secondCard
              ? { ...c, isFlipped: false }
              : c
          )
        );
        setFirstCard(null);
        setSecondCard(null);
        setDisabled(false);
        disabledRef.current = false;
      }, MISMATCH_DELAY_MS);
      timeoutsRef.current.push(t);
    }
  }, [secondCard]);

  // Tüm kartlar eşleşti mi
  useEffect(() => {
    if (cards.length > 0 && cards.every((c) => c.isMatched)) {
      if (timerRef.current) clearInterval(timerRef.current);
      playWinSound();
      const currentScore = scoreRef.current;
      const currentMoves = movesRef.current;
      const currentMaxCombo = maxComboRef.current;
      const diff = difficultyRef.current;
      const bonus = bonusTimeRef.current;
      const currentTimeLeft = timeLeftRef.current;
      const totalTime = diff ? diff.time + bonus : 0;
      const elapsed = totalTime - currentTimeLeft;
      const earnedCoins = Math.floor(currentScore / COINS_PER_SCORE);
      saveScore({
        score: currentScore,
        moves: currentMoves,
        time: formatTime(elapsed),
        difficulty: diff ? diff.id : '',
        date: new Date().toLocaleDateString('tr-TR'),
        earnedCoins,
        maxCombo: currentMaxCombo,
      }).then(async () => {
        const scores = await getScores();
        const totalWins = scores.filter((s) => s.score > 0).length;
        await checkGameAchievements(scores.length, currentMaxCombo, totalWins);
      });
      const t = setTimeout(() => {
        if (!isMountedRef.current) return;
        setGameOver(true);
        setGameWon(true);
      }, WIN_DELAY_MS);
      timeoutsRef.current.push(t);
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
    // Clear pending timeouts
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    setDifficulty(null);
    setUseExtraTime(false);
    setUseJokerFlag(false);
    bonusTimeRef.current = 0;
    maxComboRef.current = 0;
    disabledRef.current = false;
    loadConsumables();
  };

  // Zorluk seçimi
  if (!difficulty) {
    return (
      <LinearGradient colors={bgGradient} style={styles.diffContainer}>
        <ScrollView contentContainerStyle={[styles.diffContent, { paddingTop: insets.top + 10 }]} showsVerticalScrollIndicator={false}>
          <Text style={styles.diffTitle}>{t('game.difficulty')}</Text>
          <Text style={styles.diffDesc}>{t('game.chooseDifficulty')}</Text>

          <TouchableOpacity style={styles.diffButton} onPress={() => startGame(getDifficulties().easy)}>
            <LinearGradient colors={['#00c864', '#00a050']} style={styles.diffButtonGradient}>
              <Text style={styles.diffButtonText}>{t('diff.easy')}</Text>
              <Text style={styles.diffButtonInfo}>6 {t('game.pairs')}  •  60 {t('game.seconds')}</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.diffButton} onPress={() => startGame(getDifficulties().medium)}>
            <LinearGradient colors={['#ffc107', '#e6a800']} style={styles.diffButtonGradient}>
              <Text style={styles.diffButtonText}>{t('diff.medium')}</Text>
              <Text style={styles.diffButtonInfo}>8 {t('game.pairs')}  •  90 {t('game.seconds')}</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.diffButton} onPress={() => startGame(getDifficulties().hard)}>
            <LinearGradient colors={['#e94560', '#c81d4e']} style={styles.diffButtonGradient}>
              <Text style={styles.diffButtonText}>{t('diff.hard')}</Text>
              <Text style={styles.diffButtonInfo}>10 {t('game.pairs')}  •  120 {t('game.seconds')}</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Consumable toggle'ları */}
          {(extraTimeAvailable > 0 || jokerAvailable > 0) && (
            <View style={styles.consumableSection}>
              <Text style={styles.consumableTitle}>{t('game.useBonus')}</Text>

              {extraTimeAvailable > 0 && (
                <TouchableOpacity
                  style={[styles.consumableToggle, useExtraTime && styles.consumableToggleActive]}
                  onPress={() => setUseExtraTime((prev) => !prev)}
                >
                  <Text style={[styles.consumableText, useExtraTime && styles.consumableTextActive]}>
                    +{EXTRA_TIME_BONUS} SN  (x{extraTimeAvailable})
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
            <Text style={styles.backButtonText}>{t('game.back')}</Text>
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
        time={formatTime(difficulty.time + bonusTimeRef.current - timeLeft)}
        difficulty={difficulty.id}
        won={gameWon}
        earnedCoins={Math.floor(score / COINS_PER_SCORE)}
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
    <LinearGradient colors={bgGradient} style={[styles.container, { paddingTop: insets.top + 10 }]}>

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
          x{combo} {t('game.combo')}
        </Animated.Text>
      )}

      <View style={styles.statsBarWrapper}>
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>{t('game.score')}</Text>
            <Text style={styles.statValueGold}>{score}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>{t('game.moves')}</Text>
            <Text style={styles.statValue}>{moves}</Text>
          </View>
          <View style={styles.statDivider} />
          <Reanimated.View style={[styles.statItem, timerPulseStyle]}>
            <Text style={styles.statLabel}>{t('game.time')}</Text>
            <Text style={[styles.statValue, timeLeft <= 10 && styles.statValueDanger]}>
              {formatTime(timeLeft)}
            </Text>
          </Reanimated.View>
        </View>
      </View>

      {/* Pause butonu */}
      {gameStarted && !jokerActive && (
        <View style={styles.pauseButtonRow}>
          <TouchableOpacity style={styles.pauseButton} onPress={togglePause}>
            <Text style={styles.pauseButtonText}>| |</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Joker aktif göstergesi */}
      {jokerActive && (
        <View style={styles.jokerBanner}>
          <Text style={styles.jokerBannerText}>{t('game.jokerActive')}</Text>
        </View>
      )}

      <View style={styles.boardContainer}>
        <View style={[styles.board, { width: difficulty.cols === 3 ? Math.min(260, SCREEN_WIDTH - 40) : Math.min(340, SCREEN_WIDTH - 30) }]}>
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

      {/* Pause overlay */}
      {isPaused && (
        <View style={styles.pauseOverlay}>
          <View style={styles.pauseCard}>
            <Text style={styles.pauseTitle}>{t('game.paused')}</Text>

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
                  {t('game.sound')}
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
                  {t('game.haptic')}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.pauseResumeButton} onPress={togglePause}>
              <LinearGradient
                colors={['#00c864', '#00a050']}
                style={styles.pauseResumeGradient}
              >
                <Text style={styles.pauseResumeText}>{t('game.resume')}</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.pauseRestartButton} onPress={goToDifficultySelect}>
              <Text style={styles.pauseRestartText}>{t('game.newGame')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.pauseHomeButton} onPress={onHome}>
              <Text style={styles.pauseHomeText}>{t('game.home')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Çıkış onay modal */}
      {showExitModal && (
        <View style={styles.exitOverlay}>
          <View style={styles.exitCard}>
            <Text style={styles.exitTitle}>{t('game.exitTitle')}</Text>
            <Text style={styles.exitDesc}>
              {t('game.exitDesc')}
            </Text>
            <TouchableOpacity
              style={styles.exitQuitButton}
              onPress={onHome}
            >
              <LinearGradient
                colors={['#e94560', '#c81d4e']}
                style={styles.exitQuitGradient}
              >
                <Text style={styles.exitQuitText}>{t('game.exit')}</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.exitCancelButton}
              onPress={() => {
                setShowExitModal(false);
                setIsPaused(false);
              }}
            >
              <Text style={styles.exitCancelText}>{t('game.cancel')}</Text>
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
    alignItems: 'center',
  },
  comboText: {
    position: 'absolute',
    top: 75,
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffc107',
    letterSpacing: 2,
    zIndex: 5,
  },
  statsBarWrapper: {
    alignItems: 'center',
    marginTop: 10,
    paddingHorizontal: 20,
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    width: '100%',
    maxWidth: 340,
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
    paddingTop: 0,
  },
  board: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  jokerBanner: {
    marginTop: 8,
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
  pauseButtonRow: {
    alignSelf: 'flex-end',
    marginTop: 8,
    marginRight: 20,
    zIndex: 10,
  },
  pauseButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
    width: '100%',
    maxWidth: 340,
    marginHorizontal: 20,
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
    paddingHorizontal: 20,
  },
  diffContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 50,
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
    width: '100%',
    maxWidth: 280,
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
    width: '100%',
    maxWidth: 280,
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
    width: '100%',
    maxWidth: 220,
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
  exitOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15,12,41,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  exitCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    width: '100%',
    maxWidth: 340,
    marginHorizontal: 20,
  },
  exitTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 3,
    marginBottom: 15,
  },
  exitDesc: {
    fontSize: 14,
    color: '#a0a0b0',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 25,
  },
  exitQuitButton: {
    borderRadius: 14,
    overflow: 'hidden',
    width: 200,
    marginBottom: 15,
  },
  exitQuitGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  exitQuitText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 3,
  },
  exitCancelButton: {
    paddingVertical: 12,
  },
  exitCancelText: {
    color: '#a0a0b0',
    fontSize: 15,
    letterSpacing: 2,
  },
});

export default GameScreen;
