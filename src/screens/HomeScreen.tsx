import { LinearGradient } from 'expo-linear-gradient';
import * as Linking from 'expo-linking';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { checkDailyReward, claimDailyReward } from '../utils/dailyReward';

type HomeScreenProps = {
  onStartGame: () => void;
  onMarket: () => void;
  onAchievements: () => void;
};

const APP_VERSION = '1.0.0';

const HomeScreen = ({ onStartGame, onMarket, onAchievements }: HomeScreenProps) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [showReward, setShowReward] = useState(false);
  const [rewardAmount, setRewardAmount] = useState(0);
  const [rewardStreak, setRewardStreak] = useState(0);
  const [isDay7, setIsDay7] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const rewardScale = useRef(new Animated.Value(0)).current;
  const tutorialScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Tutorial kontrolü
    AsyncStorage.getItem('tutorial_shown').then((shown) => {
      if (!shown) {
        setShowTutorial(true);
        Animated.spring(tutorialScale, {
          toValue: 1,
          friction: 6,
          tension: 80,
          useNativeDriver: true,
        }).start();
      }
    });

    checkDailyReward().then((info) => {
      if (info.canClaim) {
        setRewardAmount(info.reward);
        setRewardStreak(info.streak);
        setIsDay7(info.isDay7Bonus);
        setShowReward(true);
        Animated.spring(rewardScale, {
          toValue: 1,
          friction: 6,
          tension: 80,
          useNativeDriver: true,
        }).start();
      }
    });
  }, []);

  const handleCloseTutorial = async () => {
    await AsyncStorage.setItem('tutorial_shown', 'true');
    Animated.timing(tutorialScale, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setShowTutorial(false));
  };

  const handleClaimReward = async () => {
    await claimDailyReward();
    Animated.timing(rewardScale, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setShowReward(false));
  };

  return (
    <LinearGradient colors={['#0f0c29', '#302b63', '#24243e']} style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>

        <Text style={styles.title}>HAFIZA KARTI</Text>
        <Text style={styles.subtitle}>OYUNU</Text>
        <View style={styles.divider} />
        <Text style={styles.description}>Kartları eşleştir, combo yap, yüksek skor kır.</Text>

        <TouchableOpacity style={styles.button} onPress={onStartGame}>
          <LinearGradient
            colors={['#e94560', '#c81d4e']}
            style={styles.buttonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.buttonText}>OYUNA BAŞLA</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.marketButton} onPress={onMarket}>
          <LinearGradient
            colors={['#ffc107', '#e6a800']}
            style={styles.buttonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.marketButtonText}>MARKET</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.achievementsButton} onPress={onAchievements}>
          <LinearGradient
            colors={['#9c27b0', '#7b1fa2']}
            style={styles.buttonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.achievementsButtonText}>BAŞARIMLAR</Text>
          </LinearGradient>
        </TouchableOpacity>

      </Animated.View>

      <View style={styles.footer}>
        <TouchableOpacity onPress={() => Linking.openURL('https://github.com/suleymank12/flipnova-privacy-policy')}>
          <Text style={styles.privacyText}>Gizlilik Politikası</Text>
        </TouchableOpacity>
        <Text style={styles.versionText}>v{APP_VERSION}</Text>
      </View>

      {/* Tutorial Modal */}
      <Modal
        visible={showTutorial}
        transparent
        animationType="fade"
        onRequestClose={handleCloseTutorial}
      >
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.tutorialCard, { transform: [{ scale: tutorialScale }] }]}>
            <Text style={styles.tutorialEmoji}>🃏</Text>
            <Text style={styles.tutorialTitle}>NASIL OYNANIR?</Text>
            <View style={styles.tutorialDivider} />
            <ScrollView style={styles.tutorialScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.tutorialStep}>1. Bir zorluk seviyesi seç</Text>
              <Text style={styles.tutorialStep}>2. Kartlara dokunarak çevir</Text>
              <Text style={styles.tutorialStep}>3. Aynı sembolleri eşleştir</Text>
              <Text style={styles.tutorialStep}>4. Ardışık eşleşmeler = COMBO!</Text>
              <Text style={styles.tutorialStep}>5. Süre dolmadan tüm kartları eşleştir</Text>
              <Text style={styles.tutorialTip}>
                Marketten tema ve bonus satın alabilirsin. Günlük ödüllerini toplamayı unutma!
              </Text>
            </ScrollView>
            <TouchableOpacity style={styles.tutorialButton} onPress={handleCloseTutorial}>
              <LinearGradient
                colors={['#00c864', '#00a050']}
                style={styles.tutorialButtonGradient}
              >
                <Text style={styles.tutorialButtonText}>ANLADIM</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>

      {/* Günlük Ödül Modal */}
      <Modal
        visible={showReward}
        transparent
        animationType="fade"
        onRequestClose={handleClaimReward}
      >
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.rewardCard, { transform: [{ scale: rewardScale }] }]}>
            <Text style={styles.rewardEmoji}>{isDay7 ? '🎉' : '🎁'}</Text>
            <Text style={styles.rewardTitle}>
              {isDay7 ? 'HAFTALIK BONUS!' : 'GÜNLÜK ÖDÜL!'}
            </Text>
            <View style={styles.rewardDivider} />
            <Text style={styles.rewardStreakText}>
              {rewardStreak}. gün seri
            </Text>
            <View style={styles.rewardAmountContainer}>
              <Text style={styles.rewardAmountText}>+{rewardAmount}</Text>
              <Text style={styles.rewardAmountLabel}>bakiye</Text>
            </View>
            <TouchableOpacity style={styles.rewardClaimButton} onPress={handleClaimReward}>
              <LinearGradient
                colors={['#00c864', '#00a050']}
                style={styles.rewardClaimGradient}
              >
                <Text style={styles.rewardClaimText}>TOPLA</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>

    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  title: {
    fontSize: 34,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 4,
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 30,
    fontWeight: '300',
    color: '#e94560',
    letterSpacing: 9,
    marginBottom: 18,
  },
  divider: {
    width: 50,
    height: 2,
    backgroundColor: '#e94560',
    marginVertical: 15,
  },
  description: {
    fontSize: 17,
    color: '#a0a0b0',
    textAlign: 'center',
    marginTop: 23,
    marginBottom: 54,
  },
  button: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 15,
    width: 280,
  },
  buttonGradient: {
    paddingVertical: 17,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 3,
  },
  marketButton: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 15,
    width: 280,
  },
  marketButtonText: {
    color: '#1a1a2e',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 3,
  },
  achievementsButton: {
    borderRadius: 14,
    overflow: 'hidden',
    width: 280,
  },
  achievementsButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 3,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 30,
    gap: 8,
  },
  privacyText: {
    fontSize: 12,
    color: 'rgba(160,160,176,0.7)',
    letterSpacing: 1,
    textDecorationLine: 'underline',
  },
  versionText: {
    fontSize: 12,
    color: 'rgba(160,160,176,0.5)',
    letterSpacing: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,12,41,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rewardCard: {
    backgroundColor: '#1a1a3e',
    borderRadius: 24,
    padding: 35,
    width: 280,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,199,7,0.3)',
  },
  rewardEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  rewardTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ffc107',
    letterSpacing: 3,
    marginBottom: 10,
  },
  rewardDivider: {
    width: 40,
    height: 2,
    backgroundColor: 'rgba(255,199,7,0.3)',
    marginBottom: 14,
  },
  rewardStreakText: {
    fontSize: 14,
    color: '#a0a0b0',
    marginBottom: 16,
  },
  rewardAmountContainer: {
    backgroundColor: 'rgba(0,200,100,0.1)',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,200,100,0.25)',
    marginBottom: 20,
  },
  rewardAmountText: {
    fontSize: 36,
    fontWeight: '900',
    color: '#00c864',
  },
  rewardAmountLabel: {
    fontSize: 12,
    color: '#00c864',
    letterSpacing: 2,
    marginTop: 2,
  },
  rewardClaimButton: {
    borderRadius: 14,
    overflow: 'hidden',
    width: 180,
  },
  rewardClaimGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  rewardClaimText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 3,
  },
  // Tutorial styles
  tutorialCard: {
    backgroundColor: '#1a1a3e',
    borderRadius: 24,
    padding: 30,
    width: 300,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,212,255,0.3)',
    maxHeight: 480,
  },
  tutorialEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  tutorialTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#00d4ff',
    letterSpacing: 3,
    marginBottom: 10,
  },
  tutorialDivider: {
    width: 40,
    height: 2,
    backgroundColor: 'rgba(0,212,255,0.3)',
    marginBottom: 16,
  },
  tutorialScroll: {
    width: '100%',
    marginBottom: 20,
  },
  tutorialStep: {
    fontSize: 15,
    color: '#ffffff',
    marginBottom: 10,
    lineHeight: 22,
  },
  tutorialTip: {
    fontSize: 13,
    color: '#a0a0b0',
    marginTop: 8,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  tutorialButton: {
    borderRadius: 14,
    overflow: 'hidden',
    width: 180,
  },
  tutorialButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  tutorialButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 3,
  },
});

export default HomeScreen;
