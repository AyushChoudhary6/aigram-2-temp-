/**
 * FloatingNavbar – Premium bottom-center floating navigation
 *
 * Icon-only pills at fixed width, always expanded.
 * Active item gets a soft glow highlight.
 *
 * Features:
 *  • Glassmorphism backdrop-blur on web
 *  • Active-state glow independent of hover
 *  • Per-item hover highlight
 *  • Dark theme, rounded corners, soft shadow
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  Platform,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

/* ─── Tunables ───────────────────────────────────────────────── */

const NAVBAR_W = 220;  // Fixed width for icon-only display (4 items)

/* ─── Palette ────────────────────────────────────────────────── */

const C = {
  primary      : '#00D084',
  muted        : '#666666',
  surface      : 'rgba(18, 18, 18, 0.90)',
  border       : 'rgba(255, 255, 255, 0.08)',
  activeBg     : 'rgba(0, 208, 132, 0.12)',
  activeGlow   : 'rgba(0, 208, 132, 0.35)',
  hoverBg      : 'rgba(255, 255, 255, 0.05)',
  labelDefault : '#999999',
};

/* ─── Icon / label map per route ─────────────────────────────── */

type Ion = keyof typeof Ionicons.glyphMap;

interface TabMeta { icon: Ion; activeIcon: Ion; label: string }

const TAB_META: Record<string, TabMeta> = {
  Practice  : { icon: 'flame-outline',     activeIcon: 'flame',     label: 'Practice'    },
  AITools   : { icon: 'basket-outline',     activeIcon: 'basket',    label: 'Marketplace' },
  Home      : { icon: 'home-outline',       activeIcon: 'home',      label: 'Home'        },
  Profile   : { icon: 'person-outline',     activeIcon: 'person',    label: 'Profile'     },
};

const fallback: TabMeta = {
  icon:       'ellipsis-horizontal-outline' as Ion,
  activeIcon: 'ellipsis-horizontal'         as Ion,
  label:      '…',
};

/* ─── Helpers ────────────────────────────────────────────────── */

/** Merge web-only properties without TS errors on native */
const webOnly = (o: Record<string, any>) =>
  Platform.OS === 'web' ? o : {};

/* ─── Component ──────────────────────────────────────────────── */

const FloatingNavbar: React.FC<BottomTabBarProps> = ({ state, navigation }) => {
  /* Navbar is always at fixed width for icon-only display */
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();
  }, []);

  /* ── render ─────────────────────────────────────────────────── */
  return (
    /* Transparent full-height lane on the left – centres the pill vertically */
    <View style={styles.anchor} pointerEvents="box-none">
      <Animated.View style={[styles.pill, { width: NAVBAR_W, transform: [{ translateY: slideAnim }] }]}>
        {state.routes.map((route, idx) => {
          const focused = state.index === idx;
          const meta    = TAB_META[route.name] ?? { ...fallback, label: route.name };

          const scaleAnim = useRef(new Animated.Value(focused ? 1.2 : 1)).current;

          useEffect(() => {
            Animated.spring(scaleAnim, {
              toValue: focused ? 1.2 : 1,
              useNativeDriver: true,
              friction: 6,
              tension: 60,
            }).start();
          }, [focused]);

          const handlePress = () => {
            const ev = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !ev.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <Pressable
              key={route.key}
              onPress={handlePress}
              /* @ts-ignore – `hovered` exists in react-native-web */
              style={({ pressed, hovered }: any) => [
                styles.row,
                focused && styles.rowActive,
                !focused && hovered && styles.rowHover,
                pressed && !focused && styles.rowPressed,
              ]}
            >
              {/* Icon only – no label */}
              <Animated.View style={[styles.iconBox, { transform: [{ scale: scaleAnim }] }]}>
                <Ionicons
                  name={focused ? meta.activeIcon : meta.icon}
                  size={22}
                  color={focused ? C.primary : C.muted}
                />
              </Animated.View>
            </Pressable>
          );
        })}
      </Animated.View>
    </View>
  );
};

/* ─── Styles ─────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  /* Positioned at bottom-center – only wraps the pill, no extra space */
  anchor: {
    position: 'absolute',
    bottom: 18,
    left: 0,
    right: 0,
    alignItems: 'center',
    pointerEvents: 'box-none',
    zIndex: 9999,
  } as any,

  /* Glassmorphic pill container – horizontal layout, icon-only */
  pill: {
    minHeight: 60,
    flexDirection: 'row',
    backgroundColor: C.surface,
    borderRadius: 22,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
    /* Native shadow */
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 24,
    /* Web-only glassmorphism & cursor */
    ...webOnly({
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
      cursor: 'default',
    }),
  } as any,

  /* Single nav item row – icon-only, horizontal arrangement */
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginHorizontal: 2,
    minWidth: 44,
  } as any,

  /* Active-route highlight — glow persists regardless of hover */
  rowActive: {
    backgroundColor: C.activeBg,
    ...webOnly({
      boxShadow: `0 0 18px ${C.activeGlow}`,
    }),
    ...(Platform.OS !== 'web'
      ? {
          shadowColor: C.primary,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.35,
          shadowRadius: 14,
          elevation: 8,
        }
      : {}),
  } as any,

  /* Non-active item hover tint */
  rowHover: {
    backgroundColor: C.hoverBg,
  },

  /* Press feedback on non-active items */
  rowPressed: {
    opacity: 0.8,
  },

  /* Icon container */
  iconBox: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default FloatingNavbar;
