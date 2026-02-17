import {
  Anchor, Apple, Axe, Baby, Banana, Battery, Bean, Beer,
  Bell, Bike, Bird, Bomb, Bone, Book, Bot, Bug,
  Cake, Camera, Car, Carrot, Cat, Cherry, Cloud, Coffee,
  Compass, Cookie, Crown, CupSoda, Diamond, Dog, Drum, Egg,
  Eye, Fan, Feather, Fish, Flag, Flame, Flower, Ghost,
  Gift, Globe, Grape, Guitar, Hammer, Hand, HardHat, Heart,
  House, IceCreamCone, Joystick, Key, Lamp, Leaf, Lightbulb, Lock,
  Map, Megaphone, Moon, Mountain, Music, Nut, Palette, Pencil,
  Phone, Pizza, Plane, Plug, Puzzle, Rabbit, Rocket, Scissors,
  Shell, Ship, Skull, Snowflake, Star, Sun, Sword, Target,
  Tent, Train, TreePine, Trophy, Truck, Umbrella, Watch, Zap
} from 'lucide-react-native';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, TouchableOpacity } from 'react-native';

const ICON_MAP: Record<string, any> = {
  anchor: Anchor, apple: Apple, axe: Axe, baby: Baby,
  banana: Banana, battery: Battery, bean: Bean, beer: Beer,
  bell: Bell, bike: Bike, bird: Bird, bomb: Bomb,
  bone: Bone, book: Book, bot: Bot, bug: Bug,
  cake: Cake, camera: Camera, car: Car, carrot: Carrot,
  cat: Cat, cherry: Cherry, cloud: Cloud, coffee: Coffee,
  compass: Compass, cookie: Cookie, crown: Crown, cup: CupSoda,
  diamond: Diamond, dog: Dog, drum: Drum, egg: Egg,
  eye: Eye, fan: Fan, feather: Feather, fish: Fish,
  flag: Flag, flame: Flame, flower: Flower, ghost: Ghost,
  gift: Gift, globe: Globe, grape: Grape, guitar: Guitar,
  hammer: Hammer, hand: Hand, hat: HardHat, heart: Heart,
  house: House, icecream: IceCreamCone, joystick: Joystick, key: Key,
  lamp: Lamp, leaf: Leaf, lightbulb: Lightbulb, lock: Lock,
  map: Map, megaphone: Megaphone, moon: Moon, mountain: Mountain,
  music: Music, nut: Nut, palette: Palette, pencil: Pencil,
  phone: Phone, pizza: Pizza, plane: Plane, plug: Plug,
  puzzle: Puzzle, rabbit: Rabbit, rocket: Rocket, scissors: Scissors,
  shell: Shell, ship: Ship, skull: Skull, snowflake: Snowflake,
  star: Star, sun: Sun, sword: Sword, target: Target,
  tent: Tent, train: Train, tree: TreePine, trophy: Trophy,
  truck: Truck, umbrella: Umbrella, watch: Watch, zap: Zap,
};

export const ALL_ICON_NAMES = Object.keys(ICON_MAP);

type CardProps = {
  symbol: string;
  isFlipped: boolean;
  isMatched: boolean;
  onPress: () => void;
};

const Card = ({ symbol, isFlipped, isMatched, onPress }: CardProps) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isMatched) {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.15,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isMatched]);

  const IconComponent = ICON_MAP[symbol];

  const renderContent = () => {
    if ((isFlipped || isMatched) && IconComponent) {
      return (
        <IconComponent
          size={32}
          color={isMatched ? '#00c864' : '#00d4ff'}
          strokeWidth={2}
        />
      );
    }
    return (
      <Animated.Text style={styles.questionMark}>?</Animated.Text>
    );
  };

  return (
    <Animated.View
      style={[
        styles.cardWrapper,
        { transform: [{ scale: scaleAnim }] },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.card,
          isMatched ? styles.cardMatched :
          isFlipped ? styles.cardFlipped :
          styles.cardClosed
        ]}
        onPress={onPress}
        disabled={isFlipped || isMatched}
        activeOpacity={0.7}
      >
        {renderContent()}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    margin: 6,
  },
  card: {
    width: 70,
    height: 90,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardClosed: {
    backgroundColor: '#1a1a3e',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  cardFlipped: {
    backgroundColor: '#1a1a2e',
    borderWidth: 2,
    borderColor: '#00d4ff',
  },
  cardMatched: {
    backgroundColor: 'rgba(0,200,100,0.15)',
    borderWidth: 2,
    borderColor: '#00c864',
    opacity: 0.7,
  },
  questionMark: {
    fontSize: 28,
    color: '#ffffff',
    fontWeight: 'bold',
  },
});

export default Card;