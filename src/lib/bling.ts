import { encrypt, decrypt } from './crypto';

const BLING_API_BASE = 'https://api.bling.com.br/api/v3';
const BLING_OAUTH_URL = 'https://www.bling.com.br/lojavirtual/oauth';

interface BlingTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

interface BlingOrder {
  id: number;
  numero: string;
  data: string;
  status: string;
  cliente: {
    nome: string;
    telefone?: string;
  };
  itens: {
    item: {
      descricao: string;
      quantidade: number;
      valorUnitario: number;
    };
  }[];
  transportadora?: string;
  loja: string;
  valorTotal: number;
}

interface BlingStore {
  id: number;
  nome: string;
  canal: string;
}

export interface BlingCredentials {
  clientId: string;
  clientSecret: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiry?: Date;
}

export class BlingClient {
  private clientId: string;
  private clientSecret: string;
  private accessToken?: string;
  private refreshToken?: string;
  private tokenExpiry?: Date;
  private isRefreshing = false;
  private refreshPromise: Promise<void> | null = null;

  constructor(credentials: BlingCredentials) {
    this.clientId = credentials.clientId;
    this.clientSecret = credentials.clientSecret;
    this.accessToken = credentials.accessToken;
    this.refreshToken = credentials.refreshToken;
    this.tokenExpiry = credentials.tokenExpiry;
  }

  async ensureToken(): Promise<void> {
    if (this.isRefreshing && this.refreshPromise) {
      await this.refreshPromise;
      return;
    }

    if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return;
    }

    await this.refreshAccessToken();
  }

  async refreshAccessToken(): Promise<void> {
    if (this.isRefreshing && this.refreshPromise) {
      return;
    }

    this.isRefreshing = true;

    this.refreshPromise = (async () => {
      try {
        if (!this.refreshToken) {
          throw new Error('No refresh token available');
        }

        const params = new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: this.refreshToken,
          client_id: this.clientId,
          client_secret: this.clientSecret,
        });

        const response = await fetch(`${BLING_OAUTH_URL}/token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'enable-jwt': '1',
          },
          body: params.toString(),
        });

        if (!response.ok) {
          throw new Error(`Token refresh failed: ${response.status}`);
        }

        const data: BlingTokenResponse = await response.json();

        this.accessToken = data.access_token;
        this.refreshToken = data.refresh_token;
        this.tokenExpiry = new Date(Date.now() + data.expires_in * 1000);
      } catch (error) {
        console.error('Failed to refresh token:', error);
        throw error;
      } finally {
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
    })();

    await this.refreshPromise;
  }

  private async request<T>(
    endpoint: string,
    method: string = 'GET',
    body?: Record<string, unknown>
  ): Promise<T> {
    await this.ensureToken();

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.accessToken}`,
      'enable-jwt': '1',
      'Content-Type': 'application/json',
    };

    const options: RequestInit = {
      method,
      headers,
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${BLING_API_BASE}${endpoint}`, options);

    if (!response.ok) {
      if (response.status === 401) {
        await this.refreshAccessToken();
        headers['Authorization'] = `Bearer ${this.accessToken}`;
        const retryResponse = await fetch(`${BLING_API_BASE}${endpoint}`, options);
        if (!retryResponse.ok) {
          throw new Error(`Bling API error: ${retryResponse.status}`);
        }
        const retryData = await retryResponse.json();
        return retryData.data || retryData;
      }
      throw new Error(`Bling API error: ${response.status}`);
    }

    const data = await response.json();
    return data.data || data;
  }

  async getOrders(
    situationId?: number,
    storeId?: number,
    page: number = 1,
    limit: number = 100
  ): Promise<BlingOrder[]> {
    const params: Record<string, string> = {
      pagina: page.toString(),
      limite: limit.toString(),
    };

    if (situationId) params.situacao = situationId.toString();
    if (storeId) params.loja = storeId.toString();

    const orders = await this.request<BlingOrder[]>('/pedidos', 'GET');
    return Array.isArray(orders) ? orders : [orders];
  }

  async getOrder(id: number): Promise<BlingOrder> {
    return this.request<BlingOrder>(`/pedidos/${id}`);
  }

  async getStores(): Promise<BlingStore[]> {
    const stores = await this.request<BlingStore[]>('/lojas');
    return Array.isArray(stores) ? stores : [stores];
  }

  async syncOrders(): Promise<BlingOrder[]> {
    return this.getOrders();
  }

  async getOrderByNumber(numero: string): Promise<BlingOrder | null> {
    try {
      const orders = await this.getOrders();
      return orders.find(o => o.numero === numero) || null;
    } catch {
      return null;
    }
  }

  getCredentials(): BlingCredentials {
    return {
      clientId: this.clientId,
      clientSecret: this.clientSecret,
      accessToken: this.accessToken,
      refreshToken: this.refreshToken,
      tokenExpiry: this.tokenExpiry,
    };
  }
}

export async function createBlingClient(
  encryptedClientId: string,
  encryptedClientSecret: string,
  accessToken?: string,
  refreshToken?: string,
  tokenExpiry?: Date
): Promise<BlingClient> {
  const clientId = decrypt(encryptedClientId);
  const clientSecret = decrypt(encryptedClientSecret);

  const client = new BlingClient({
    clientId,
    clientSecret,
    accessToken,
    refreshToken,
    tokenExpiry,
  });

  if (!accessToken && refreshToken) {
    await client.refreshAccessToken();
  }

  return client;
}

export async function getInitialTokens(
  clientId: string,
  clientSecret: string,
  code: string,
  redirectUri: string
): Promise<BlingTokenResponse> {
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
  });

  const response = await fetch(`${BLING_OAUTH_URL}/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'enable-jwt': '1',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    throw new Error(`Failed to get initial tokens: ${response.status}`);
  }

  return response.json();
}

export function getBlingOAuthUrl(
  clientId: string,
  redirectUri: string,
  state?: string
): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
  });

  if (state) {
    params.append('state', state);
  }

  return `${BLING_OAUTH_URL}/authorize?${params.toString()}`;
}

export type { BlingOrder, BlingStore, BlingTokenResponse };
