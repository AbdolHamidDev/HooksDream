// Push Notifications Service - Core functionality
export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  data?: any;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

class PushService {
  // Phải khớp VAPID_PUBLIC_KEY của backend (.env).
  // Fallback cũ từng sai -> subscribe luôn thất bại. Giữ fallback đúng để dev
  // chạy được khi quên set biến, nhưng luôn ưu tiên biến môi trường.
  private readonly VAPID_PUBLIC_KEY =
    import.meta.env.VITE_VAPID_PUBLIC_KEY ||
    'BMn1I7QEWAwSOtb_E3tsm3AO2MO_HmwuHzCQsmnRGDuQJRKL3m5xw1S5-NAcqGfcpxW--2vIz4-0cNSo2YlSfSc';
  
  // Check if push notifications are supported
  isSupported(): boolean {
    const hasAPIs = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    const isSecureContext = window.isSecureContext || window.location.hostname === 'localhost';
    
    if (!hasAPIs) {
      return false;
    }
    
    if (!isSecureContext) {
      return false;
    }

    // Additional check for development
    if (import.meta.env.MODE === 'development' && window.location.hostname === 'localhost') {
      // Push notifications might not work in localhost development
      return false;
    }
    
    return true;
  }

  // Get current permission status
  getPermissionStatus(): NotificationPermission {
    return Notification.permission;
  }

  // Request notification permission
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      throw new Error('Push notifications are not supported');
    }

    const permission = await Notification.requestPermission();
    return permission;
  }

  // Subscribe to push notifications
  async subscribe(): Promise<PushSubscriptionData | null> {
    if (!this.isSupported()) {
      return null;
    }

    try {
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        return null;
      }

      // Check if service worker is available
      if (!('serviceWorker' in navigator)) {
        return null;
      }

      const registration = await navigator.serviceWorker.ready;
      
      // Check if push manager is available
      if (!registration.pushManager) {
        return null;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.VAPID_PUBLIC_KEY)
      });

      return {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')!),
          auth: this.arrayBufferToBase64(subscription.getKey('auth')!)
        }
      };
    } catch (error) {
      // Silent fail for push service errors
      return null;
    }
  }

  // Get existing subscription
  async getSubscription(): Promise<PushSubscriptionData | null> {
    if (!this.isSupported()) return null;

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (!subscription) return null;

    return {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')!),
        auth: this.arrayBufferToBase64(subscription.getKey('auth')!)
      }
    };
  }

  // Unsubscribe from push notifications
  async unsubscribe(): Promise<boolean> {
    if (!this.isSupported()) return false;

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      return await subscription.unsubscribe();
    }

    return false;
  }

  // Helper: Convert VAPID key
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Helper: Convert ArrayBuffer to Base64
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }
}

export const pushService = new PushService();
export default pushService;
