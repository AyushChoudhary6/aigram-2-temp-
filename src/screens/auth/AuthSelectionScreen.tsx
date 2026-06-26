import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { User } from '../../types';
import FloatingElements from '../../components/auth/FloatingElements';
import { authService } from '../../services/authService';

const { width, height } = Dimensions.get('window');

interface AuthSelectionScreenProps {
  navigation: any;
  onAuthSuccess: (user: User) => void;
}

const AuthSelectionScreen: React.FC<AuthSelectionScreenProps> = ({ navigation, onAuthSuccess }) => {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.9));

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = async () => {
      const user = await authService.loadUserFromStorage();
      if (user && await authService.isAuthenticated()) {
        onAuthSuccess(user);
      }
    };
    checkAuth();

    // Animate entrance
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleGuestLogin = async () => {
    try {
      const response = await authService.authenticateAsGuest();
      if (response.success && response.data) {
        onAuthSuccess(response.data);
      } else {
        Alert.alert("Error", response.message || "Failed to login as guest");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to login as guest. Please try again.");
      console.error('Guest login failed:', error);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0B0B" />
      
      {/* Floating Background Elements */}
      <FloatingElements />
      
      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <View style={styles.logoContainer}>
            <View style={styles.logoGlow} />
            <View style={styles.logoIconContainer}>
              <Ionicons name="bulb-outline" size={32} color="#00D084" />
            </View>
            <View style={styles.logoTextContainer}>
              <Text style={styles.logoTitle}>AI Gram</Text>
              <View style={styles.logoSubtitle}>
                <Ionicons name="star" size={10} color="#00D084" />
                <Text style={styles.logoSubtitleText}>FUTURE OF AI CONTENT</Text>
                <Ionicons name="star" size={10} color="#00D084" />
              </View>
            </View>
          </View>
        </View>

        {/* Welcome Text */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Welcome to the Future</Text>
          <Text style={styles.welcomeSubtitle}>
            Join thousands of creators and learners in the AI revolution
          </Text>
        </View>

        {/* Auth Options Card */}
        <Animated.View style={styles.cardContainer}>
          {/* Card Glow Effect */}
          <View style={styles.cardGlow} />
          
          {/* Main Card */}
          <View style={styles.card}>
            {/* Decorative Corners */}
            <View style={[styles.corner, styles.cornerTopLeft]} />
            <View style={[styles.corner, styles.cornerTopRight]} />
            <View style={[styles.corner, styles.cornerBottomLeft]} />
            <View style={[styles.corner, styles.cornerBottomRight]} />

            <View style={styles.authOptionsContainer}>
              {/* Login Button */}
              <TouchableOpacity
                style={styles.authOption}
                onPress={() => navigation.navigate('Login')}
              >
                <LinearGradient
                  colors={['#00D084', '#00B86B']}
                  style={styles.authOptionGradient}
                >
                  <View style={styles.authOptionContent}>
                    <Ionicons name="log-in-outline" size={24} color="white" />
                    <View style={styles.authOptionTextContainer}>
                      <Text style={styles.authOptionTitle}>Login</Text>
                      <Text style={styles.authOptionSubtitle}>Welcome back!</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="white" />
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              {/* Signup Button */}
              <TouchableOpacity
                style={styles.authOption}
                onPress={() => navigation.navigate('Register')}
              >
                <View style={styles.authOptionBorder}>
                  <View style={styles.authOptionContent}>
                    <Ionicons name="person-add-outline" size={24} color="#00D084" />
                    <View style={styles.authOptionTextContainer}>
                      <Text style={styles.authOptionTitleSecondary}>Sign Up</Text>
                      <Text style={styles.authOptionSubtitleSecondary}>Join the community</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#00D084" />
                  </View>
                </View>
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR EXPLORE AS</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Guest Mode Button */}
              <TouchableOpacity
                style={styles.guestButton}
                onPress={handleGuestLogin}
              >
                <View style={styles.guestButtonContent}>
                  <Ionicons name="person" size={20} color="#00D084" />
                  <Text style={styles.guestButtonText}>Guest Mode</Text>
                  <View style={styles.guestBadge}>
                    <Text style={styles.guestBadgeText}>LIMITED</Text>
                  </View>
                </View>
              </TouchableOpacity>
              
              <View style={styles.guestNote}>
                <View style={styles.guestNoteDot} />
                <Text style={styles.guestNoteText}>Explore AI Gram with limited features</Text>
                <View style={styles.guestNoteDot} />
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Bottom Features */}
        <View style={styles.featuresSection}>
          <View style={styles.featureItem}>
            <Ionicons name="videocam" size={16} color="#00D084" />
            <Text style={styles.featureText}>AI-Powered Videos</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="code-slash" size={16} color="#00D084" />
            <Text style={styles.featureText}>Practice Coding</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="bulb" size={16} color="#00D084" />
            <Text style={styles.featureText}>AI Tools</Text>
          </View>
        </View>

        {/* Bottom Decoration */}
        <View style={styles.bottomDecoration}>
          {[...Array(5)].map((_, i) => (
            <Animated.View
              key={i}
              style={[
                styles.decorationDot,
                {
                  opacity: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.3, 1],
                  }),
                }
              ]}
            />
          ))}
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0B0B',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    justifyContent: 'center',
    paddingTop: 60,
    paddingBottom: 40,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoContainer: {
    alignItems: 'center',
    position: 'relative',
  },
  logoGlow: {
    position: 'absolute',
    top: -30,
    left: -30,
    right: -30,
    bottom: -30,
    backgroundColor: 'rgba(0, 208, 132, 0.12)',
    borderRadius: 60,
    opacity: 0.8,
  },
  logoIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 208, 132, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0, 208, 132, 0.20)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logoTextContainer: {
    alignItems: 'center',
  },
  logoTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#00D084',
    marginBottom: 4,
    textAlign: 'center',
  },
  logoSubtitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  logoSubtitleText: {
    fontSize: 10,
    color: '#888888',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    fontWeight: '500',
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#999999',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  cardContainer: {
    position: 'relative',
    marginBottom: 24,
  },
  cardGlow: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    backgroundColor: 'rgba(0, 208, 132, 0.15)',
    borderRadius: 28,
    opacity: 0.6,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    padding: 32,
    borderWidth: 1,
    borderColor: 'rgba(0, 208, 132, 0.15)',
    position: 'relative',
    backdropFilter: 'blur(20px)',
  },
  corner: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderColor: 'rgba(0, 208, 132, 0.25)',
    borderWidth: 2,
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 24,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 24,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 24,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 24,
  },
  authOptionsContainer: {
    gap: 16,
  },
  authOption: {
    height: 64,
    borderRadius: 16,
    overflow: 'hidden',
  },
  authOptionGradient: {
    flex: 1,
    justifyContent: 'center',
  },
  authOptionBorder: {
    flex: 1,
    borderWidth: 2,
    borderColor: 'rgba(0, 208, 132, 0.20)',
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    justifyContent: 'center',
  },
  authOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 16,
  },
  authOptionTextContainer: {
    flex: 1,
  },
  authOptionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 2,
  },
  authOptionTitleSecondary: {
    fontSize: 18,
    fontWeight: '600',
    color: '#00D084',
    marginBottom: 2,
  },
  authOptionSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  authOptionSubtitleSecondary: {
    fontSize: 14,
    color: '#888888',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(0, 208, 132, 0.15)',
  },
  dividerText: {
    fontSize: 12,
    color: '#888888',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 208, 132, 0.08)',
  },
  guestButton: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 208, 132, 0.20)',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    overflow: 'hidden',
  },
  guestButtonContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  guestButtonText: {
    color: '#00D084',
    fontSize: 16,
    fontWeight: '600',
  },
  guestBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  guestBadgeText: {
    fontSize: 10,
    color: '#EF4444',
    fontWeight: '600',
  },
  guestNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  guestNoteDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 208, 132, 0.35)',
  },
  guestNoteText: {
    fontSize: 12,
    color: '#888888',
  },
  featuresSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  featureItem: {
    alignItems: 'center',
    gap: 4,
  },
  featureText: {
    fontSize: 12,
    color: '#888888',
    textAlign: 'center',
  },
  bottomDecoration: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  decorationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 208, 132, 0.20)',
  },
});

export default AuthSelectionScreen;

