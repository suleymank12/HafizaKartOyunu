import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { checkDailyReward, claimDailyReward } from '../utils/dailyReward';
import { loadLanguage, t } from '../utils/i18n';

type HomeScreenProps = {
  onStartGame: () => void;
  onMarket: () => void;
  onAchievements: () => void;
  onStats: () => void;
  onSettings: () => void;
};

const APP_VERSION = Constants.expoConfig?.version || '1.0.0';

const HomeScreen = ({ onStartGame, onMarket, onAchievements, onStats, onSettings }: HomeScreenProps) => {
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [showReward, setShowReward] = useState(false);
  const [rewardAmount, setRewardAmount] = useState(0);
  const [rewardStreak, setRewardStreak] = useState(0);
  const [isDay7, setIsDay7] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const rewardScale = useRef(new Animated.Value(0)).current;
  const tutorialScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadLanguage();

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

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
      <Animated.View style={[styles.content, { opacity: fadeAnim, paddingTop: insets.top + 10 }]}>

        <Text style={styles.title}>{t('home.title')}</Text>
        <Text style={styles.subtitle}>{t('home.subtitle')}</Text>
        <View style={styles.divider} />
        <Text style={styles.description}>{t('home.description')}</Text>

        <TouchableOpacity style={styles.button} onPress={onStartGame}>
          <LinearGradient colors={['#e94560', '#c81d4e']} style={styles.buttonGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={styles.buttonText}>{t('home.start')}</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={onMarket}>
          <LinearGradient colors={['#ffc107', '#e6a800']} style={styles.buttonGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={styles.marketButtonText}>{t('home.market')}</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={onAchievements}>
          <LinearGradient colors={['#9c27b0', '#7b1fa2']} style={styles.buttonGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={styles.buttonText}>{t('home.achievements')}</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={onStats}>
          <LinearGradient colors={['#00d4ff', '#0099cc']} style={styles.buttonGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={styles.buttonText}>{t('home.stats')}</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={onSettings}>
          <LinearGradient colors={['#555577', '#3d3d5c']} style={styles.buttonGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={styles.buttonText}>{t('home.settings')}</Text>
          </LinearGradient>
        </TouchableOpacity>

      </Animated.View>

      <View style={styles.footer}>
        <TouchableOpacity onPress={() => setShowPrivacy(true)}>
          <Text style={styles.privacyText}>{t('home.privacy')}</Text>
        </TouchableOpacity>
        <Text style={styles.versionText}>v{APP_VERSION}</Text>
      </View>

      <Modal visible={showTutorial} transparent animationType="fade" onRequestClose={handleCloseTutorial}>
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.modalCard, { transform: [{ scale: tutorialScale }] }]}>
            <Text style={styles.tutorialEmoji}>🃏</Text>
            <Text style={styles.tutorialTitle}>{t('tutorial.title')}</Text>
            <View style={styles.modalDivider} />
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.tutorialStep}>{t('tutorial.step1')}</Text>
              <Text style={styles.tutorialStep}>{t('tutorial.step2')}</Text>
              <Text style={styles.tutorialStep}>{t('tutorial.step3')}</Text>
              <Text style={styles.tutorialStep}>{t('tutorial.step4')}</Text>
              <Text style={styles.tutorialStep}>{t('tutorial.step5')}</Text>
              <Text style={styles.tutorialTip}>{t('tutorial.tip')}</Text>
            </ScrollView>
            <TouchableOpacity style={styles.modalButton} onPress={handleCloseTutorial}>
              <LinearGradient colors={['#00c864', '#00a050']} style={styles.modalButtonGradient}>
                <Text style={styles.modalButtonText}>{t('tutorial.ok')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>

      <Modal visible={showReward} transparent animationType="fade" onRequestClose={handleClaimReward}>
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.modalCard, { borderColor: 'rgba(255,199,7,0.3)', transform: [{ scale: rewardScale }] }]}>
            <Text style={styles.tutorialEmoji}>{isDay7 ? '🎉' : '🎁'}</Text>
            <Text style={[styles.tutorialTitle, { color: '#ffc107' }]}>
              {isDay7 ? t('reward.weekly') : t('reward.daily')}
            </Text>
            <View style={[styles.modalDivider, { backgroundColor: 'rgba(255,199,7,0.3)' }]} />
            <Text style={styles.rewardStreakText}>{rewardStreak}{t('reward.streak')}</Text>
            <View style={styles.rewardAmountContainer}>
              <Text style={styles.rewardAmountText}>+{rewardAmount}</Text>
              <Text style={styles.rewardAmountLabel}>{t('reward.balance')}</Text>
            </View>
            <TouchableOpacity style={styles.modalButton} onPress={handleClaimReward}>
              <LinearGradient colors={['#00c864', '#00a050']} style={styles.modalButtonGradient}>
                <Text style={styles.modalButtonText}>{t('reward.claim')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>

      <Modal visible={showPrivacy} transparent animationType="fade" onRequestClose={() => setShowPrivacy(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.privacyTitle}>{t('privacy.title')}</Text>
            <View style={styles.modalDivider} />
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.privacyBodyTitle}>{t('privacy.appTitle')}</Text>
              <Text style={styles.privacyBodyText}>{t('privacy.updated')}</Text>
              <Text style={styles.privacyBodyText}>{t('privacy.intro')}</Text>
              <Text style={styles.privacyBodySubtitle}>{t('privacy.dataTitle')}</Text>
              <Text style={styles.privacyBodyText}>{t('privacy.dataDesc')}</Text>
              <Text style={styles.privacyBodySubtitle}>{t('privacy.shareTitle')}</Text>
              <Text style={styles.privacyBodyText}>{t('privacy.shareDesc')}</Text>
              <Text style={styles.privacyBodySubtitle}>{t('privacy.contactTitle')}</Text>
              <Text style={styles.privacyBodyText}>{t('privacy.contactDesc')}</Text>
            </ScrollView>
            <TouchableOpacity style={styles.modalButton} onPress={() => setShowPrivacy(false)}>
              <LinearGradient colors={['#00c864', '#00a050']} style={styles.modalButtonGradient}>
                <Text style={styles.modalButtonText}>{t('privacy.close')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  title: { fontSize: 34, fontWeight: '900', color: '#ffffff', letterSpacing: 4, marginBottom: 20 },
  subtitle: { fontSize: 30, fontWeight: '300', color: '#e94560', letterSpacing: 9, marginBottom: 18 },
  divider: { width: 50, height: 2, backgroundColor: '#e94560', marginVertical: 15 },
  description: { fontSize: 17, color: '#a0a0b0', textAlign: 'center', marginTop: 23, marginBottom: 54 },
  button: { borderRadius: 14, overflow: 'hidden', marginBottom: 15, width: '100%', maxWidth: 340 },
  buttonGradient: { paddingVertical: 17, alignItems: 'center' },
  buttonText: { color: '#ffffff', fontSize: 18, fontWeight: 'bold', letterSpacing: 3 },
  marketButtonText: { color: '#1a1a2e', fontSize: 18, fontWeight: 'bold', letterSpacing: 3 },
  footer: { alignItems: 'center', paddingBottom: 30, gap: 8 },
  privacyText: { fontSize: 12, color: 'rgba(160,160,176,0.7)', letterSpacing: 1, textDecorationLine: 'underline' },
  versionText: { fontSize: 12, color: 'rgba(160,160,176,0.5)', letterSpacing: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,12,41,0.9)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { backgroundColor: '#1a1a3e', borderRadius: 24, padding: 30, width: '85%', maxWidth: 340, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,212,255,0.3)', maxHeight: 500 },
  modalDivider: { width: 40, height: 2, backgroundColor: 'rgba(0,212,255,0.3)', marginBottom: 16 },
  modalScroll: { width: '100%', marginBottom: 20 },
  modalButton: { borderRadius: 14, overflow: 'hidden', width: 180 },
  modalButtonGradient: { paddingVertical: 14, alignItems: 'center' },
  modalButtonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold', letterSpacing: 3 },
  tutorialEmoji: { fontSize: 48, marginBottom: 8 },
  tutorialTitle: { fontSize: 22, fontWeight: '900', color: '#00d4ff', letterSpacing: 3, marginBottom: 10 },
  tutorialStep: { fontSize: 15, color: '#ffffff', marginBottom: 10, lineHeight: 22 },
  tutorialTip: { fontSize: 13, color: '#a0a0b0', marginTop: 8, lineHeight: 20, fontStyle: 'italic' },
  rewardStreakText: { fontSize: 14, color: '#a0a0b0', marginBottom: 16 },
  rewardAmountContainer: { backgroundColor: 'rgba(0,200,100,0.1)', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 30, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,200,100,0.25)', marginBottom: 20 },
  rewardAmountText: { fontSize: 36, fontWeight: '900', color: '#00c864' },
  rewardAmountLabel: { fontSize: 12, color: '#00c864', letterSpacing: 2, marginTop: 2 },
  privacyTitle: { fontSize: 18, fontWeight: '900', color: '#ffffff', letterSpacing: 3, marginBottom: 10 },
  privacyBodyTitle: { fontSize: 16, fontWeight: 'bold', color: '#ffffff', marginBottom: 6 },
  privacyBodySubtitle: { fontSize: 14, fontWeight: 'bold', color: '#ffffff', marginTop: 12, marginBottom: 4 },
  privacyBodyText: { fontSize: 13, color: '#a0a0b0', lineHeight: 20, marginBottom: 6 },
});

export default HomeScreen;
