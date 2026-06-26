import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AppContext';
import { CoinPackage, PaymentCreateResponse, Payment } from '../types';
import { paymentService } from '../services/paymentService';

interface PaymentModalProps {
  visible: boolean;
  onClose: () => void;
  selectedPackage: CoinPackage | null;
  onPaymentSuccess?: (payment: Payment) => void;
  onPaymentFailure?: (error: string) => void;
}

// Razorpay integration
interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: any) => void;
  prefill: {
    name: string;
    email?: string;
    contact: string;
  };
  theme: {
    color: string;
  };
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function PaymentModal({
  visible,
  onClose,
  selectedPackage,
  onPaymentSuccess,
  onPaymentFailure,
}: PaymentModalProps) {
  const { user, isGuestUser } = useAuth();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'review' | 'processing' | 'success' | 'failed'>('review');
  const [paymentData, setPaymentData] = useState<PaymentCreateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible && selectedPackage) {
      setPaymentStep('review');
      setError(null);
      setPaymentData(null);
    }
  }, [visible, selectedPackage]);

  const createPaymentOrder = async (): Promise<PaymentCreateResponse | null> => {
    try {
      if (!selectedPackage || !user) return null;

      // Create payment order via backend API
      const response = await paymentService.createPayment({
        userId: user.userId,
        packageId: selectedPackage.id,
        amount: selectedPackage.price,
        currency: selectedPackage.currency,
        paymentMethod: 'razorpay',
      });

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(response.message || 'Failed to create payment order');
    } catch (error: any) {
      console.error('Error creating payment order:', error);
      throw new Error(error.message || 'Failed to create payment order');
    }
  };

  const initializeRazorpay = (paymentData: PaymentCreateResponse) => {
    if (!selectedPackage || !user) return;

    const options: RazorpayOptions = {
      key: 'rzp_test_1234567890', // Your Razorpay key
      amount: paymentData.amount * 100, // Amount in paise
      currency: paymentData.currency,
      name: 'AIgram',
      description: `${selectedPackage.name} - ${selectedPackage.coins} coins`,
      order_id: paymentData.razorpayOrderId,
      handler: handlePaymentSuccess,
      prefill: {
        name: user.name,
        contact: user.phoneNumber,
      },
      theme: {
        color: '#00D084',
      },
    };

    // In production, use the actual Razorpay SDK
    // For React Native, use react-native-razorpay or similar
    if (typeof window !== 'undefined' && window.Razorpay) {
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', handlePaymentFailure);
      rzp.open();
    } else {
      // Fallback for environments without Razorpay SDK
      console.warn('Razorpay SDK not available, please integrate react-native-razorpay');
      handlePaymentFailure({ description: 'Razorpay SDK not available. Please install react-native-razorpay.' });
    }
  };

  const handlePaymentSuccess = async (response: any) => {
    try {
      if (!paymentData || !selectedPackage || !user) return;

      setPaymentStep('processing');

      // Verify payment with the backend
      const verifyResponse = await paymentService.handlePaymentSuccess({
        paymentId: paymentData.paymentId,
        userId: user.userId,
        amount: paymentData.amount,
        razorpayPaymentId: response.razorpay_payment_id,
        razorpayOrderId: response.razorpay_order_id,
        razorpaySignature: response.razorpay_signature,
      });

      if (verifyResponse.success) {
        const payment: Payment = {
          paymentId: paymentData.paymentId,
          userId: user.userId,
          amount: paymentData.amount,
          currency: paymentData.currency,
          status: 'SUCCESS',
          packageId: selectedPackage.id,
          paymentMethod: 'razorpay',
          razorpayPaymentId: response.razorpay_payment_id,
          razorpayOrderId: response.razorpay_order_id,
          createdAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
        };

        setPaymentStep('success');
        onPaymentSuccess?.(payment);

        // Auto-close after success
        setTimeout(() => {
          onClose();
        }, 3000);
      } else {
        throw new Error(verifyResponse.message || 'Payment verification failed');
      }

    } catch (error: any) {
      console.error('Payment verification failed:', error);
      setError(error.message || 'Payment verification failed');
      setPaymentStep('failed');
      onPaymentFailure?.(error.message || 'Payment verification failed');
    }
  };

  const handlePaymentFailure = (error: any) => {
    console.error('Payment failed:', error);
    setError(error.description || 'Payment failed');
    setPaymentStep('failed');
    onPaymentFailure?.(error.description || 'Payment failed');
  };

  const handleProceedToPayment = async () => {
    try {
      if (!selectedPackage || isGuestUser()) return;

      setIsProcessing(true);
      setError(null);

      const paymentOrder = await createPaymentOrder();
      if (!paymentOrder) {
        throw new Error('Failed to create payment order');
      }

      setPaymentData(paymentOrder);
      setPaymentStep('processing');
      
      // Initialize Razorpay
      initializeRazorpay(paymentOrder);

    } catch (error: any) {
      console.error('Payment initialization failed:', error);
      setError(error.message || 'Payment initialization failed');
      setPaymentStep('failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetry = () => {
    setPaymentStep('review');
    setError(null);
    setPaymentData(null);
  };

  const renderReviewStep = () => {
    if (!selectedPackage) return null;

    return (
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Package Details */}
        <View style={styles.packageSection}>
          <Text style={styles.sectionTitle}>Package Details</Text>
          <View style={styles.packageCard}>
            <View style={styles.packageHeader}>
              <Ionicons name="diamond" size={24} color="#ffc107" />
              <Text style={styles.packageName}>{selectedPackage.name}</Text>
            </View>
            <Text style={styles.packageDescription}>{selectedPackage.description}</Text>
            <View style={styles.packageDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Coins:</Text>
                <Text style={styles.detailValue}>{selectedPackage.coins.toLocaleString()}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Price:</Text>
                <Text style={styles.detailValue}>â‚¹{selectedPackage.price}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Rate:</Text>
                <Text style={styles.detailValue}>â‚¹{(selectedPackage.price / selectedPackage.coins).toFixed(2)} per coin</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Payment Summary */}
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>Payment Summary</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal:</Text>
              <Text style={styles.summaryValue}>â‚¹{selectedPackage.price}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Taxes & Fees:</Text>
              <Text style={styles.summaryValue}>â‚¹0</Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalValue}>â‚¹{selectedPackage.price}</Text>
            </View>
          </View>
        </View>

        {/* Payment Methods */}
        <View style={styles.methodsSection}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <View style={styles.methodCard}>
            <View style={styles.methodHeader}>
              <Ionicons name="card" size={20} color="#00D084" />
              <Text style={styles.methodName}>Razorpay</Text>
              <View style={styles.secureBadge}>
                <Ionicons name="shield-checkmark" size={12} color="#28a745" />
                <Text style={styles.secureText}>Secure</Text>
              </View>
            </View>
            <Text style={styles.methodDescription}>
              Pay securely with credit/debit cards, UPI, net banking, and wallets
            </Text>
          </View>
        </View>

        {/* Terms */}
        <View style={styles.termsSection}>
          <Text style={styles.termsText}>
            By proceeding, you agree to our Terms of Service and Privacy Policy. 
            Coins will be added to your account immediately after successful payment.
          </Text>
        </View>
      </ScrollView>
    );
  };

  const renderProcessingStep = () => (
    <View style={styles.centerContent}>
      <ActivityIndicator size="large" color="#00D084" />
      <Text style={styles.processingTitle}>Processing Payment</Text>
      <Text style={styles.processingText}>
        Please wait while we process your payment securely...
      </Text>
    </View>
  );

  const renderSuccessStep = () => (
    <View style={styles.centerContent}>
      <View style={styles.successIcon}>
        <Ionicons name="checkmark-circle" size={64} color="#28a745" />
      </View>
      <Text style={styles.successTitle}>Payment Successful!</Text>
      <Text style={styles.successText}>
        {selectedPackage?.coins.toLocaleString()} coins have been added to your account
      </Text>
      <View style={styles.successDetails}>
        <Text style={styles.successDetailText}>
          Transaction ID: {paymentData?.paymentId}
        </Text>
      </View>
    </View>
  );

  const renderFailedStep = () => (
    <View style={styles.centerContent}>
      <View style={styles.errorIcon}>
        <Ionicons name="close-circle" size={64} color="#dc3545" />
      </View>
      <Text style={styles.errorTitle}>Payment Failed</Text>
      <Text style={styles.errorText}>
        {error || 'Something went wrong with your payment. Please try again.'}
      </Text>
      <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  const renderContent = () => {
    switch (paymentStep) {
      case 'review':
        return renderReviewStep();
      case 'processing':
        return renderProcessingStep();
      case 'success':
        return renderSuccessStep();
      case 'failed':
        return renderFailedStep();
      default:
        return renderReviewStep();
    }
  };

  const renderFooter = () => {
    if (paymentStep !== 'review') return null;

    return (
      <View style={styles.footer}>
        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.payButton, isProcessing && styles.payButtonDisabled]}
          onPress={handleProceedToPayment}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Ionicons name="card" size={16} color="white" />
              <Text style={styles.payButtonText}>
                Pay â‚¹{selectedPackage?.price}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  if (!selectedPackage) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {paymentStep === 'review' ? 'Complete Payment' :
             paymentStep === 'processing' ? 'Processing...' :
             paymentStep === 'success' ? 'Success!' : 'Payment Failed'}
          </Text>
          {paymentStep === 'review' && (
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#555555" />
            </TouchableOpacity>
          )}
        </View>

        {/* Content */}
        <View style={styles.body}>
          {renderContent()}
        </View>

        {/* Footer */}
        {renderFooter()}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#161616',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#E8F5E8',
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E8F5E8',
  },
  closeButton: {
    padding: 8,
  },
  body: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E8F5E8',
    marginBottom: 12,
  },
  packageSection: {
    marginTop: 16,
    marginBottom: 24,
  },
  packageCard: {
    backgroundColor: '#E8F5E8',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  packageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  packageName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E8F5E8',
    marginLeft: 8,
  },
  packageDescription: {
    fontSize: 14,
    color: '#555555',
    marginBottom: 16,
  },
  packageDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#555555',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E8F5E8',
  },
  summarySection: {
    marginBottom: 24,
  },
  summaryCard: {
    backgroundColor: '#E8F5E8',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#555555',
  },
  summaryValue: {
    fontSize: 14,
    color: '#E8F5E8',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#1A1A1A',
    paddingTop: 12,
    marginTop: 8,
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E8F5E8',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E8F5E8',
  },
  methodsSection: {
    marginBottom: 24,
  },
  methodCard: {
    backgroundColor: '#E8F5E8',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  methodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  methodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E8F5E8',
    marginLeft: 8,
    flex: 1,
  },
  secureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(40, 167, 69, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  secureText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#28a745',
    marginLeft: 4,
  },
  methodDescription: {
    fontSize: 12,
    color: '#555555',
    lineHeight: 16,
  },
  termsSection: {
    marginBottom: 24,
  },
  termsText: {
    fontSize: 12,
    color: '#555555',
    lineHeight: 18,
    textAlign: 'center',
  },
  processingTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#E8F5E8',
    marginTop: 16,
    marginBottom: 8,
  },
  processingText: {
    fontSize: 14,
    color: '#555555',
    textAlign: 'center',
    lineHeight: 20,
  },
  successIcon: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#28a745',
    marginBottom: 8,
  },
  successText: {
    fontSize: 16,
    color: '#E8F5E8',
    textAlign: 'center',
    marginBottom: 16,
  },
  successDetails: {
    backgroundColor: 'rgba(40, 167, 69, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  successDetailText: {
    fontSize: 12,
    color: '#28a745',
    fontFamily: 'monospace',
  },
  errorIcon: {
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#dc3545',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#E8F5E8',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: '#00D084',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#E8F5E8',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#E8F5E8',
    borderTopWidth: 1,
    borderTopColor: '#1A1A1A',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#555555',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555555',
  },
  payButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#00D084',
    gap: 8,
  },
  payButtonDisabled: {
    backgroundColor: '#555555',
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E8F5E8',
  },
});

