import axios, { AxiosInstance, AxiosResponse } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { ApiResponse, ApiError, LoginRequest, LoginResponse, PaginationParams } from '@/types/api';

// Platform-specific storage helpers
const getSecureItem = async (key: string): Promise<string | null> => {
  if (Platform.OS === 'web') {
    return localStorage.getItem(key);
  }
  return await SecureStore.getItemAsync(key);
};

const setSecureItem = async (key: string, value: string): Promise<void> => {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
  } else {
    await SecureStore.setItemAsync(key, value);
  }
};

const deleteSecureItem = async (key: string): Promise<void> => {
  if (Platform.OS === 'web') {
    localStorage.removeItem(key);
  } else {
    await SecureStore.deleteItemAsync(key);
  }
};

class ApiService {
  private api: AxiosInstance;
  private isRefreshing = false;
  private refreshSubscribers: Array<(token: string) => void> = [];

  constructor() {
    // Handle CORS for web platform
    const getApiUrl = () => {
      const baseApiUrl = 'https://yogrind.shop/api';
      
      if (Platform.OS === 'web') {
        const isDevelopment = process.env.EXPO_PUBLIC_APP_ENV === 'development';
        
        if (isDevelopment) {
          // For development, we'll use a CORS proxy
          // You can also set up your own proxy server
          console.log('🌐 Using CORS proxy for development');
          return `https://cors-anywhere.herokuapp.com/${baseApiUrl}`;
        }
        
        // For production web, the server should have proper CORS headers
        return baseApiUrl;
      }
      
      // For mobile platforms, use direct API URL (no CORS issues)
      return baseApiUrl;
    };

    const baseURL = getApiUrl();
    console.log('🌐 API Base URL:', baseURL);
    console.log('🔧 Platform:', Platform.OS);
    console.log('🏗️ Environment:', process.env.EXPO_PUBLIC_APP_ENV);

    this.api = axios.create({
      baseURL,
      timeout: 60000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-API-Version': process.env.EXPO_PUBLIC_API_VERSION || 'v1',
        'X-Mobile-App': 'NextApp-AutoParts-Mobile',
        'X-App-Version': process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0',
        'X-Platform': Platform.OS,
        'X-Requested-With': 'XMLHttpRequest',
      },
      // Don't use withCredentials for CORS compatibility
      withCredentials: false,
    });

    this.setupInterceptors();
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupInterceptors() {
    // Request interceptor
    this.api.interceptors.request.use(
      async (config) => {
        // Add unique request ID for tracking
        config.headers['X-Request-ID'] = this.generateRequestId();
        
        // Add authentication token
        const token = await getSecureItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Add device information
        config.headers['X-Device-Platform'] = Platform.OS;
        config.headers['X-App-Environment'] = process.env.EXPO_PUBLIC_APP_ENV || 'production';

        console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
        console.log('📋 Headers:', {
          'Content-Type': config.headers['Content-Type'],
          'Authorization': config.headers.Authorization ? 'Bearer [TOKEN]' : 'None',
          'X-API-Version': config.headers['X-API-Version'],
          'X-Mobile-App': config.headers['X-Mobile-App'],
        });
        
        return config;
      },
      (error) => {
        console.error('❌ Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        console.log(`✅ API Response: ${response.status} ${response.config.url}`);
        console.log('📦 Response Data Structure:', {
          hasData: 'data' in response.data,
          hasNestedData: response.data?.data !== undefined,
          keys: Object.keys(response.data || {}),
        });
        return response;
      },
      async (error) => {
        console.error('❌ API Error Details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          url: error.config?.url,
          method: error.config?.method,
          message: error.message,
          code: error.code,
          data: error.response?.data
        });

        const originalRequest = error.config;

        // Handle specific CORS and network errors
        if (error.code === 'ERR_NETWORK' || 
            error.message.includes('CORS') || 
            error.message.includes('Network Error') ||
            error.message.includes('ERR_FAILED')) {
          
          console.error('🚫 Network/CORS Error Detected');
          
          // If we're on web and in development, suggest solutions
          if (Platform.OS === 'web') {
            return Promise.reject(this.handleError({
              ...error,
              response: {
                status: 0,
                data: {
                  error: 'Connection failed. This appears to be a network or CORS issue.',
                  details: [
                    'If you\'re in development, try using the mobile app instead of web.',
                    'For production, ensure the server has proper CORS headers configured.',
                    'Check your internet connection and try again.',
                    'The server might be temporarily unavailable.'
                  ]
                }
              }
            }));
          }
          
          return Promise.reject(this.handleError({
            ...error,
            response: {
              status: 0,
              data: {
                error: 'Network connection failed. Please check your internet connection.',
                details: ['Unable to connect to the server']
              }
            }
          }));
        }

        // Handle 401 errors with token refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            return new Promise((resolve) => {
              this.refreshSubscribers.push((token: string) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                resolve(this.api(originalRequest));
              });
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const newToken = await this.refreshToken();
            this.processRefreshQueue(newToken);
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return this.api(originalRequest);
          } catch (refreshError) {
            this.processRefreshQueue(null);
            await this.logout();
            throw refreshError;
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(this.handleError(error));
      }
    );
  }

  private async refreshToken(): Promise<string> {
    try {
      const refreshToken = await getSecureItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await axios.post(
        `${this.api.defaults.baseURL}/auth/refresh`,
        { refreshToken },
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Mobile-App': 'NextApp-AutoParts-Mobile',
            'X-Requested-With': 'XMLHttpRequest',
          },
          withCredentials: false,
        }
      );

      const { token, refreshToken: newRefreshToken } = response.data.data || response.data;
      
      await setSecureItem('authToken', token);
      if (newRefreshToken) {
        await setSecureItem('refreshToken', newRefreshToken);
      }

      return token;
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      await this.logout();
      throw error;
    }
  }

  private processRefreshQueue(token: string | null) {
    this.refreshSubscribers.forEach((callback) => {
      if (token) {
        callback(token);
      }
    });
    this.refreshSubscribers = [];
  }

  private handleError(error: any): ApiError {
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const data = error.response.data;
      
      switch (status) {
        case 400:
          return {
            error: data?.error || 'Invalid request. Please check your input and try again.',
            details: data?.details || ['Bad request'],
            status,
          };
        case 401:
          return {
            error: 'Authentication required. Please log in again.',
            details: ['Your session has expired'],
            status,
          };
        case 403:
          return {
            error: 'Access denied. You don\'t have permission to perform this action.',
            details: ['Insufficient permissions'],
            status,
          };
        case 404:
          return {
            error: 'The requested resource was not found.',
            details: ['Resource not found'],
            status,
          };
        case 429:
          return {
            error: 'Too many requests. Please wait a moment and try again.',
            details: ['Rate limit exceeded'],
            status,
          };
        case 500:
          return {
            error: 'Server error. Please try again later.',
            details: ['Internal server error'],
            status,
          };
        default:
          return {
            error: data?.error || `Server error (${status})`,
            details: data?.details || [`HTTP ${status} error`],
            status,
          };
      }
    } else if (error.request) {
      // Request was made but no response received
      if (error.code === 'ERR_NETWORK' || 
          error.message.includes('CORS') || 
          error.message.includes('ERR_FAILED')) {
        
        if (Platform.OS === 'web') {
          return {
            error: 'Connection failed due to CORS or network issues.',
            details: [
              'This is likely a Cross-Origin Resource Sharing (CORS) issue.',
              'Try using the mobile app for better compatibility.',
              'In development, consider using a CORS proxy.',
              'For production, ensure the server has proper CORS headers.'
            ],
            status: 0,
          };
        }
        
        return {
          error: 'Network connection failed.',
          details: ['Please check your internet connection and try again.'],
          status: 0,
        };
      }
      
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        return {
          error: 'Request timed out. Please check your internet connection.',
          details: ['Connection timeout'],
          status: 0,
        };
      }
      
      return {
        error: 'Network error. Please check your internet connection and try again.',
        details: ['Network connectivity issue'],
        status: 0,
      };
    } else {
      // Something else happened
      return {
        error: 'An unexpected error occurred. Please try again.',
        details: [error.message || 'Unknown error'],
        status: -1,
      };
    }
  }

  // Helper method to extract data from response based on structure
  private extractResponseData(response: any) {
    // Check if response has nested data structure (response.data.data)
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      return response.data.data;
    }
    // Otherwise return direct data (response.data)
    return response.data;
  }

  // Authentication endpoints
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      console.log('🔐 Attempting login for:', credentials.email);
      const response = await this.api.post('/auth/login', credentials);
      
      // Handle both response structures: direct data or nested data
      const responseData = this.extractResponseData(response);
      console.log('📦 Login Response Data:', responseData);
      
      // Extract user and token from the response
      const { user, token, refreshToken, expiresIn } = responseData;
      
      if (!user || !token) {
        throw new Error('Invalid response structure: missing user or token');
      }
      
      // Store authentication data securely
      await setSecureItem('authToken', token);
      await setSecureItem('user', JSON.stringify(user));
      
      if (refreshToken) {
        await setSecureItem('refreshToken', refreshToken);
      }
      
      console.log('✅ Login successful for user:', user.name);
      return { user, token, refreshToken, expiresIn };
    } catch (error) {
      console.error('❌ Login failed:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      console.log('🚪 Logging out...');
      // Try to logout on server (don't wait for response)
      this.api.post('/auth/logout').catch(() => {
        // Ignore errors during logout
      });
    } finally {
      // Always clear local data
      await deleteSecureItem('authToken');
      await deleteSecureItem('refreshToken');
      await deleteSecureItem('user');
      console.log('✅ Logout complete');
    }
  }

  async getProfile() {
    const response = await this.api.get('/auth/profile');
    return this.extractResponseData(response);
  }

  async changePassword(currentPassword: string, newPassword: string) {
    const response = await this.api.post('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return this.extractResponseData(response);
  }

  // Parts management
  async getParts(params?: PaginationParams) {
    const response = await this.api.get('/parts', { params });
    return this.extractResponseData(response);
  }

  async getPart(partNumber: string) {
    const response = await this.api.get(`/parts/${partNumber}`);
    return this.extractResponseData(response);
  }

  async updatePartStock(partNumber: string, quantity: number, operation: 'add' | 'subtract' | 'set') {
    const response = await this.api.patch(`/parts/${partNumber}/stock`, {
      quantity,
      operation,
    });
    return this.extractResponseData(response);
  }

  async getPartCategories() {
    const response = await this.api.get('/parts/meta/categories');
    return this.extractResponseData(response);
  }

  async getFocusGroups() {
    const response = await this.api.get('/parts/meta/focus-groups');
    return this.extractResponseData(response);
  }

  async getLowStockParts() {
    const response = await this.api.get('/parts/alerts/low-stock');
    return this.extractResponseData(response);
  }

  // Order management - Updated to handle new API response structure
  async getOrders(params?: PaginationParams) {
    const response = await this.api.get('/orders', { params });
    const data = this.extractResponseData(response);
    
    // Transform the API response to match our interface
    if (data && Array.isArray(data.orders || data)) {
      const orders = data.orders || data;
      const transformedOrders = orders.map((order: any) => ({
        ...order,
        // Map API fields to our interface
        id: order.Order_Id,
        orderNumber: order.CRMOrderId,
        retailerId: order.Retailer_Id,
        status: order.Order_Status,
        totalAmount: this.calculateOrderTotal(order), // Calculate from items or use mock data
        orderDate: new Date(order.Place_Date).toISOString(),
        deliveryDate: order.Delivered_Date ? new Date(order.Delivered_Date).toISOString() : undefined,
        notes: order.Remark,
        urgent: order.Urgent_Status === 1,
        branch: order.Branch_Name,
        retailer: {
          businessName: order.Retailer_Name,
          contactName: order.Contact_Person !== '0' ? order.Contact_Person : undefined,
        },
        items: [], // Items would come from a separate API call
      }));
      
      return {
        ...data,
        data: transformedOrders,
        orders: transformedOrders,
      };
    }
    
    return data;
  }

  async getOrder(id: number) {
    const response = await this.api.get(`/orders/${id}`);
    const data = this.extractResponseData(response);
    
    // Transform single order response
    if (data) {
      return {
        ...data,
        id: data.Order_Id,
        orderNumber: data.CRMOrderId,
        retailerId: data.Retailer_Id,
        status: data.Order_Status,
        totalAmount: this.calculateOrderTotal(data),
        orderDate: new Date(data.Place_Date).toISOString(),
        deliveryDate: data.Delivered_Date ? new Date(data.Delivered_Date).toISOString() : undefined,
        notes: data.Remark,
        urgent: data.Urgent_Status === 1,
        branch: data.Branch_Name,
        retailer: {
          businessName: data.Retailer_Name,
          contactName: data.Contact_Person !== '0' ? data.Contact_Person : undefined,
        },
        items: [], // Items would come from a separate API call
      };
    }
    
    return data;
  }

  // Helper method to calculate order total (mock implementation)
  private calculateOrderTotal(order: any): number {
    // In a real implementation, this would sum up the order items
    // For now, return a mock value based on order ID
    return Math.floor(Math.random() * 5000) + 100;
  }

  async createOrder(orderData: any) {
    // Format the order data to match the exact backend API format
    const formattedOrderData = {
      retailer_id: orderData.retailer_id,
      branch: orderData.branch, // Include branch in the order data
      po_number: orderData.po_number || 'Mobile Order',
      po_date: orderData.po_date || new Date().toISOString(),
      urgent: orderData.urgent || false,
      remark: orderData.remark || orderData.notes || '',
      items: orderData.items.map((item: any) => ({
        part_number: item.part_number,
        part_name: item.part_name || item.partName || 'Unknown Part',
        quantity: item.quantity,
        mrp: item.unitPrice || item.mrp,
        basic_discount: item.basic_discount || 0,
        scheme_discount: item.scheme_discount || 0,
        additional_discount: item.additional_discount || 0,
        urgent: item.urgent || false,
      })),
    };

    console.log('📤 Creating order with formatted data:', JSON.stringify(formattedOrderData, null, 2));
    
    const response = await this.api.post('/orders', formattedOrderData);
    return this.extractResponseData(response);
  }

  async updateOrderStatus(id: number, status: string, notes?: string) {
    const response = await this.api.patch(`/orders/${id}/status`, { 
      status,
      notes: notes || `Status updated to ${status} via mobile app`
    });
    return this.extractResponseData(response);
  }

  async getOrderStats() {
    const response = await this.api.get('/orders/stats/summary');
    return this.extractResponseData(response);
  }

  // Retailer management
  async getRetailers(params?: PaginationParams) {
    const response = await this.api.get('/retailers', { params });
    return this.extractResponseData(response);
  }

  async getRetailer(id: number) {
    const response = await this.api.get(`/retailers/${id}`);
    return this.extractResponseData(response);
  }

  async createRetailer(retailerData: any) {
    const response = await this.api.post('/retailers', retailerData);
    return this.extractResponseData(response);
  }

  async updateRetailer(id: number, retailerData: any) {
    const response = await this.api.put(`/retailers/${id}`, retailerData);
    return this.extractResponseData(response);
  }

  async confirmRetailer(id: number) {
    const response = await this.api.patch(`/retailers/${id}/confirm`);
    return this.extractResponseData(response);
  }

  async updateRetailerStatus(id: number, status: string) {
    const response = await this.api.patch(`/retailers/${id}/status`, { status });
    return this.extractResponseData(response);
  }

  async getRetailerStats() {
    const response = await this.api.get('/retailers/stats/summary');
    return this.extractResponseData(response);
  }

  // Store management - Updated to use the correct API endpoint
  async getStores(params?: PaginationParams) {
    try {
      console.log('🏪 Fetching all stores with params:', params);
      const response = await this.api.get('/stores', { params });
      
      console.log('🏪 All Stores API response:', JSON.stringify(response.data, null, 2));
      
      // Return the direct response as the API already provides the correct structure
      const responseData = response.data;
      
      if (responseData && responseData.stores && Array.isArray(responseData.stores)) {
        console.log(`✅ Found ${responseData.stores.length} stores`);
        return responseData;
      } else {
        console.log('⚠️ No stores found or invalid response structure');
        return { 
          stores: [], 
          pagination: { page: 1, limit: 50, total: 0, pages: 0 } 
        };
      }
    } catch (error) {
      console.error('❌ Failed to fetch stores:', error);
      throw error;
    }
  }

  async getStore(branchCode: string) {
    const response = await this.api.get(`/stores/${branchCode}`);
    return this.extractResponseData(response);
  }

  // New method to get stores by company using the provided API endpoint
  async getStoresByCompany(companyId: string, params?: PaginationParams) {
    try {
      console.log('🏢 Fetching stores for company:', companyId);
      
      // Use the provided API endpoint format
      const response = await this.api.get('/stores', { 
        params: { 
          company_id: companyId,
          ...params 
        } 
      });
      
      console.log('🏪 Stores API response:', JSON.stringify(response.data, null, 2));
      
      // The API returns the complete response with stores array and pagination
      // Don't extract nested data, return the full response as it's already in the correct format
      const responseData = response.data;
      
      // Validate the response structure
      if (responseData && responseData.stores && Array.isArray(responseData.stores)) {
        console.log(`✅ Found ${responseData.stores.length} stores for company ${companyId}`);
        return responseData; // Return the complete response with stores and pagination
      } else {
        console.log('⚠️ No stores found or invalid response structure');
        return { 
          stores: [], 
          pagination: { page: 1, limit: 50, total: 0, pages: 0 } 
        };
      }
    } catch (error) {
      console.error('❌ Failed to fetch stores by company:', error);
      throw error;
    }
  }

  // Inventory management (item-status)
  async getItemStatus(params?: PaginationParams) {
    const response = await this.api.get('/item-status', { params });
    return this.extractResponseData(response);
  }

  async getItemStatusForPart(branchCode: string, partNo: string) {
    const response = await this.api.get(`/item-status/${branchCode}/${partNo}`);
    return this.extractResponseData(response);
  }

  async updateItemStock(branchCode: string, partNo: string, quantity: number, operation: string) {
    const response = await this.api.patch(`/item-status/${branchCode}/${partNo}/stock`, {
      quantity,
      operation,
    });
    return this.extractResponseData(response);
  }

  async updateRackLocation(branchCode: string, partNo: string, rackLocation: string) {
    const response = await this.api.patch(`/item-status/${branchCode}/${partNo}/rack`, {
      rackLocation,
    });
    return this.extractResponseData(response);
  }

  async recordSale(branchCode: string, partNo: string, saleData: any) {
    const response = await this.api.post(`/item-status/${branchCode}/${partNo}/sale`, saleData);
    return this.extractResponseData(response);
  }

  async recordPurchase(branchCode: string, partNo: string, purchaseData: any) {
    const response = await this.api.post(`/item-status/${branchCode}/${partNo}/purchase`, purchaseData);
    return this.extractResponseData(response);
  }

  async getLowStockItems() {
    const response = await this.api.get('/item-status/alerts/low-stock');
    return this.extractResponseData(response);
  }

  async getItemStatusStats(branchCode: string) {
    const response = await this.api.get(`/item-status/stats/${branchCode}`);
    return this.extractResponseData(response);
  }

  // Reporting endpoints
  async getOrderReport(params?: any) {
    const response = await this.api.get('/reports/orders', { params });
    return this.extractResponseData(response);
  }

  async getInventoryReport(params?: any) {
    const response = await this.api.get('/reports/inventory', { params });
    return this.extractResponseData(response);
  }

  async getSalesReport(params?: any) {
    const response = await this.api.get('/reports/sales', { params });
    return this.extractResponseData(response);
  }

  async getRetailerReport(params?: any) {
    const response = await this.api.get('/reports/retailers', { params });
    return this.extractResponseData(response);
  }

  // User management
  async getUsers(params?: PaginationParams) {
    const response = await this.api.get('/users', { params });
    return this.extractResponseData(response);
  }

  async getUser(id: number) {
    const response = await this.api.get(`/users/${id}`);
    return this.extractResponseData(response);
  }

  async createUser(userData: any) {
    const response = await this.api.post('/users', userData);
    return this.extractResponseData(response);
  }

  async updateUser(id: number, userData: any) {
    const response = await this.api.put(`/users/${id}`, userData);
    return this.extractResponseData(response);
  }

  async updateUserStatus(id: number, status: string) {
    const response = await this.api.patch(`/users/${id}/status`, { status });
    return this.extractResponseData(response);
  }

  async getUserStats() {
    const response = await this.api.get('/users/stats/summary');
    return this.extractResponseData(response);
  }

  // Company management
  async getCompanies(params?: PaginationParams) {
    const response = await this.api.get('/companies', { params });
    return this.extractResponseData(response);
  }

  async getCompany(id: number) {
    const response = await this.api.get(`/companies/${id}`);
    return this.extractResponseData(response);
  }

  // Region management
  async getRegions(params?: PaginationParams) {
    const response = await this.api.get('/regions', { params });
    return this.extractResponseData(response);
  }

  async getRegion(id: number) {
    const response = await this.api.get(`/regions/${id}`);
    return this.extractResponseData(response);
  }
}

export const apiService = new ApiService();