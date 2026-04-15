export type OrderStatus = 'faturado' | 'verificado' | 'concluido';

export interface BlingAccount {
  id: string;
  name: string;
  blingAccountId?: string;
  hasToken?: boolean;
  tokenExpiry?: string;
  webhookToken?: string;
  orderCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Store {
  id: string;
  name: string;
  accountId: string;
  blingId?: string;
}

export interface Order {
  id: string;
  accountId: string;
  numero: string;
  blingId: string;
  status: OrderStatus;
  loja: string;
  transportadora: string;
  valor: number;
  cliente?: {
    nome?: string;
    telefone?: string;
  };
  dataCriacao: string;
  dataFaturamento?: string;
  dataVerificacao?: string;
  dataConclusao?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderFilters {
  accountId?: string;
  storeId?: string;
  transportadora?: string;
  status?: OrderStatus;
  dataInicio?: string;
  dataFim?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface OrderStats {
  totalToday: number;
  verifiedToday: number;
  delayedCount: number;
  completionRate: number;
}

export interface DailyReport {
  date: string;
  totalConferidos: number;
  totalFaturados: number;
}

export interface ReportByStore {
  store: string;
  totalConferidos: number;
  totalFaturados: number;
}

export interface ReportByTransportadora {
  transportadora: string;
  totalConferidos: number;
  totalFaturados: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role?: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface WhatsAppMessage {
  to: string;
  template: string;
  orderNumber?: string;
}

export interface WhatsAppConfig {
  sessionId: string;
  qrCode?: string;
  isConnected: boolean;
  lastMessage?: string;
  messageTemplate?: string;
}
