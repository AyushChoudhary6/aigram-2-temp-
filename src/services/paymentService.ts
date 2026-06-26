import { apiService } from './api';
import { 
  ApiResponse, 
  CoinPackage, 
  PaymentCreateRequest, 
  PaymentCreateResponse, 
  Payment, 
  PaymentSuccessRequest, 
  PaymentFailureRequest,
  PaginatedResponse 
} from '../types';

class PaymentService {
  private readonly BASE_PATH = '/payments';

  /**
   * Get available coin packages
   */
  async getPackages(): Promise<ApiResponse<CoinPackage[]>> {
    try {
      return await apiService.get<CoinPackage[]>(`${this.BASE_PATH}/packages`);
    } catch (error) {
      console.error('Failed to get packages:', error);
      throw error;
    }
  }

  /**
   * Create a new payment
   */
  async createPayment(data: PaymentCreateRequest): Promise<ApiResponse<PaymentCreateResponse>> {
    try {
      return await apiService.post<PaymentCreateResponse>(`${this.BASE_PATH}/create`, data);
    } catch (error) {
      console.error('Failed to create payment:', error);
      throw error;
    }
  }

  /**
   * Handle successful payment
   */
  async handlePaymentSuccess(data: PaymentSuccessRequest): Promise<ApiResponse<any>> {
    try {
      return await apiService.post(`${this.BASE_PATH}/success`, data);
    } catch (error) {
      console.error('Failed to handle payment success:', error);
      throw error;
    }
  }

  /**
   * Handle failed payment
   */
  async handlePaymentFailure(data: PaymentFailureRequest): Promise<ApiResponse<any>> {
    try {
      return await apiService.post(`${this.BASE_PATH}/failure`, data);
    } catch (error) {
      console.error('Failed to handle payment failure:', error);
      throw error;
    }
  }

  /**
   * Get payment status by ID
   */
  async getPaymentStatus(paymentId: string): Promise<ApiResponse<Payment>> {
    try {
      return await apiService.get<Payment>(`${this.BASE_PATH}/${paymentId}/status`);
    } catch (error) {
      console.error('Failed to get payment status:', error);
      throw error;
    }
  }

  /**
   * Get payment history for current user
   */
  async getPaymentHistory(page: number = 0, size: number = 20): Promise<ApiResponse<PaginatedResponse<Payment>>> {
    try {
      const queryString = apiService.buildQueryString({ page, size });
      const url = `${this.BASE_PATH}/history${queryString}`;
      return await apiService.get<PaginatedResponse<Payment>>(url);
    } catch (error) {
      console.error('Failed to get payment history:', error);
      throw error;
    }
  }

  /**
   * Get payment by ID
   */
  async getPaymentById(paymentId: string): Promise<ApiResponse<Payment>> {
    try {
      return await apiService.get<Payment>(`${this.BASE_PATH}/${paymentId}`);
    } catch (error) {
      console.error('Failed to get payment:', error);
      throw error;
    }
  }

  /**
   * Cancel a pending payment
   */
  async cancelPayment(paymentId: string): Promise<ApiResponse<any>> {
    try {
      return await apiService.post(`${this.BASE_PATH}/${paymentId}/cancel`);
    } catch (error) {
      console.error('Failed to cancel payment:', error);
      throw error;
    }
  }

  /**
   * Verify payment signature (for Razorpay)
   */
  async verifyPaymentSignature(
    paymentId: string,
    orderId: string,
    signature: string
  ): Promise<ApiResponse<{ isValid: boolean }>> {
    try {
      return await apiService.post(`${this.BASE_PATH}/verify-signature`, {
        paymentId,
        orderId,
        signature
      });
    } catch (error) {
      console.error('Failed to verify payment signature:', error);
      throw error;
    }
  }

  /**
   * Get payment statistics (admin only)
   */
  async getPaymentStatistics(): Promise<ApiResponse<{
    totalPayments: number;
    totalRevenue: number;
    successRate: number;
    averageAmount: number;
  }>> {
    try {
      return await apiService.get(`${this.BASE_PATH}/admin/statistics`);
    } catch (error) {
      console.error('Failed to get payment statistics:', error);
      throw error;
    }
  }
}

export const paymentService = new PaymentService();
export default paymentService;
