import React, { useState } from 'react';
import GameScreen from '../../src/screens/GameScreen';
import HomeScreen from '../../src/screens/HomeScreen';

export default function Index() {
  const [screen, setScreen] = useState('home');

  if (screen === 'game') {
    return <GameScreen onHome={() => setScreen('home')} />;
  }

  return <HomeScreen onStartGame={() => setScreen('game')} />;
}