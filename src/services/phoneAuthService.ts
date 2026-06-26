import {
  PhoneAuthProvider,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  signInWithCredential,
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { getFirebaseAuth } from './firebaseConfig';
import { Platform } from 'react-native';

declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier;
    confirmationResult: any;
  }
}

interface PhoneOtpResponse {
  verificationId?: string;
  confirmationResult?: any;
  success: boolean;
  message: string;
}

class PhoneAuthService {
  private verificationId: string | null = null;
  private confirmationResult: any = null;

  /**
   * Setup reCAPTCHA verifier (for web)
   */
  setupRecaptcha(): RecaptchaVerifier | null {
    console.log('🔐 setupRecaptcha called for platform:', Platform.OS);
    
    if (Platform.OS === 'web') {
      try {
        // Check if reCAPTCHA container exists in DOM
        const container = (document as any)?.getElementById?.('recaptcha-container');
        if (!container) {
          console.warn('⚠️ reCAPTCHA container not found in DOM');
          return null;
        }

        if (!window.recaptchaVerifier) {
          console.log('🔐 Creating new RecaptchaVerifier...');
          window.recaptchaVerifier = new RecaptchaVerifier(
            getFirebaseAuth(),
            'recaptcha-container',
            {
              size: 'invisible',
              callback: (response: string) => {
                console.log('✅ reCAPTCHA verified:', response);
              },
              'expired-callback': () => {
                console.log('⚠️ reCAPTCHA expired');
              },
            }
          );
          console.log('✅ RecaptchaVerifier created successfully');
        }
        return window.recaptchaVerifier;
      } catch (error) {
        console.error('❌ Error setting up reCAPTCHA:', error);
        return null;
      }
    }
    console.log('ℹ️ Skipping reCAPTCHA setup for non-web platform:', Platform.OS);
    return null;
  }

  /**
   * Send OTP to phone number
   * For React Native: Uses automatic SMS retrieval
   * For Web: Uses reCAPTCHA
   */
  async sendOtp(phoneNumber: string): Promise<PhoneOtpResponse> {
    try {
      // Validate phone number format
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      console.log('🔧 Formatted phone:', formattedPhone);
      console.log('🔧 Platform:', Platform.OS);
      console.log('🔧 Auth instance:', auth ? 'initialized' : 'not initialized');

      if (Platform.OS === 'web') {
        // Web implementation with reCAPTCHA
        console.log('🌐 Running on Web platform - attempting reCAPTCHA');
        const recaptcha = this.setupRecaptcha();
        
        if (!recaptcha) {
          console.warn('⚠️ reCAPTCHA not available, attempting without it...');
          // Try without reCAPTCHA as fallback
          try {
            console.log('🌐 Attempting signInWithPhoneNumber without reCAPTCHA');
            const confirmationResult = await signInWithPhoneNumber(
              getFirebaseAuth(),
              formattedPhone
            );
            this.confirmationResult = confirmationResult;
            window.confirmationResult = confirmationResult;
            console.log('✅ Web OTP sent successfully (fallback)');
            return {
              confirmationResult,
              success: true,
              message: 'OTP sent successfully',
            };
          } catch (fallbackError: any) {
            console.error('❌ Web OTP fallback error:', fallbackError.code, fallbackError.message);
            return {
              success: false,
              message: fallbackError.message || 'Failed to initialize reCAPTCHA and send OTP',
            };
          }
        }

        try {
          console.log('🌐 Sending OTP via web with reCAPTCHA...');
          const confirmationResult = await signInWithPhoneNumber(
            getFirebaseAuth(),
            formattedPhone,
            recaptcha
          );
          this.confirmationResult = confirmationResult;
          window.confirmationResult = confirmationResult;

          console.log('✅ Web OTP sent successfully');
          return {
            confirmationResult,
            success: true,
            message: 'OTP sent successfully',
          };
        } catch (error: any) {
          console.error('❌ Web OTP error:', error.code, error.message);
          return {
            success: false,
            message: error.message || 'Failed to send OTP',
          };
        }
      } else {
        // React Native implementation using PhoneAuthProvider
        console.log('📱 Running on ' + Platform.OS + ' platform - using PhoneAuthProvider');
        const phoneProvider = new PhoneAuthProvider(getFirebaseAuth());

        try {
          console.log('📱 Calling verifyPhoneNumber with:', formattedPhone);
          // For React Native, do NOT pass reCAPTCHA verifier
          const verificationId = await phoneProvider.verifyPhoneNumber(formattedPhone);
          this.verificationId = verificationId;

          console.log('✅ React Native OTP sent successfully, verificationId:', verificationId);
          return {
            verificationId,
            success: true,
            message: 'OTP sent successfully to ' + formattedPhone,
          };
        } catch (error: any) {
          console.error('❌ React Native OTP error:', error.code, error.message);
          console.error('📱 Full error:', error);
          return {
            success: false,
            message: error.message || 'Failed to send OTP. Check console for details.',
          };
        }
      }
    } catch (error: any) {
      console.error('❌ Error in sendOtp:', error);
      return {
        success: false,
        message: error.message || 'An unexpected error occurred',
      };
    }
  }

  /**
   * Verify OTP code
   */
  async verifyOtp(otp: string): Promise<{ success: boolean; message: string; userId?: string }> {
    try {
      if (Platform.OS === 'web') {
        // Web: Use confirmation result
        if (!this.confirmationResult && !window.confirmationResult) {
          return {
            success: false,
            message: 'No OTP request found. Please request a new OTP.',
          };
        }

        try {
          const result = await (this.confirmationResult || window.confirmationResult).confirm(otp);
          const userId = result.user.uid;

          return {
            success: true,
            message: 'OTP verified successfully',
            userId,
          };
        } catch (error: any) {
          console.error('Error verifying OTP:', error);
          return {
            success: false,
            message: error.message || 'Invalid OTP. Please try again.',
          };
        }
      } else {
        // React Native: Use verification ID
        if (!this.verificationId) {
          return {
            success: false,
            message: 'No OTP request found. Please request a new OTP.',
          };
        }

        try {
          const credential = PhoneAuthProvider.credential(this.verificationId, otp);
          const result = await signInWithCredential(getFirebaseAuth(), credential);
          const userId = result.user.uid;

          return {
            success: true,
            message: 'OTP verified successfully',
            userId,
          };
        } catch (error: any) {
          console.error('Error verifying OTP:', error);
          return {
            success: false,
            message: error.message || 'Invalid OTP. Please try again.',
          };
        }
      }
    } catch (error: any) {
      console.error('Error in verifyOtp:', error);
      return {
        success: false,
        message: error.message || 'An unexpected error occurred',
      };
    }
  }

  /**
   * Get or create reCAPTCHA verifier for React Native
   * Note: This is a placeholder. React Native apps typically don't use explicit reCAPTCHA
   */
  private getRecaptchaVerifier(): RecaptchaVerifier | any {
    // For React Native, return a mock verifier or null
    // Firebase will handle reCAPTCHA automatically for React Native
    return undefined;
  }

  /**
   * Format phone number to international format
   */
  private formatPhoneNumber(phoneNumber: string): string {
    // Remove any non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');

    // Check if it's a 10-digit number (India) or other formats
    if (cleaned.length === 10) {
      // Assuming Indian phone numbers (add country code +91)
      return '+91' + cleaned;
    } else if (cleaned.length === 12) {
      // Assuming number already has country code without +
      return '+' + cleaned;
    } else if (phoneNumber.startsWith('+')) {
      // Already in international format
      return phoneNumber;
    } else if (cleaned.length > 10) {
      // Has country code without +
      return '+' + cleaned;
    }

    // Default: return as is with + prefix
    return '+' + cleaned;
  }

  /**
   * Get current user
   */
  getCurrentUser() {
    return getFirebaseAuth().currentUser;
  }

  /**
   * Sign out
   */
  async signOut(): Promise<void> {
    try {
      await getFirebaseAuth().signOut();
      this.verificationId = null;
      this.confirmationResult = null;
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }

  /**
   * Check if user is already authenticated
   */
  isAuthenticated(): boolean {
    return getFirebaseAuth().currentUser !== null;
  }
}

export const phoneAuthService = new PhoneAuthService();
export default phoneAuthService;
