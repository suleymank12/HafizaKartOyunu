import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type HomeScreenProps = {
  onStartGame: () => void;
};

const HomeScreen = ({ onStartGame }: HomeScreenProps) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

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

      </Animated.View>
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
  },
  buttonGradient: {
    paddingHorizontal: 50,
    paddingVertical: 17,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 3,
  },
});

export default HomeScreen;