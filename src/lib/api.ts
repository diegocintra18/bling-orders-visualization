import type {
  AuthResponse,
  BlingAccount,
  Store,
  Order,
  OrderFilters,
  OrderStats,
  DailyReport,
  ReportByStore,
  ReportByTransportadora,
} from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

class ApiClient {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  setTokens(access: string, refresh: string): void {
    this.accessToken = access;
    this.refreshToken = refresh;
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
    }
  }

  clearTokens(): void {
    this.accessToken = null;
    this.refreshToken = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
  }

  loadTokens(): void {
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('access_token');
      this.refreshToken = localStorage.getItem('refresh_token');
    }
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.accessToken) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401 && this.refreshToken) {
      const refreshed = await this.refreshAccessToken();
      if (refreshed) {
        return this.request(endpoint, options);
      }
    }

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || `HTTP error ${response.status}`);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  private async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) {
      return false;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!response.ok) {
        this.clearTokens();
        return false;
      }

      const data: AuthResponse = await response.json();
      this.setTokens(data.access, data.refresh);
      return true;
    } catch {
      return false;
    }
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }

    this.setTokens(data.access, data.refresh);
    return data;
  }

  async register(email: string, password: string, name: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password, name }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Registration failed');
    }

    this.setTokens(data.access, data.refresh);
    return data;
  }

  async logout(): Promise<void> {
    this.clearTokens();
  }

  async getAccounts(): Promise<any[]> {
    return this.request<any[]>('/api/accounts');
  }

  async getAccount(id: string): Promise<BlingAccount> {
    return this.request<BlingAccount>(`/api/accounts/${id}`);
  }

  async createAccount(name: string, clientId: string, clientSecret: string): Promise<BlingAccount> {
    return this.request<BlingAccount>('/api/accounts', {
      method: 'POST',
      body: JSON.stringify({ name, clientId, clientSecret }),
    });
  }

  async updateAccount(id: string, name: string, clientId?: string, clientSecret?: string): Promise<BlingAccount> {
    return this.request<BlingAccount>(`/api/accounts/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name, clientId, clientSecret }),
    });
  }

  async deleteAccount(id: string): Promise<void> {
    return this.request<void>(`/api/accounts/${id}`, {
      method: 'DELETE',
    });
  }

  async getOrders(filters?: OrderFilters): Promise<{ orders: Order[]; pagination: any }> {
    const params = new URLSearchParams();
    if (filters) {
      if (filters.accountId) params.append('account', filters.accountId);
      if (filters.storeId) params.append('store', filters.storeId);
      if (filters.transportadora) params.append('transportadora', filters.transportadora);
      if (filters.status) params.append('status', filters.status);
      if (filters.dataInicio) params.append('data_inicio', filters.dataInicio);
      if (filters.dataFim) params.append('data_fim', filters.dataFim);
      if (filters.search) params.append('search', filters.search);
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<{ orders: Order[]; pagination: any }>(`/api/orders${query}`);
  }

  async getOrder(id: string): Promise<Order> {
    return this.request<Order>(`/api/orders/${id}`);
  }

  async markOrderAsPicked(id: string): Promise<Order> {
    return this.request<Order>(`/api/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'verificado' }),
    });
  }

  async updateOrderStatus(id: string, status: string): Promise<Order> {
    return this.request<Order>(`/api/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  async getDelayedOrders(): Promise<Order[]> {
    return this.request<Order[]>('/api/orders/delayed');
  }

  async getOrderStats(): Promise<OrderStats> {
    return this.request<OrderStats>('/api/orders/stats');
  }

  async syncOrders(accountId: string): Promise<any> {
    return this.request<any>('/api/orders/sync', {
      method: 'POST',
      body: JSON.stringify({ accountId }),
    });
  }

  async getDailyReports(): Promise<DailyReport[]> {
    return this.request<DailyReport[]>('/api/reports/daily');
  }

  async getReportsByStore(): Promise<ReportByStore[]> {
    return this.request<ReportByStore[]>('/api/reports/by-store');
  }

  async getReportsByTransportadora(): Promise<ReportByTransportadora[]> {
    return this.request<ReportByTransportadora[]>('/api/reports/by-transportadora');
  }
}

export const api = new ApiClient();
export default api;
