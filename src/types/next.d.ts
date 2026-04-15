declare module 'next' {
  import { ComponentType, ReactNode } from 'react';
  export const metadata: { title?: string; description?: string };
  export default function RootLayout(props: { children: React.ReactNode }): JSX.Element;
}

declare module 'next/image' {
  interface ImageProps {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    priority?: boolean;
    className?: string;
  }
  const Image: ComponentType<ImageProps>;
  export default Image;
}

declare module 'next/link' {
  import { ComponentType, ReactNode } from 'react';

  interface LinkProps {
    href: string;
    children?: ReactNode;
    className?: string;
    onClick?: () => void;
  }

  const Link: ComponentType<LinkProps>;
  export default Link;
}

declare module 'next/navigation' {
  export function usePathname(): string;
  export function useRouter(): { push: (href: string) => void };
  export function useSearchParams(): { get: (key: string) => string | null };
  export function redirect(url: string): never;
}

declare module 'lucide-react' {
  export const ShoppingCart: any;
  export const CheckCircle: any;
  export const AlertTriangle: any;
  export const Percent: any;
  export const LayoutDashboard: any;
  export const BarChart3: any;
  export const Store: any;
  export const Settings: any;
  export const LogOut: any;
  export const User: any;
  export const Bell: any;
  export const Search: any;
  export const Plus: any;
  export const Trash2: any;
  export const Edit2: any;
  export const X: any;
  export const RefreshCw: any;
  export const Loader2: any;
  export const QrCode: any;
  export const MessageCircle: any;
}

declare module 'qrcode.react' {
  import { ComponentType } from 'react';
  interface QRCodeSVGProps {
    value: string;
    size?: number;
    level?: 'L' | 'M' | 'Q' | 'H';
  }
  export const QRCodeSVG: ComponentType<QRCodeSVGProps>;
}

declare module 'date-fns' {
  export function formatDistanceToNow(date: Date, options?: any): string;
  export function format(date: Date, formatStr: string): string;
  export function subDays(date: Date, days: number): Date;
  export function startOfDay(date: Date): Date;
  export function endOfDay(date: Date): Date;
  export function eachDayOfInterval(options: { start: Date; end: Date }): Date[];
}

declare module 'date-fns/locale' {
  export const ptBR: any;
}