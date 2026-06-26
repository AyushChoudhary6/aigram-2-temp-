import * as React from 'react';
import { useState } from 'react';
import { View, Platform, TouchableOpacity, StyleSheet, StyleProp, ViewStyle } from 'react-native';

interface SpotlightCardProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  spotlightColor?: string;
  onPress?: () => void;
}

export default function SpotlightCard({
  children,
  style,
  spotlightColor = 'rgba(255, 255, 255, 0.25)',
  onPress
}: SpotlightCardProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: any) => {
    if (Platform.OS === 'web' && e.nativeEvent) {
      if (e.nativeEvent.offsetX !== undefined) {
        setPosition({
          x: e.nativeEvent.offsetX,
          y: e.nativeEvent.offsetY,
        });
      } else if (e.nativeEvent.locationX !== undefined) {
        setPosition({
          x: e.nativeEvent.locationX,
          y: e.nativeEvent.locationY,
        });
      }
    }
  };

  const handleHoverIn = () => setOpacity(0.6);
  const handleHoverOut = () => setOpacity(0);

  const isWeb = Platform.OS === 'web';

  const Content = (
    <View
      style={[
        styles.container,
        style,
        isWeb && { overflow: 'hidden' }
      ]}
      // @ts-ignore - these properties work perfectly in React Native Web
      onMouseMove={isWeb ? handleMouseMove : undefined}
      onMouseEnter={isWeb ? handleHoverIn : undefined}
      onMouseLeave={isWeb ? handleHoverOut : undefined}
    >
      {/* Background Gradient Layer for Web */}
      {isWeb && (
        <View
          style={[
            StyleSheet.absoluteFillObject,
            {
              opacity,
              pointerEvents: 'none',
              // @ts-ignore - valid prop for React Native Web css extraction
              transition: 'opacity 0.5s ease-in-out',
              backgroundImage: `radial-gradient(circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 80%)`,
            }
          ]}
        />
      )}
      
      {children}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
        {Content}
      </TouchableOpacity>
    );
  }

  return Content;
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
    // We add base styles, but let the `style` prop override layout/sizing
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#262626',
    backgroundColor: '#0B0B0B',
  },
});

