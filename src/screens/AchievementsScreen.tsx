import { LinearGradient } from 'expo-linear-gradient';
import * as NavigationBar from 'expo-navigation-bar';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ACHIEVEMENTS, getUnlockedAchievements } from '../utils/achievements';

type AchievementsScreenProps = {
  onBack: () => void;
};

const AchievementsScreen = ({ onBack }: AchievementsScreenProps) => {
  const [unlocked, setUnlocked] = useState<string[]>([]);

  useEffect(() => {
    NavigationBar.setVisibilityAsync('hidden');
    NavigationBar.setBehaviorAsync('overlay-swipe');
    getUnlockedAchievements().then(setUnlocked);
  }, []);

  return (
    <LinearGradient colors={['#0f0c29', '#302b63', '#24243e']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <Text style={styles.title}>BASARIMLAR</Text>
        <Text style={styles.subtitle}>
          {unlocked.length} / {ACHIEVEMENTS.length} tamamlandı
        </Text>

        {ACHIEVEMENTS.map((achievement) => {
          const isUnlocked = unlocked.includes(achievement.id);
          return (
            <View
              key={achievement.id}
              style={[styles.card, !isUnlocked && styles.cardLocked]}
            >
              <View style={styles.iconContainer}>
                <Text style={[styles.icon, !isUnlocked && styles.iconLocked]}>
                  {achievement.icon}
                </Text>
              </View>
              <View style={styles.info}>
                <Text style={[styles.name, !isUnlocked && styles.textLocked]}>
                  {achievement.name}
                </Text>
                <Text style={[styles.description, !isUnlocked && styles.textLocked]}>
                  {achievement.description}
                </Text>
                <Text style={[styles.reward, !isUnlocked && styles.textLocked]}>
                  +{achievement.reward} bakiye
                </Text>
              </View>
              <View style={[styles.badge, isUnlocked && { backgroundColor: achievement.color + '33', borderColor: achievement.color + '66' }]}>
                <Text style={[styles.badgeText, isUnlocked && { color: achievement.color }]}>
                  {isUnlocked ? 'TAMAM' : 'KİLİTLİ'}
                </Text>
              </View>
            </View>
          );
        })}

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
    letterSpacing: 5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: '#a0a0b0',
    letterSpacing: 1,
    marginBottom: 25,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    padding: 16,
    width: 300,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    marginBottom: 10,
  },
  cardLocked: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderColor: 'rgba(255,255,255,0.06)',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 22,
  },
  iconLocked: {
    opacity: 0.3,
  },
  info: {
    flex: 1,
    marginRight: 8,
  },
  name: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 2,
  },
  description: {
    fontSize: 11,
    color: '#a0a0b0',
    marginBottom: 3,
  },
  reward: {
    fontSize: 11,
    color: '#ffc107',
    fontWeight: 'bold',
  },
  textLocked: {
    color: '#555',
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#555',
    letterSpacing: 1,
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

export default AchievementsScreen;
