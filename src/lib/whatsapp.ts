import type { WhatsAppMessage, WhatsAppConfig } from '@/types';

let isConnected = false;
let qrCodeData: string | null = null;

const onQREvents: ((qr: string) => void)[] = [];
const onConnectEvents: (() => void)[] = [];
const onDisconnectEvents: (() => void)[] = [];

export const whatsappService = {
  init() {
    console.log('WhatsApp service initialized - requires server-side setup');
  },

  onQR(callback: (qr: string) => void) {
    onQREvents.push(callback);
  },

  onConnect(callback: () => void) {
    onConnectEvents.push(callback);
  },

  onDisconnect(callback: () => void) {
    onDisconnectEvents.push(callback);
  },

  getQR(): string | null {
    return qrCodeData;
  },

  getStatus(): boolean {
    return isConnected;
  },

  async sendMessage(message: WhatsAppMessage): Promise<boolean> {
    console.log('WhatsApp message would be sent:', message);
    return false;
  },

  destroy() {
    isConnected = false;
    qrCodeData = null;
  },
};

export function getWhatsAppConfig(): WhatsAppConfig {
  return {
    sessionId: 'bling-orders-session',
    qrCode: qrCodeData || undefined,
    isConnected,
  };
}