import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authService } from '../../services/authService';
import { User } from '../../types';

interface OtpVerificationScreenProps {
  navigation: any;
  route: any;
  onAuthSuccess: (user: User) => void;
}

const OtpVerificationScreen: React.FC<OtpVerificationScreenProps> = ({ 
  navigation, 
  route, 
  onAuthSuccess 
}) => {
  const { phoneNumber, name, type } = route.params;
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      Alert.alert('Error', 'Please enter the OTP');
      return;
    }

    setIsLoading(true);
    try {
      let response;
      if (type === 'register') {
        response = await authService.verifyRegistration(phoneNumber, otp, name);
      } else {
        response = await authService.verifyLogin(phoneNumber, otp);
      }

      if (response.success && response.data) {
        onAuthSuccess(response.data);
      } else {
        Alert.alert('Error', response.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to verify OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setIsLoading(true);
    try {
      const response = type === 'register' 
        ? await authService.sendRegistrationOtp(phoneNumber)
        : await authService.sendLoginOtp(phoneNumber);
      
      if (response.success) {
        Alert.alert('Success', 'OTP sent successfully');
      } else {
        Alert.alert('Error', response.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to resend OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Verify OTP</Text>
        <Text style={styles.subtitle}>
          Enter the 6-digit code sent to {phoneNumber}
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Enter OTP"
          value={otp}
          onChangeText={setOtp}
          keyboardType="numeric"
          maxLength={6}
          editable={!isLoading}
        />

        <Text style={styles.hintText}>💡 For testing, use OTP: 123456</Text>

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleVerifyOtp}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Verify OTP</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={handleResendOtp}
          disabled={isLoading}
        >
          <Text style={styles.linkText}>Resend OTP</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => navigation.goBack()}
          disabled={isLoading}
        >
          <Text style={styles.linkText}>Back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0B0B',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#E8F5E8',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
    color: '#888888',
  },
  hintText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    color: '#F59E0B',
    fontStyle: 'italic',
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
    borderRadius: 14,
    padding: 15,
    fontSize: 20,
    marginBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    textAlign: 'center',
    letterSpacing: 5,
    color: '#E8F5E8',
  },
  button: {
    backgroundColor: '#00D084',
    borderRadius: 14,
    padding: 15,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    color: '#0B0B0B',
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    alignItems: 'center',
    marginBottom: 10,
  },
  linkText: {
    color: '#00D084',
    fontSize: 16,
  },
});

export default OtpVerificationScreen;
