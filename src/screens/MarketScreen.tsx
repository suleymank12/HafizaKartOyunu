import { LinearGradient } from 'expo-linear-gradient';
import * as NavigationBar from 'expo-navigation-bar';
import React, { useCallback, useEffect, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getScores } from '../utils/gameLogic';
import {
  BG_THEMES, CARD_THEMES, CONSUMABLES,
  getActiveBgThemeId, getActiveCardThemeId,
  getBalance, getConsumables, getInventory,
  purchaseConsumable, purchaseTheme,
  setActiveBgTheme, setActiveCardTheme,
} from '../utils/market';

type MarketScreenProps = {
  onBack: () => void;
};

const MarketScreen = ({ onBack }: MarketScreenProps) => {
  const [balance, setBalance] = useState(0);
  const [inventory, setInventory] = useState<string[]>([]);
  const [consumables, setConsumables] = useState<Record<string, number>>({});
  const [activeCardTheme, setActiveCardThemeState] = useState<string | null>(null);
  const [activeBgTheme, setActiveBgThemeState] = useState<string | null>(null);
  const [showAlert, setShowAlert] = useState(false);
  const [alertPrice, setAlertPrice] = useState(0);

  useEffect(() => {
    NavigationBar.setVisibilityAsync('hidden');
    NavigationBar.setBehaviorAsync('overlay-swipe');
  }, []);

  const loadData = useCallback(async () => {
    const scores = await getScores();
    const totalEarned = scores.reduce((sum, s) => sum + s.score, 0);
    const bal = await getBalance(totalEarned);
    setBalance(bal);
    setInventory(await getInventory());
    setConsumables(await getConsumables());
    setActiveCardThemeState(await getActiveCardThemeId());
    setActiveBgThemeState(await getActiveBgThemeId());
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const showInsufficientAlert = (price: number) => {
    setAlertPrice(price);
    setShowAlert(true);
  };

  const handlePurchaseTheme = async (themeId: string, price: number) => {
    if (balance < price) {
      showInsufficientAlert(price);
      return;
    }
    const success = await purchaseTheme(themeId, price);
    if (success) await loadData();
  };

  const handlePurchaseConsumable = async (itemId: string, price: number) => {
    if (balance < price) {
      showInsufficientAlert(price);
      return;
    }
    const success = await purchaseConsumable(itemId, price);
    if (success) await loadData();
  };

  const handleSelectCardTheme = async (themeId: string) => {
    const newId = activeCardTheme === themeId ? null : themeId;
    await setActiveCardTheme(newId);
    setActiveCardThemeState(newId);
  };

  const handleSelectBgTheme = async (themeId: string) => {
    const newId = activeBgTheme === themeId ? null : themeId;
    await setActiveBgTheme(newId);
    setActiveBgThemeState(newId);
  };

  return (
    <LinearGradient colors={['#0f0c29', '#302b63', '#24243e']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <Text style={styles.title}>MARKET</Text>

        {/* Bakiye */}
        <LinearGradient
          colors={['rgba(255,199,7,0.15)', 'rgba(255,165,0,0.08)']}
          style={styles.balanceCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.balanceInner}>
            <Text style={styles.balanceLabel}>BAKİYE</Text>
            <Text style={styles.balanceSubLabel}>Harcayabileceğin puan</Text>
          </View>
          <Text style={styles.balanceValue}>{balance}</Text>
        </LinearGradient>

        {/* Kart Temaları */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionDot} />
          <Text style={styles.sectionTitle}>KART TEMALARI</Text>
        </View>
        {CARD_THEMES.map((theme) => {
          const owned = inventory.includes(theme.id);
          const isActive = activeCardTheme === theme.id;
          return (
            <LinearGradient
              key={theme.id}
              colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.03)']}
              style={styles.itemCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.itemInfo}>
                <View style={styles.itemNameRow}>
                  <View style={[styles.colorDot, { backgroundColor: theme.colors.normal }]} />
                  <View style={[styles.colorDotSmall, { backgroundColor: theme.colors.matched }]} />
                  <Text style={styles.itemName}>{theme.name}</Text>
                </View>
                <Text style={styles.itemPrice}>{theme.price} puan</Text>
              </View>
              {owned ? (
                <TouchableOpacity
                  style={styles.themeActionButton}
                  onPress={() => handleSelectCardTheme(theme.id)}
                >
                  <LinearGradient
                    colors={isActive ? ['#00c864', '#00a050'] : ['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.06)']}
                    style={styles.actionGradient}
                  >
                    <Text style={[styles.actionButtonText, isActive && styles.activeButtonText]}>
                      {isActive ? 'SECILİ' : 'SEC'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.themeActionButton}
                  onPress={() => handlePurchaseTheme(theme.id, theme.price)}
                >
                  <LinearGradient
                    colors={['#ffc107', '#e6a800']}
                    style={styles.actionGradient}
                  >
                    <Text style={styles.buyButtonText}>SATIN AL</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </LinearGradient>
          );
        })}

        {/* Arka Plan Temaları */}
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionDot, { backgroundColor: '#e94560' }]} />
          <Text style={styles.sectionTitle}>ARKA PLAN TEMALARI</Text>
        </View>
        {BG_THEMES.map((theme) => {
          const owned = inventory.includes(theme.id);
          const isActive = activeBgTheme === theme.id;
          return (
            <LinearGradient
              key={theme.id}
              colors={[`${theme.gradient[1]}44`, `${theme.gradient[2]}22`]}
              style={styles.itemCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.itemInfo}>
                <View style={styles.itemNameRow}>
                  <LinearGradient
                    colors={theme.gradient}
                    style={styles.gradientDot}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  />
                  <Text style={styles.itemName}>{theme.name}</Text>
                </View>
                <Text style={styles.itemPrice}>{theme.price} puan</Text>
              </View>
              {owned ? (
                <TouchableOpacity
                  style={styles.themeActionButton}
                  onPress={() => handleSelectBgTheme(theme.id)}
                >
                  <LinearGradient
                    colors={isActive ? ['#00c864', '#00a050'] : ['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.06)']}
                    style={styles.actionGradient}
                  >
                    <Text style={[styles.actionButtonText, isActive && styles.activeButtonText]}>
                      {isActive ? 'SECILİ' : 'SEC'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.themeActionButton}
                  onPress={() => handlePurchaseTheme(theme.id, theme.price)}
                >
                  <LinearGradient
                    colors={['#ffc107', '#e6a800']}
                    style={styles.actionGradient}
                  >
                    <Text style={styles.buyButtonText}>SATIN AL</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </LinearGradient>
          );
        })}

        {/* Tek Kullanımlık */}
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionDot, { backgroundColor: '#00d4ff' }]} />
          <Text style={styles.sectionTitle}>TEK KULLANIMLIK</Text>
        </View>
        {CONSUMABLES.map((item) => {
          const qty = consumables[item.id] || 0;
          return (
            <LinearGradient
              key={item.id}
              colors={['rgba(0,212,255,0.08)', 'rgba(255,255,255,0.03)']}
              style={styles.itemCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemDesc}>{item.desc}</Text>
                <View style={styles.priceRow}>
                  <Text style={styles.itemPrice}>{item.price} puan</Text>
                  {qty > 0 && <Text style={styles.qtyBadge}>x{qty}</Text>}
                </View>
              </View>
              <TouchableOpacity
                style={styles.themeActionButton}
                onPress={() => handlePurchaseConsumable(item.id, item.price)}
              >
                <LinearGradient
                  colors={['#ffc107', '#e6a800']}
                  style={styles.actionGradient}
                >
                  <Text style={styles.buyButtonText}>SATIN AL</Text>
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          );
        })}

        {/* Geri Dön */}
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>GERİ DÖN</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* Yetersiz Puan Modal */}
      <Modal
        visible={showAlert}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAlert(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>YETERSIZ PUAN</Text>
            <View style={styles.modalDivider} />
            <Text style={styles.modalText}>
              Bu öğeyi satın almak için{' '}
              <Text style={styles.modalHighlight}>{alertPrice - balance}</Text>{' '}
              puan daha kazanman gerekiyor.
            </Text>
            <View style={styles.modalInfo}>
              <View style={styles.modalInfoRow}>
                <Text style={styles.modalInfoLabel}>Bakiye</Text>
                <Text style={styles.modalInfoValue}>{balance}</Text>
              </View>
              <View style={styles.modalInfoRow}>
                <Text style={styles.modalInfoLabel}>Gerekli</Text>
                <Text style={styles.modalInfoValueRed}>{alertPrice}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.modalButton} onPress={() => setShowAlert(false)}>
              <LinearGradient
                colors={['#e94560', '#c81d4e']}
                style={styles.modalButtonGradient}
              >
                <Text style={styles.modalButtonText}>TAMAM</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
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
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingTop: 50,
    paddingBottom: 40,
  },
  title: {
    fontSize: 30,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 6,
    marginBottom: 20,
  },
  balanceCard: {
    borderRadius: 18,
    paddingVertical: 20,
    paddingHorizontal: 28,
    width: 300,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,199,7,0.3)',
    marginBottom: 30,
  },
  balanceInner: {
    flexDirection: 'column',
  },
  balanceLabel: {
    fontSize: 18,
    color: '#ffc107',
    letterSpacing: 3,
    fontWeight: '900',
  },
  balanceSubLabel: {
    fontSize: 10,
    color: 'rgba(255,199,7,0.5)',
    marginTop: 3,
    letterSpacing: 1,
  },
  balanceValue: {
    fontSize: 32,
    fontWeight: '900',
    color: '#ffc107',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginLeft: 10,
    marginBottom: 12,
    marginTop: 8,
  },
  sectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffc107',
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 13,
    color: '#ffffff',
    letterSpacing: 2,
    fontWeight: 'bold',
  },
  itemCard: {
    borderRadius: 14,
    padding: 16,
    width: 300,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 10,
  },
  itemInfo: {
    flex: 1,
    marginRight: 12,
  },
  itemNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  colorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  colorDotSmall: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  gradientDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  itemName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  itemDesc: {
    fontSize: 11,
    color: '#a0a0b0',
    marginTop: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  itemPrice: {
    fontSize: 12,
    color: '#ffc107',
    marginTop: 2,
  },
  qtyBadge: {
    fontSize: 12,
    color: '#00c864',
    fontWeight: 'bold',
    marginLeft: 10,
    backgroundColor: 'rgba(0,200,100,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  themeActionButton: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  actionGradient: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    minWidth: 85,
    alignItems: 'center',
  },
  buyButtonText: {
    color: '#1a1a2e',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  actionButtonText: {
    color: '#a0a0b0',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  activeButtonText: {
    color: '#ffffff',
  },
  backButton: {
    marginTop: 20,
    paddingVertical: 12,
  },
  backButtonText: {
    color: '#a0a0b0',
    fontSize: 16,
    letterSpacing: 2,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,12,41,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    backgroundColor: '#1a1a3e',
    borderRadius: 20,
    padding: 30,
    width: 300,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#e94560',
    letterSpacing: 3,
    marginBottom: 12,
  },
  modalDivider: {
    width: 40,
    height: 2,
    backgroundColor: 'rgba(233,69,96,0.4)',
    marginBottom: 16,
  },
  modalText: {
    fontSize: 14,
    color: '#a0a0b0',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  modalHighlight: {
    color: '#ffc107',
    fontWeight: 'bold',
  },
  modalInfo: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: 14,
    width: '100%',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  modalInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  modalInfoLabel: {
    fontSize: 13,
    color: '#a0a0b0',
  },
  modalInfoValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#ffc107',
  },
  modalInfoValueRed: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#e94560',
  },
  modalButton: {
    borderRadius: 12,
    overflow: 'hidden',
    width: 160,
  },
  modalButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
});

export default MarketScreen;
