import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { clearScores } from '../utils/gameLogic';
import { getCurrentLang, Lang, setLanguage, t } from '../utils/i18n';
import { loadSettings, saveSettings } from '../utils/sound';

type SettingsScreenProps = {
  onBack: () => void;
};

const APP_VERSION = Constants.expoConfig?.version || '1.0.0';

const SettingsScreen = ({ onBack }: SettingsScreenProps) => {
  const insets = useSafeAreaInsets();
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hapticEnabled, setHapticEnabled] = useState(true);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [lang, setLang] = useState<Lang>(getCurrentLang());

  useEffect(() => {
    loadSettings().then((s) => {
      setSoundEnabled(s.soundEnabled);
      setHapticEnabled(s.hapticEnabled);
    });
  }, []);

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

  const handleLanguageChange = async (newLang: Lang) => {
    await setLanguage(newLang);
    setLang(newLang);
  };

  const handleClearScores = async () => {
    await clearScores();
    setShowClearConfirm(false);
    Alert.alert(t('settings.success'), t('settings.cleared'));
  };

  return (
    <LinearGradient colors={['#0f0c29', '#302b63', '#24243e']} style={styles.container}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 10 }]} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{t('settings.title')}</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('settings.soundHaptic')}</Text>
          <TouchableOpacity style={styles.settingRow} onPress={toggleSound}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>{t('settings.soundEffects')}</Text>
              <Text style={styles.settingDesc}>{t('settings.soundDesc')}</Text>
            </View>
            <View style={[styles.toggle, soundEnabled && styles.toggleActive]}>
              <View style={[styles.toggleDot, soundEnabled && styles.toggleDotActive]} />
            </View>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.settingRow} onPress={toggleHaptic}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>{t('settings.haptic')}</Text>
              <Text style={styles.settingDesc}>{t('settings.hapticDesc')}</Text>
            </View>
            <View style={[styles.toggle, hapticEnabled && styles.toggleActive]}>
              <View style={[styles.toggleDot, hapticEnabled && styles.toggleDotActive]} />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('settings.language')}</Text>
          <View style={styles.langRow}>
            <TouchableOpacity style={[styles.langButton, lang === 'tr' && styles.langButtonActive]} onPress={() => handleLanguageChange('tr')}>
              <Text style={[styles.langText, lang === 'tr' && styles.langTextActive]}>TR</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.langButton, lang === 'en' && styles.langButtonActive]} onPress={() => handleLanguageChange('en')}>
              <Text style={[styles.langText, lang === 'en' && styles.langTextActive]}>EN</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('settings.data')}</Text>
          <TouchableOpacity style={styles.settingRow} onPress={() => setShowClearConfirm(true)}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabelDanger}>{t('settings.clearScores')}</Text>
              <Text style={styles.settingDesc}>{t('settings.clearDesc')}</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('settings.about')}</Text>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>{t('settings.version')}</Text>
            <Text style={styles.settingValue}>{APP_VERSION}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>{t('settings.developer')}</Text>
            <Text style={styles.settingValue}>Flipnova</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>{t('common.back')}</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={showClearConfirm} transparent animationType="fade" onRequestClose={() => setShowClearConfirm(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t('settings.confirmTitle')}</Text>
            <View style={styles.modalDivider} />
            <Text style={styles.modalText}>{t('settings.confirmDesc')}</Text>
            <TouchableOpacity style={styles.modalDeleteButton} onPress={handleClearScores}>
              <LinearGradient colors={['#e94560', '#c81d4e']} style={styles.modalButtonGradient}>
                <Text style={styles.modalButtonText}>{t('settings.delete')}</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalCancelButton} onPress={() => setShowClearConfirm(false)}>
              <Text style={styles.modalCancelText}>{t('game.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { alignItems: 'center', paddingHorizontal: 20, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: '900', color: '#ffffff', letterSpacing: 4, marginBottom: 25 },
  card: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 16, padding: 18, width: '100%', maxWidth: 340, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', marginBottom: 15 },
  cardTitle: { fontSize: 12, color: '#00d4ff', letterSpacing: 2, fontWeight: 'bold', marginBottom: 12 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  settingInfo: { flex: 1 },
  settingLabel: { fontSize: 15, color: '#ffffff', fontWeight: '600' },
  settingLabelDanger: { fontSize: 15, color: '#e94560', fontWeight: '600' },
  settingDesc: { fontSize: 12, color: '#a0a0b0', marginTop: 2 },
  settingValue: { fontSize: 15, color: '#a0a0b0' },
  toggle: { width: 48, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', paddingHorizontal: 3 },
  toggleActive: { backgroundColor: 'rgba(0,200,100,0.4)' },
  toggleDot: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#a0a0b0' },
  toggleDotActive: { backgroundColor: '#00c864', alignSelf: 'flex-end' },
  langRow: { flexDirection: 'row', gap: 10 },
  langButton: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  langButtonActive: { backgroundColor: 'rgba(0,212,255,0.15)', borderColor: 'rgba(0,212,255,0.4)' },
  langText: { fontSize: 16, color: '#a0a0b0', fontWeight: 'bold', letterSpacing: 2 },
  langTextActive: { color: '#00d4ff' },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.08)' },
  backButton: { marginTop: 10, paddingVertical: 12 },
  backButtonText: { color: '#a0a0b0', fontSize: 16, letterSpacing: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,12,41,0.9)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { backgroundColor: '#1a1a3e', borderRadius: 20, padding: 30, width: '85%', maxWidth: 340, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  modalTitle: { fontSize: 20, fontWeight: '900', color: '#e94560', letterSpacing: 3, marginBottom: 12 },
  modalDivider: { width: 40, height: 2, backgroundColor: 'rgba(233,69,96,0.4)', marginBottom: 16 },
  modalText: { fontSize: 14, color: '#a0a0b0', textAlign: 'center', lineHeight: 22, marginBottom: 20 },
  modalDeleteButton: { borderRadius: 12, overflow: 'hidden', width: 160, marginBottom: 12 },
  modalButtonGradient: { paddingVertical: 14, alignItems: 'center' },
  modalButtonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold', letterSpacing: 2 },
  modalCancelButton: { paddingVertical: 10 },
  modalCancelText: { color: '#a0a0b0', fontSize: 15, letterSpacing: 2 },
});

export default SettingsScreen;
