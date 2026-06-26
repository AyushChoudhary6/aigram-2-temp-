// AI Gram Theme Configuration
// Glassmorphism dark theme with emerald accents

export const COLORS = {
  // Background colors
  background: '#0B0B0B',
  foreground: '#E8F5E8',
  
  // Card colors – glassmorphism
  card: 'rgba(255, 255, 255, 0.06)',
  cardSolid: '#161616',
  cardForeground: '#E8F5E8',
  
  // Primary colors (Emerald)
  primary: '#00D084',
  primaryForeground: '#0B0B0B',
  
  // Secondary colors
  secondary: 'rgba(255, 255, 255, 0.08)',
  secondaryForeground: '#E8F5E8',
  
  // Muted colors
  muted: 'rgba(255, 255, 255, 0.05)',
  mutedForeground: '#9CA3AF',
  
  // Accent colors
  accent: '#00D084',
  accentForeground: '#0B0B0B',
  
  // Border and input colors
  border: 'rgba(255, 255, 255, 0.10)',
  input: 'rgba(255, 255, 255, 0.06)',
  ring: '#00D084',
  
  // Status colors
  destructive: '#EF4444',
  destructiveForeground: '#E8F5E8',
  
  // Gradient colors
  gradientStart: '#00D084',
  gradientMiddle: '#00C878',
  gradientEnd: '#00B86B',
  
  // Glow and shadow colors
  glowPrimary: 'rgba(0, 208, 132, 0.4)',
  glowStrong: 'rgba(0, 208, 132, 0.6)',
  shadowCard: 'rgba(0, 0, 0, 0.5)',
  shadowDock: 'rgba(0, 0, 0, 0.8)',
  
  // Floating elements colors
  floatingElement: 'rgba(0, 208, 132, 0.3)',
  
  // Glass morphism
  glassBg: 'rgba(255, 255, 255, 0.05)',
  glassBgLight: 'rgba(255, 255, 255, 0.08)',
  glassBgStrong: 'rgba(255, 255, 255, 0.12)',
  glassBlur: 'rgba(0, 208, 132, 0.06)',
  glassBorder: 'rgba(255, 255, 255, 0.10)',
  glassBorderLight: 'rgba(255, 255, 255, 0.06)',
  glassBorderStrong: 'rgba(0, 208, 132, 0.20)',
};

export const GRADIENTS = {
  primary: ['#00D084', '#00C878', '#00B86B'],
  card: ['rgba(255, 255, 255, 0.06)', 'rgba(255, 255, 255, 0.03)'],
  glow: ['rgba(0, 208, 132, 0.15)', 'transparent'],
  emerald: ['#00D084', '#22C55E', '#00B86B'],
  button: ['#00D084', '#10B981'],
  background: ['#0B0B0B', '#111111', '#0B0B0B'],
};

export const SHADOWS = {
  glow: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 25,
    elevation: 25,
  },
  glowStrong: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 50,
    elevation: 50,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 32,
    elevation: 32,
  },
  glass: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  dock: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.8,
    shadowRadius: 40,
    elevation: 40,
  },
};

export const TYPOGRAPHY = {
  fontSizes: {
    xs: 10,
    sm: 12,
    base: 14,
    lg: 16,
    xl: 18,
    '2xl': 20,
    '3xl': 24,
    '4xl': 32,
    '5xl': 40,
  },
  fontWeights: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
};

export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  '3xl': 32,
  full: 9999,
};

export const ANIMATIONS = {
  duration: {
    fast: 200,
    normal: 300,
    slow: 500,
  },
  easing: {
    easeInOut: 'ease-in-out',
    easeOut: 'ease-out',
    easeIn: 'ease-in',
  },
};

// Glassmorphism style helpers
import { Platform } from 'react-native';
const webBlur = (px = 20) => Platform.OS === 'web' ? { backdropFilter: `blur(${px}px)`, WebkitBackdropFilter: `blur(${px}px)` } : {};

export const GLASS = {
  card: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    borderRadius: BORDER_RADIUS['2xl'],
    ...SHADOWS.glass,
    ...webBlur(20),
  },
  surface: {
    backgroundColor: COLORS.glassBgLight,
    borderWidth: 1,
    borderColor: COLORS.glassBorderLight,
    borderRadius: BORDER_RADIUS.xl,
    ...webBlur(16),
  },
  panel: {
    backgroundColor: COLORS.glassBgStrong,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    borderRadius: BORDER_RADIUS['2xl'],
    ...SHADOWS.card,
    ...webBlur(24),
  },
  input: {
    backgroundColor: COLORS.input,
    borderWidth: 1,
    borderColor: COLORS.glassBorderLight,
    borderRadius: BORDER_RADIUS.lg,
    ...webBlur(12),
  },
};

// Theme object for easy access
export const THEME = {
  colors: COLORS,
  gradients: GRADIENTS,
  shadows: SHADOWS,
  typography: TYPOGRAPHY,
  spacing: SPACING,
  borderRadius: BORDER_RADIUS,
  animations: ANIMATIONS,
  glass: GLASS,
};

export default THEME;
