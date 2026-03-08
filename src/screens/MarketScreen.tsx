import { LinearGradient } from 'expo-linear-gradient';
import * as NavigationBar from 'expo-navigation-bar';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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

  const handlePurchaseTheme = async (themeId: string, price: number) => {
    if (balance < price) {
      Alert.alert('Yetersiz Puan', 'Bu öğeyi satın almak için yeterli puanınız yok.');
      return;
    }
    const success = await purchaseTheme(themeId, price);
    if (success) await loadData();
  };

  const handlePurchaseConsumable = async (itemId: string, price: number) => {
    if (balance < price) {
      Alert.alert('Yetersiz Puan', 'Bu öğeyi satın almak için yeterli puanınız yok.');
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
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>BAKİYE</Text>
          <Text style={styles.balanceValue}>{balance}</Text>
        </View>

        {/* Kart Temaları */}
        <Text style={styles.sectionTitle}>KART TEMALARI</Text>
        {CARD_THEMES.map((theme) => {
          const owned = inventory.includes(theme.id);
          const isActive = activeCardTheme === theme.id;
          return (
            <View key={theme.id} style={styles.itemCard}>
              <View style={styles.itemInfo}>
                <View style={styles.itemNameRow}>
                  <View style={[styles.colorDot, { backgroundColor: theme.colors.normal }]} />
                  <Text style={styles.itemName}>{theme.name}</Text>
                </View>
                <Text style={styles.itemPrice}>{theme.price} puan</Text>
              </View>
              {owned ? (
                <TouchableOpacity
                  style={[styles.actionButton, isActive ? styles.activeButton : styles.selectButton]}
                  onPress={() => handleSelectCardTheme(theme.id)}
                >
                  <Text style={[styles.actionButtonText, isActive && styles.activeButtonText]}>
                    {isActive ? 'SECILİ' : 'SEC'}
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.actionButton, styles.buyButton]}
                  onPress={() => handlePurchaseTheme(theme.id, theme.price)}
                >
                  <Text style={styles.buyButtonText}>SATIN AL</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}

        {/* Arka Plan Temaları */}
        <Text style={styles.sectionTitle}>ARKA PLAN TEMALARI</Text>
        {BG_THEMES.map((theme) => {
          const owned = inventory.includes(theme.id);
          const isActive = activeBgTheme === theme.id;
          return (
            <View key={theme.id} style={styles.itemCard}>
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
                  style={[styles.actionButton, isActive ? styles.activeButton : styles.selectButton]}
                  onPress={() => handleSelectBgTheme(theme.id)}
                >
                  <Text style={[styles.actionButtonText, isActive && styles.activeButtonText]}>
                    {isActive ? 'SECILİ' : 'SEC'}
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.actionButton, styles.buyButton]}
                  onPress={() => handlePurchaseTheme(theme.id, theme.price)}
                >
                  <Text style={styles.buyButtonText}>SATIN AL</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}

        {/* Tek Kullanımlık */}
        <Text style={styles.sectionTitle}>TEK KULLANIMLIK</Text>
        {CONSUMABLES.map((item) => {
          const qty = consumables[item.id] || 0;
          return (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemDesc}>{item.desc}</Text>
                <View style={styles.priceRow}>
                  <Text style={styles.itemPrice}>{item.price} puan</Text>
                  {qty > 0 && <Text style={styles.qtyBadge}>x{qty}</Text>}
                </View>
              </View>
              <TouchableOpacity
                style={[styles.actionButton, styles.buyButton]}
                onPress={() => handlePurchaseConsumable(item.id, item.price)}
              >
                <Text style={styles.buyButtonText}>SATIN AL</Text>
              </TouchableOpacity>
            </View>
          );
        })}

        {/* Geri Dön */}
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>GERİ DÖN</Text>
        </TouchableOpacity>

      </ScrollView>
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
    fontSize: 28,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 4,
    marginBottom: 20,
  },
  balanceCard: {
    backgroundColor: 'rgba(255,199,7,0.1)',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 24,
    width: 280,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,199,7,0.25)',
    marginBottom: 25,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#ffc107',
    letterSpacing: 2,
    fontWeight: 'bold',
  },
  balanceValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffc107',
  },
  sectionTitle: {
    fontSize: 14,
    color: '#a0a0b0',
    letterSpacing: 2,
    marginBottom: 12,
    marginTop: 5,
    alignSelf: 'flex-start',
    marginLeft: 10,
  },
  itemCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    padding: 16,
    width: 280,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
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
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 8,
  },
  gradientDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 8,
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
  actionButton: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minWidth: 80,
    alignItems: 'center',
  },
  buyButton: {
    backgroundColor: 'rgba(255,199,7,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,199,7,0.4)',
  },
  buyButtonText: {
    color: '#ffc107',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  selectButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  activeButton: {
    backgroundColor: 'rgba(0,200,100,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(0,200,100,0.5)',
  },
  actionButtonText: {
    color: '#a0a0b0',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  activeButtonText: {
    color: '#00c864',
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
});

export default MarketScreen;
