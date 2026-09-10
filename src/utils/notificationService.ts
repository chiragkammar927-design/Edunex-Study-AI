// Browser Push Notification & Smart Reminder Service for Study Sessions

export type NotificationStatus = 'default' | 'granted' | 'denied' | 'unsupported';

class StudyNotificationService {
  private lastNotificationTime: number = 0;
  private minIntervalMs: number = 15000; // Throttle notifications to prevent spam

  /**
   * Checks if browser push notifications are supported in current environment
   */
  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  /**
   * Returns current permission status
   */
  public getPermissionStatus(): NotificationStatus {
    if (!this.isSupported()) return 'unsupported';
    return Notification.permission as NotificationStatus;
  }

  /**
   * Requests permission to send browser push notifications
   */
  public async requestPermission(): Promise<NotificationStatus> {
    if (!this.isSupported()) {
      return 'unsupported';
    }

    try {
      const permission = await Notification.requestPermission();
      return permission as NotificationStatus;
    } catch (err) {
      console.warn('Notification permission request failed or restricted:', err);
      return this.getPermissionStatus();
    }
  }

  /**
   * Dispatches a browser push notification for resuming study sessions
   */
  public sendStudyReminder({
    title,
    body,
    tag = 'study-resume-reminder',
    onClick,
  }: {
    title: string;
    body: string;
    tag?: string;
    onClick?: () => void;
  }): boolean {
    const now = Date.now();
    if (now - this.lastNotificationTime < this.minIntervalMs) {
      // Throttled
      return false;
    }

    if (this.isSupported() && Notification.permission === 'granted') {
      try {
        const notification = new Notification(title, {
          body,
          tag,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          requireInteraction: false,
          silent: false,
        });

        this.lastNotificationTime = now;

        notification.onclick = () => {
          try {
            window.focus();
          } catch {}
          notification.close();
          if (onClick) onClick();
        };

        // Auto close after 8 seconds
        setTimeout(() => {
          try {
            notification.close();
          } catch {}
        }, 8000);

        return true;
      } catch (e) {
        console.warn('Failed to construct browser Notification:', e);
        return false;
      }
    }

    return false;
  }

  /**
   * Dispatches a predictive AI Deep Work Flow Interruption notification
   */
  public sendDeepWorkInterruptionAlert({
    title,
    body,
    tag = 'deep-work-flow-interrupted',
    onClick,
  }: {
    title: string;
    body: string;
    tag?: string;
    onClick?: () => void;
  }): boolean {
    const now = Date.now();
    // Allow interruption alerts with a shorter 10s cooldown to ensure timely cognitive recovery
    if (now - this.lastNotificationTime < 10000) {
      return false;
    }

    if (this.isSupported() && Notification.permission === 'granted') {
      try {
        const notification = new Notification(title, {
          body,
          tag,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          requireInteraction: true,
          silent: false,
        });

        this.lastNotificationTime = now;

        notification.onclick = () => {
          try {
            window.focus();
          } catch {}
          notification.close();
          if (onClick) onClick();
        };

        // Auto close after 12 seconds
        setTimeout(() => {
          try {
            notification.close();
          } catch {}
        }, 12000);

        return true;
      } catch (e) {
        console.warn('Failed to construct Deep Work Notification:', e);
        return false;
      }
    }

    return false;
  }
}

export const notificationService = new StudyNotificationService();
