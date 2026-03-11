import React, { useEffect, useState } from 'react';
import { BackHandler } from 'react-native';
import AchievementsScreen from '../../src/screens/AchievementsScreen';
import GameScreen from '../../src/screens/GameScreen';
import HomeScreen from '../../src/screens/HomeScreen';
import MarketScreen from '../../src/screens/MarketScreen';
import SettingsScreen from '../../src/screens/SettingsScreen';
import StatsScreen from '../../src/screens/StatsScreen';

export default function Index() {
  const [screen, setScreen] = useState('home');

  useEffect(() => {
    const backAction = () => {
      if (screen === 'home') {
        BackHandler.exitApp();
        return true;
      }
      if (screen === 'market' || screen === 'achievements' || screen === 'stats' || screen === 'settings') {
        setScreen('home');
        return true;
      }
      // Game screen handles its own back button
      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [screen]);

  if (screen === 'game') {
    return <GameScreen onHome={() => setScreen('home')} />;
  }

  if (screen === 'market') {
    return <MarketScreen onBack={() => setScreen('home')} />;
  }

  if (screen === 'achievements') {
    return <AchievementsScreen onBack={() => setScreen('home')} />;
  }

  if (screen === 'stats') {
    return <StatsScreen onBack={() => setScreen('home')} />;
  }

  if (screen === 'settings') {
    return <SettingsScreen onBack={() => setScreen('home')} />;
  }

  return (
    <HomeScreen
      onStartGame={() => setScreen('game')}
      onMarket={() => setScreen('market')}
      onAchievements={() => setScreen('achievements')}
      onStats={() => setScreen('stats')}
      onSettings={() => setScreen('settings')}
    />
  );
}
