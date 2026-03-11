import { Audio, AVPlaybackSource } from 'expo-av';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SOUND_CLEANUP_MS, WIN_SOUND_2_DELAY, WIN_SOUND_3_DELAY } from './constants';

const SETTINGS_KEY = 'game_settings';

type Settings = {
  soundEnabled: boolean;
  hapticEnabled: boolean;
};

let settings: Settings = {
  soundEnabled: true,
  hapticEnabled: true,
};

// Preloaded sound references
const soundAssets: Record<string, AVPlaybackSource> = {
  flip: require('../../assets/sounds/flip.wav'),
  match: require('../../assets/sounds/match.wav'),
  mismatch: require('../../assets/sounds/mismatch.wav'),
  timeup: require('../../assets/sounds/timeup.wav'),
  win1: require('../../assets/sounds/win1.wav'),
  win2: require('../../assets/sounds/win2.wav'),
  win3: require('../../assets/sounds/win3.wav'),
  combo: require('../../assets/sounds/combo_base.wav'),
};

export const loadSettings = async (): Promise<Settings> => {
  try {
    const data = await AsyncStorage.getItem(SETTINGS_KEY);
    if (data) {
      settings = JSON.parse(data);
    }
  } catch (e) {
    if (__DEV__) console.warn('Sound/Settings hatası:', e);
  }
  return settings;
};

export const saveSettings = async (newSettings: Settings) => {
  settings = newSettings;
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    if (__DEV__) console.warn('Sound/Settings hatası:', e);
  }
};

export const getSettings = () => settings;

const playSound = async (name: string) => {
  if (!settings.soundEnabled) return;
  try {
    const source = soundAssets[name];
    if (!source) return;
    const { sound } = await Audio.Sound.createAsync(source, {
      shouldPlay: true,
      volume: 0.3,
    });
    sound.setOnPlaybackStatusUpdate((status) => {
      if ('didJustFinish' in status && status.didJustFinish) {
        sound.unloadAsync();
      }
    });
    // Fallback cleanup: unload after 5s in case callback never fires
    setTimeout(() => {
      sound.unloadAsync().catch(() => {});
    }, SOUND_CLEANUP_MS);
  } catch (e) {
    if (__DEV__) console.warn('Ses çalma hatası:', e);
  }
};

// Oyun sesleri
export const playFlipSound = () => playSound('flip');
export const playMatchSound = () => playSound('match');
export const playMismatchSound = () => playSound('mismatch');
export const playTimeUpSound = () => playSound('timeup');
export const playWinSound = async () => {
  await playSound('win1');
  setTimeout(() => playSound('win2'), WIN_SOUND_2_DELAY);
  setTimeout(() => playSound('win3'), WIN_SOUND_3_DELAY);
};
export const playComboSound = (_comboCount: number) => playSound('combo');

// Haptic feedback
export const hapticFlip = () => {
  if (settings.hapticEnabled) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
};

export const hapticMatch = () => {
  if (settings.hapticEnabled) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }
};

export const hapticMismatch = () => {
  if (settings.hapticEnabled) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }
};

export const hapticCombo = () => {
  if (settings.hapticEnabled) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }
};

export const hapticTimeUp = () => {
  if (settings.hapticEnabled) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }
};
