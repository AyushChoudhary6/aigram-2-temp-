import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Animated,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { authService } from '../../services/authService';
import { userService } from '../../services/userService';
import { User } from '../../types';
import FloatingElements from '../../components/auth/FloatingElements';

const { width, height } = Dimensions.get('window');

type AuthStep = "phone" | "otp" | "name";

interface AuthScreenProps {
  navigation: any;
  onAuthSuccess: (user: User) => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ navigation, onAuthSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [fullName, setFullName] = useState("");
  const [step, setStep] = useState<AuthStep>("phone");
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

  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, "");
    if (digits.startsWith("91")) {
      return `+${digits}`;
    } else if (digits.length === 10) {
      return `+91${digits}`;
    }
    return `+${digits}`;
  };

  const handleSendOTP = async () => {
    const formattedPhone = formatPhoneNumber(phone);
    
    if (!phone || phone.length === 0) {
      Alert.alert("Error", "Please enter a phone number");
      return;
    }

    if (phone.length < 10) {
      Alert.alert("Error", `Please enter a valid 10-digit phone number (${phone.length}/10 digits entered)`);
      return;
    }

    if (formattedPhone.length < 12) {
      Alert.alert("Error", "Please enter a valid phone number");
      return;
    }

    setLoading(true);

    try {
      const response = await authService.sendFirebasePhoneOtp(formattedPhone);

      if (response.success) {
        Alert.alert("Success", "OTP sent to your phone!");
        setStep("otp");
      } else {
        Alert.alert("Error", response.message);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      Alert.alert("Error", "Please enter the complete 6-digit code");
      return;
    }

    setLoading(true);

    try {
      const response = await authService.loginWithFirebasePhone(formatPhoneNumber(phone), otp);

      if (response.success && response.data) {
        if (!response.data.name || response.data.name === 'User' || !response.data.name.trim()) {
          setStep("name");
        } else {
          Alert.alert("Success", "Welcome back!");
          onAuthSuccess(response.data);
        }
      } else {
        Alert.alert("Error", response.message || "Invalid OTP");
        setOtp("");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to verify OTP. Please try again.");
      setOtp("");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveName = async () => {
    if (!fullName.trim()) {
      Alert.alert("Error", "Please enter your name");
      return;
    }

    setLoading(true);

    try {
      // User is already authenticated in Firebase from handleVerifyOTP
      const updateResponse = await userService.updateProfile({ name: fullName });
      // We can also retrieve the current user from authService
      const currentUser = authService.getCurrentUser();

      if (updateResponse.success && updateResponse.data) {
        Alert.alert("Success", "Welcome to AIgram!");
        onAuthSuccess(updateResponse.data);
      } else if (currentUser) {
        // Fallback if updateProfile backend fails but user exists
        const updatedUser = { ...currentUser, name: fullName };
        Alert.alert("Success", "Welcome to AIgram!");
        onAuthSuccess(updatedUser);
      } else {
        Alert.alert("Error", "Failed to save profile");
      }
    } catch (error) {
      // Even if API fails, try falling back to local Auth state
      const currentUser = authService.getCurrentUser();
      if (currentUser) {
        Alert.alert("Success", "Welcome to AIgram (Local Mode)");
        onAuthSuccess({ ...currentUser, name: fullName });
      } else {
        Alert.alert("Error", "Failed to save name. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setLoading(true);
    try {
      const response = await authService.authenticateAsGuest();
      if (response.success && response.data) {
        onAuthSuccess(response.data);
      } else {
        Alert.alert("Error", response.message);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to login as guest. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step === "otp") {
      setStep("phone");
      setOtp("");
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    
    try {
      const formattedPhone = formatPhoneNumber(phone);
      const response = await authService.sendFirebasePhoneOtp(formattedPhone);

      if (response.success) {
        Alert.alert("Success", "New OTP sent!");
      } else {
        Alert.alert("Error", response.message);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to resend OTP. Please try again.");
    } finally {
      setLoading(false);
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
                <Ionicons name="sparkles" size={10} color="#00D084" />
                <Text style={styles.logoSubtitleText}>FUTURE OF AI CONTENT</Text>
                <Ionicons name="sparkles" size={10} color="#00D084" />
              </View>
            </View>
          </View>
        </View>

        {/* Main Card */}
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

            {/* Back Button for OTP Step */}
            {step === "otp" && (
              <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                <Ionicons name="arrow-back" size={20} color="#8BA89B" />
              </TouchableOpacity>
            )}

            {/* Phone Step */}
            {step === "phone" && (
              <View style={styles.stepContainer}>
                <View style={styles.stepHeader}>
                  <View style={styles.stepIconContainer}>
                    <Ionicons name="call" size={32} color="#00D084" />
                  </View>
                  <Text style={styles.stepTitle}>Enter your phone number</Text>
                  <Text style={styles.stepSubtitle}>We'll send you a verification code</Text>
                </View>

                <View style={styles.inputSection}>
                  <View style={styles.phoneInputRow}>
                    <View style={styles.countryCodeContainer}>
                      <Text style={styles.countryCodeText}>+91</Text>
                    </View>
                    <TextInput
                      style={styles.phoneInput}
                      placeholder="10-digit mobile number"
                      placeholderTextColor="rgba(148, 163, 184, 0.6)"
                      value={phone}
                      onChangeText={(text) => setPhone(text.replace(/\D/g, "").slice(0, 10))}
                      keyboardType="phone-pad"
                      editable={!loading}
                      maxLength={10}
                    />
                  </View>

                  {phone.length > 0 && phone.length < 10 && (
                    <Text style={styles.helperText}>
                      {phone.length}/10 digits
                    </Text>
                  )}
                  
                  <TouchableOpacity
                    // style={[styles.primaryButton, (loading || phone.length !== 10) && styles.buttonDisabled]} // Original: disabled if phone length != 10
                    style={[styles.primaryButton, loading && styles.buttonDisabled]} // Updated: always enabled (only disabled during loading)
                    onPress={handleSendOTP}
                    disabled={loading}
                  >
                    <LinearGradient
                      colors={['#00D084', '#00B86B']}
                      style={styles.buttonGradient}
                    >
                      {loading ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <>
                          <Ionicons name="flash" size={20} color="white" />
                          <Text style={styles.primaryButtonText}>Send OTP</Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>

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
                  disabled={loading}
                >
                  <View style={styles.guestButtonContent}>
                    <Ionicons name="person" size={20} color="#00D084" />
                    <Text style={styles.guestButtonText}>Guest Mode</Text>
                  </View>
                </TouchableOpacity>
                
                <View style={styles.guestNote}>
                  <View style={styles.guestNoteDot} />
                  <Text style={styles.guestNoteText}>Explore AI Gram with limited features</Text>
                  <View style={styles.guestNoteDot} />
                </View>
              </View>
            )}

            {/* OTP Verification Step */}
            {step === "otp" && (
              <View style={styles.stepContainer}>
                <View style={styles.stepHeader}>
                  <View style={styles.stepIconContainer}>
                    <Ionicons name="star" size={32} color="#00D084" />
                  </View>
                  <Text style={styles.stepTitle}>Enter verification code</Text>
                  <Text style={styles.stepSubtitle}>
                    We sent a 6-digit code to{'\n'}
                    <Text style={styles.phoneHighlight}>+91 {phone}</Text>
                  </Text>
                </View>

                <View style={styles.otpContainer}>
                  <TextInput
                    style={styles.otpInputHidden}
                    value={otp}
                    onChangeText={(text) => {
                      const numericText = text.replace(/[^0-9]/g, '').slice(0, 6);
                      setOtp(numericText);
                    }}
                    keyboardType="numeric"
                    maxLength={6}
                    editable={!loading}
                    autoFocus={true}
                    caretHidden={true}
                  />
                  {[...Array(6)].map((_, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.otpInput,
                        otp.length > index && styles.otpInputFilled
                      ]}
                      onPress={() => {
                        // Focus the hidden input when any OTP box is pressed
                      }}
                    >
                      <Text style={styles.otpText}>
                        {otp[index] || ''}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.otpHintText}>ðŸ’¡ For testing, use OTP: 123456</Text>

                <TouchableOpacity
                  style={[styles.primaryButton, (loading || otp.length !== 6) && styles.buttonDisabled]}
                  onPress={handleVerifyOTP}
                  disabled={loading || otp.length !== 6}
                >
                  <LinearGradient
                    colors={['#00D084', '#00B86B']}
                    style={styles.buttonGradient}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <>
                        <Ionicons name="flash" size={20} color="white" />
                        <Text style={styles.primaryButtonText}>Verify & Continue</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleResendOTP}
                  disabled={loading}
                  style={styles.resendButton}
                >
                  <Text style={styles.resendButtonText}>
                    Didn't receive the code? <Text style={styles.resendButtonHighlight}>Resend</Text>
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Name Step */}
            {step === "name" && (
              <View style={styles.stepContainer}>
                <View style={styles.stepHeader}>
                  <View style={styles.stepIconContainer}>
                    <Ionicons name="person" size={32} color="#00D084" />
                  </View>
                  <Text style={styles.stepTitle}>Welcome to AI Gram!</Text>
                  <Text style={styles.stepSubtitle}>What should we call you?</Text>
                </View>

                <View style={styles.inputSection}>
                  <TextInput
                    style={styles.nameInput}
                    placeholder="Your name"
                    placeholderTextColor="rgba(148, 163, 184, 0.6)"
                    value={fullName}
                    onChangeText={setFullName}
                    editable={!loading}
                  />
                  
                  <TouchableOpacity
                    style={[styles.primaryButton, (loading || !fullName.trim()) && styles.buttonDisabled]}
                    onPress={handleSaveName}
                    disabled={loading || !fullName.trim()}
                  >
                    <LinearGradient
                      colors={['#00D084', '#00B86B']}
                      style={styles.buttonGradient}
                    >
                      {loading ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <>
                          <Ionicons name="star" size={20} color="white" />
                          <Text style={styles.primaryButtonText}>Let's Go!</Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </Animated.View>

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
        {/* Recaptcha Container for Firebase Web */}
        {Platform.OS === 'web' && (
          <View nativeID="recaptcha-container" style={{ display: 'none' }} />
        )}
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
    marginBottom: 32,
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
    backgroundColor: 'rgba(0, 208, 132, 0.15)',
    borderRadius: 60,
    opacity: 0.8,
  },
  logoIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 208, 132, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0, 208, 132, 0.3)',
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
    color: '#8BA89B',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    fontWeight: '500',
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
    backgroundColor: 'rgba(0, 208, 132, 0.2)',
    borderRadius: 28,
    opacity: 0.6,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 24,
    padding: 32,
    borderWidth: 1,
    borderColor: 'rgba(0, 208, 132, 0.2)',
    position: 'relative',
    backdropFilter: 'blur(20px)',
  },
  corner: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderColor: 'rgba(0, 208, 132, 0.4)',
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
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepContainer: {
    gap: 24,
  },
  stepHeader: {
    alignItems: 'center',
  },
  stepIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 208, 132, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0, 208, 132, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 8,
    textAlign: 'center',
  },
  stepSubtitle: {
    fontSize: 14,
    color: '#8BA89B',
    textAlign: 'center',
    lineHeight: 20,
  },
  inputSection: {
    gap: 16,
  },
  phoneInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  countryCodeContainer: {
    height: 56,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(0, 208, 132, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countryCodeText: {
    fontSize: 18,
    color: '#8BA89B',
    fontWeight: '500',
  },
  phoneInput: {
    flex: 1,
    height: 56,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(0, 208, 132, 0.2)',
    fontSize: 18,
    color: '#F8FAFC',
  },
  helperText: {
    fontSize: 12,
    color: '#8BA89B',
    marginTop: 4,
    marginLeft: 4,
  },
  nameInput: {
    height: 56,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(0, 208, 132, 0.2)',
    fontSize: 18,
    color: '#F8FAFC',
    textAlign: 'center',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(0, 208, 132, 0.3)',
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },
  otpInputFilled: {
    borderColor: '#00D084',
    backgroundColor: 'rgba(0, 208, 132, 0.1)',
  },
  otpInputHidden: {
    position: 'absolute',
    opacity: 0,
    zIndex: -1,
  },
  otpText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F8FAFC',
    textAlign: 'center',
    lineHeight: 56,
  },
  otpHintText: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
    color: '#FFA726',
    fontStyle: 'italic',
    fontWeight: '500',
  },
  primaryButton: {
    height: 48,
    borderRadius: 12,
    overflow: 'hidden',
  },
  buttonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
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
    backgroundColor: 'rgba(0, 208, 132, 0.2)',
  },
  dividerText: {
    fontSize: 12,
    color: '#8BA89B',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 208, 132, 0.1)',
  },
  guestButton: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 208, 132, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
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
  guestNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
  },
  guestNoteDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 208, 132, 0.5)',
  },
  guestNoteText: {
    fontSize: 12,
    color: '#8BA89B',
  },
  phoneHighlight: {
    color: '#00D084',
    fontWeight: '600',
  },
  resendButton: {
    alignItems: 'center',
    marginTop: 8,
  },
  resendButtonText: {
    fontSize: 14,
    color: '#8BA89B',
  },
  resendButtonHighlight: {
    color: '#00D084',
    fontWeight: '600',
  },
  bottomDecoration: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 24,
  },
  decorationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 208, 132, 0.3)',
  },
});

export default AuthScreen;


