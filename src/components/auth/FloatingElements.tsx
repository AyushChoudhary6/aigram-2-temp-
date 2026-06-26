import * as React from 'react';
import { useEffect, useRef } from 'react';
import { View, Animated, Dimensions, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';

const { width, height } = Dimensions.get('window');

interface FloatingElementProps {
  icon: keyof typeof Ionicons.glyphMap;
  size: number;
  initialX: number;
  initialY: number;
  animationDelay: number;
}

const FloatingElement: React.FC<FloatingElementProps> = ({
  icon,
  size,
  initialX,
  initialY,
  animationDelay,
}: FloatingElementProps) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const startAnimation = () => {
      // Floating animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(translateY, {
            toValue: -20,
            duration: 3000 + Math.random() * 2000,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: 20,
            duration: 3000 + Math.random() * 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Rotation animation
      Animated.loop(
        Animated.timing(rotate, {
          toValue: 1,
          duration: 8000 + Math.random() * 4000,
          useNativeDriver: true,
        })
      ).start();

      // Opacity pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 0.6,
            duration: 2000 + Math.random() * 1000,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.2,
            duration: 2000 + Math.random() * 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    const timer = setTimeout(startAnimation, animationDelay);
    return () => clearTimeout(timer);
  }, [translateY, rotate, opacity, animationDelay]);

  const rotateInterpolate = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={[
        styles.floatingElement,
        {
          left: initialX,
          top: initialY,
          transform: [
            { translateY },
            { rotate: rotateInterpolate },
          ],
          opacity,
        },
      ]}
    >
      <Ionicons name={icon} size={size} color={COLORS.floatingElement} />
    </Animated.View>
  );
};

export const FloatingElements: React.FC = () => {
  const elements = [
    {
      icon: 'star-outline' as keyof typeof Ionicons.glyphMap,
      size: 16,
      initialX: width * 0.1,
      initialY: height * 0.15,
      animationDelay: 0,
    },
    {
      icon: 'flash-outline' as keyof typeof Ionicons.glyphMap,
      size: 20,
      initialX: width * 0.85,
      initialY: height * 0.2,
      animationDelay: 500,
    },
    {
      icon: 'star' as keyof typeof Ionicons.glyphMap,
      size: 14,
      initialX: width * 0.2,
      initialY: height * 0.7,
      animationDelay: 1000,
    },
    {
      icon: 'planet-outline' as keyof typeof Ionicons.glyphMap,
      size: 18,
      initialX: width * 0.8,
      initialY: height * 0.75,
      animationDelay: 1500,
    },
    {
      icon: 'star-half-outline' as keyof typeof Ionicons.glyphMap,
      size: 12,
      initialX: width * 0.05,
      initialY: height * 0.45,
      animationDelay: 2000,
    },
    {
      icon: 'flash' as keyof typeof Ionicons.glyphMap,
      size: 16,
      initialX: width * 0.9,
      initialY: height * 0.5,
      animationDelay: 2500,
    },
    {
      icon: 'star' as keyof typeof Ionicons.glyphMap,
      size: 22,
      initialX: width * 0.15,
      initialY: height * 0.85,
      animationDelay: 3000,
    },
    {
      icon: 'infinite-outline' as keyof typeof Ionicons.glyphMap,
      size: 14,
      initialX: width * 0.75,
      initialY: height * 0.1,
      animationDelay: 3500,
    },
  ];

  return (
    <View style={styles.container}>
      {elements.map((element, index) => (
        <FloatingElement
          key={index}
          icon={element.icon}
          size={element.size}
          initialX={element.initialX}
          initialY={element.initialY}
          animationDelay={element.animationDelay}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
    pointerEvents: 'none',
  },
  floatingElement: {
    position: 'absolute',
    zIndex: -1,
    pointerEvents: 'none',
  },
});

export default FloatingElements;
