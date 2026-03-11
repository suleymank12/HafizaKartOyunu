import {
  Anchor, Apple, Axe, Baby, Banana, Battery, Bean,
  Bell, Bike, Bird, Bone, Book, Bot, Bug,
  Cake, Camera, Car, Carrot, Cat, Cherry, Cloud, Coffee,
  Compass, Cookie, Crown, CupSoda, Diamond, Dog, Drum, Egg,
  Eye, Fan, Feather, Fish, Flag, Flame, Flower, Ghost,
  Gift, Globe, Grape, Guitar, Hammer, Hand, HardHat, Heart,
  House, IceCreamCone, Joystick, Key, Lamp, Leaf, Lightbulb, Lock,
  Map, Megaphone, Moon, Mountain, Music, Nut, Palette, Pencil,
  Phone, Pizza, Plane, Plug, Puzzle, Rabbit, Rocket, Scissors,
  Shell, Ship, Snowflake, Star, Sun, Target,
  Tent, Train, TreePine, Trophy, Truck, Umbrella, Watch, Zap
} from 'lucide-react-native';
import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const ICON_MAP: Record<string, React.ComponentType<{ size: number; color: string; strokeWidth: number }>> = {
  anchor: Anchor, apple: Apple, axe: Axe, baby: Baby,
  banana: Banana, battery: Battery, bean: Bean,
  bell: Bell, bike: Bike, bird: Bird,
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
  shell: Shell, ship: Ship, snowflake: Snowflake,
  star: Star, sun: Sun, target: Target,
  tent: Tent, train: Train, tree: TreePine, trophy: Trophy,
  truck: Truck, umbrella: Umbrella, watch: Watch, zap: Zap,
};

export const ALL_ICON_NAMES = Object.keys(ICON_MAP);

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = Math.min(70, (SCREEN_WIDTH - 80) / 4 - 12);
const CARD_HEIGHT = CARD_WIDTH * 1.28;

type ThemeColors = {
  normal: string;
  matched: string;
};

type CardProps = {
  symbol: string;
  isFlipped: boolean;
  isMatched: boolean;
  onPress: () => void;
  themeColors?: ThemeColors;
};

const Card = ({ symbol, isFlipped, isMatched, onPress, themeColors }: CardProps) => {
  const normalColor = themeColors?.normal || '#00d4ff';
  const matchedColor = themeColors?.matched || '#00c864';

  const flipProgress = useSharedValue(0);
  const scaleAnim = useSharedValue(1);

  useEffect(() => {
    flipProgress.value = withTiming(isFlipped || isMatched ? 1 : 0, { duration: 300 });
  }, [isFlipped, isMatched]);

  useEffect(() => {
    if (isMatched) {
      scaleAnim.value = withSequence(
        withTiming(1.15, { duration: 150 }),
        withTiming(1, { duration: 150 }),
      );
    }
  }, [isMatched]);

  const frontAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flipProgress.value, [0, 1], [180, 360]);
    return {
      transform: [
        { perspective: 800 },
        { rotateY: `${rotateY}deg` },
        { scale: scaleAnim.value },
      ],
      backfaceVisibility: 'hidden' as const,
    };
  });

  const backAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flipProgress.value, [0, 1], [0, 180]);
    return {
      transform: [
        { perspective: 800 },
        { rotateY: `${rotateY}deg` },
        { scale: scaleAnim.value },
      ],
      backfaceVisibility: 'hidden' as const,
    };
  });

  const IconComponent = ICON_MAP[symbol];

  return (
    <View style={styles.cardWrapper}>
      <TouchableOpacity
        onPress={onPress}
        disabled={isFlipped || isMatched}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={isFlipped || isMatched ? symbol : 'Kapalı kart'}
        accessibilityHint="Kartı çevirmek için dokunun"
        accessibilityState={{ disabled: isFlipped || isMatched }}
      >
        {/* Arka yüz (?) */}
        <Animated.View
          style={[
            styles.card,
            styles.cardClosed,
            styles.cardAbsolute,
            backAnimatedStyle,
          ]}
        >
          <Text style={styles.questionMark}>?</Text>
        </Animated.View>

        {/* Ön yüz (icon) */}
        <Animated.View
          style={[
            styles.card,
            isMatched
              ? [styles.cardMatched, { borderColor: matchedColor, backgroundColor: `${matchedColor}22` }]
              : [styles.cardFlipped, { borderColor: normalColor }],
            frontAnimatedStyle,
          ]}
        >
          {IconComponent && (
            <IconComponent
              size={32}
              color={isMatched ? matchedColor : normalColor}
              strokeWidth={2}
            />
          )}
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    margin: 6,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardAbsolute: {
    position: 'absolute',
    top: 0,
    left: 0,
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

export default React.memo(Card);
