import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SETTINGS_KEY = 'game_settings';

type Settings = {
  soundEnabled: boolean;
  hapticEnabled: boolean;
};

let settings: Settings = {
  soundEnabled: true,
  hapticEnabled: true,
};

export const loadSettings = async (): Promise<Settings> => {
  try {
    const data = await AsyncStorage.getItem(SETTINGS_KEY);
    if (data) {
      settings = JSON.parse(data);
    }
  } catch (_) {
    // varsayılan ayarları kullan
  }
  return settings;
};

export const saveSettings = async (newSettings: Settings) => {
  settings = newSettings;
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (_) {
    // sessiz hata
  }
};

export const getSettings = () => settings;

// Ses üretimi (basit tone generator ile, harici dosya gerektirmez)
const playTone = async (frequency: number, duration: number) => {
  if (!settings.soundEnabled) return;
  try {
    const { sound } = await Audio.Sound.createAsync(
      { uri: `data:audio/wav;base64,${generateTone(frequency, duration)}` },
      { shouldPlay: true, volume: 0.3 }
    );
    sound.setOnPlaybackStatusUpdate((status) => {
      if ('didJustFinish' in status && status.didJustFinish) {
        sound.unloadAsync();
      }
    });
  } catch (_) {
    // ses çalamazsa sessizce devam et
  }
};

// WAV formatında basit ton üreteci
const generateTone = (freq: number, durationMs: number): string => {
  const sampleRate = 22050;
  const numSamples = Math.floor(sampleRate * durationMs / 1000);
  const buffer = new Uint8Array(44 + numSamples);

  // WAV header
  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) buffer[offset + i] = str.charCodeAt(i);
  };
  const writeUint32 = (offset: number, val: number) => {
    buffer[offset] = val & 0xff;
    buffer[offset + 1] = (val >> 8) & 0xff;
    buffer[offset + 2] = (val >> 16) & 0xff;
    buffer[offset + 3] = (val >> 24) & 0xff;
  };
  const writeUint16 = (offset: number, val: number) => {
    buffer[offset] = val & 0xff;
    buffer[offset + 1] = (val >> 8) & 0xff;
  };

  writeString(0, 'RIFF');
  writeUint32(4, 36 + numSamples);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  writeUint32(16, 16);
  writeUint16(20, 1); // PCM
  writeUint16(22, 1); // mono
  writeUint32(24, sampleRate);
  writeUint32(28, sampleRate);
  writeUint16(32, 1);
  writeUint16(34, 8); // 8-bit
  writeString(36, 'data');
  writeUint32(40, numSamples);

  // Ses verisi
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const envelope = Math.min(1, (numSamples - i) / (sampleRate * 0.05)); // fade out
    const sample = Math.sin(2 * Math.PI * freq * t) * envelope;
    buffer[44 + i] = Math.floor((sample + 1) * 127.5);
  }

  // Base64 encode
  let binary = '';
  for (let i = 0; i < buffer.length; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  return btoa(binary);
};

// Oyun sesleri
export const playFlipSound = () => playTone(800, 80);
export const playMatchSound = () => playTone(1200, 150);
export const playMismatchSound = () => playTone(300, 200);
export const playWinSound = async () => {
  await playTone(800, 100);
  setTimeout(() => playTone(1000, 100), 120);
  setTimeout(() => playTone(1200, 200), 250);
};
export const playTimeUpSound = () => playTone(400, 300);
export const playComboSound = (comboCount: number) => playTone(600 + comboCount * 200, 120);

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
