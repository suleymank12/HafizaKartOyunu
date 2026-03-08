import * as NavigationBar from 'expo-navigation-bar';
import React, { useEffect, useState } from 'react';
import GameScreen from '../../src/screens/GameScreen';
import HomeScreen from '../../src/screens/HomeScreen';
import MarketScreen from '../../src/screens/MarketScreen';

export default function Index() {
  const [screen, setScreen] = useState('home');

  useEffect(() => {
    NavigationBar.setVisibilityAsync('hidden');
    NavigationBar.setBehaviorAsync('overlay-swipe');
  }, []);

  if (screen === 'game') {
    return <GameScreen onHome={() => setScreen('home')} />;
  }

  if (screen === 'market') {
    return <MarketScreen onBack={() => setScreen('home')} />;
  }

  return (
    <HomeScreen
      onStartGame={() => setScreen('game')}
      onMarket={() => setScreen('market')}
    />
  );
}
