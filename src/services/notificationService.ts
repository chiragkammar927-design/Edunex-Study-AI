import { NotificationSettings, AppNotification, SubjectType, Flashcard } from '../types';
import { soundFX } from '../utils/soundOrConfetti';

export const defaultNotificationSettings: NotificationSettings = {
  browserPushEnabled: true,
  studyBlockAlerts: true,
  studyBlockLeadMinutes: 0,
  flashcardDueAlerts: true,
  soundEnabled: true,
  alertSound: 'zen-bell',
  microRecallPrompt: true,
  binauralFocusPrompt: true,
};

export class NotificationService {
  private static instance: NotificationService;
  private settings: NotificationSettings;
  private scheduledTimers: Map<string, number> = new Map();

  private constructor() {
    this.settings = this.loadSettings();
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  public getSettings(): NotificationSettings {
    return { ...this.settings };
  }

  public updateSettings(newSettings: Partial<NotificationSettings>): NotificationSettings {
    this.settings = { ...this.settings, ...newSettings };
    this.saveSettings();
    return this.settings;
  }

  private loadSettings(): NotificationSettings {
    try {
      const saved = localStorage.getItem('novastudy_notification_settings');
      if (saved) {
        return { ...defaultNotificationSettings, ...JSON.parse(saved) };
      }
    } catch {
      // fallback
    }
    return { ...defaultNotificationSettings };
  }

  private saveSettings(): void {
    try {
      localStorage.setItem('novastudy_notification_settings', JSON.stringify(this.settings));
    } catch {
      // fallback
    }
  }

  /**
   * Check if the browser supports the Notifications API
   */
  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  /**
   * Get the current permission status
   */
  public getPermissionStatus(): NotificationPermission | 'unsupported' {
    if (!this.isSupported()) return 'unsupported';
    return Notification.permission;
  }

  /**
   * Request browser push notification permission
   */
  public async requestPermission(): Promise<NotificationPermission | 'unsupported'> {
    if (!this.isSupported()) {
      return 'unsupported';
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        this.updateSettings({ browserPushEnabled: true });
        // Play gentle confirmation bell
        soundFX.playPop();
      } else if (permission === 'denied') {
        this.updateSettings({ browserPushEnabled: false });
      }
      return permission;
    } catch (err) {
      console.warn('Could not request Notification permission:', err);
      return Notification.permission;
    }
  }

  /**
   * Play the configured sound effect
   */
  public playAlertChime(type: 'study_block' | 'flashcard_due'): void {
    if (!this.settings.soundEnabled) return;

    if (type === 'study_block') {
      soundFX.playStudyBlockAlert(0.6);
    } else {
      soundFX.playFlashcardDueAlert(0.6);
    }
  }

  /**
   * Dispatch a browser notification with safe fallback
   */
  public async showNativeNotification(
    title: string,
    options: {
      body: string;
      tag?: string;
      icon?: string;
      data?: any;
    },
    onClick?: () => void
  ): Promise<boolean> {
    if (!this.isSupported()) return false;
    if (Notification.permission !== 'granted') return false;

    try {
      const notification = new Notification(title, {
        body: options.body,
        icon: options.icon || '/favicon.ico',
        tag: options.tag,
        badge: '/favicon.ico',
        requireInteraction: false,
        silent: !this.settings.soundEnabled, // Let our Web Audio synthesizer handle the rich acoustic chime
      });

      notification.onclick = (event) => {
        event.preventDefault();
        try {
          window.focus();
        } catch {
          // ignore
        }
        if (onClick) onClick();
        notification.close();
      };

      // Auto-close after 8 seconds if not interacted with
      setTimeout(() => {
        try {
          notification.close();
        } catch {
          // ignore
        }
      }, 8000);

      return true;
    } catch (err) {
      console.warn('Error displaying native browser notification:', err);
      return false;
    }
  }

  /**
   * Trigger an alert when a scheduled study block starts
   */
  public async notifyStudyBlockStarting(
    taskTitle: string,
    subject: SubjectType,
    durationMinutes: number,
    onOpenPlanner: () => void
  ): Promise<{ shownInBrowser: boolean; notification: AppNotification }> {
    const title = `📚 Study Block Starting: ${taskTitle}`;
    const body = `${subject} (${durationMinutes} mins scheduled) is starting right now. Stay in your flow state!`;

    this.playAlertChime('study_block');

    let shownInBrowser = false;
    if (this.settings.browserPushEnabled && this.getPermissionStatus() === 'granted') {
      shownInBrowser = await this.showNativeNotification(
        title,
        {
          body,
          tag: `study-block-${taskTitle}`,
        },
        onOpenPlanner
      );
    }

    const appNotification: AppNotification = {
      id: `study-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type: 'study_block',
      title,
      message: body,
      timestamp: new Date().toISOString(),
      read: false,
      actionType: 'open_planner',
      meta: {
        subject,
        taskTitle,
        durationMinutes,
      },
    };

    return { shownInBrowser, notification: appNotification };
  }

  /**
   * Trigger an alert when a flashcard deck is due
   */
  public async notifyFlashcardDeckDue(
    dueCount: number,
    subject: SubjectType,
    sampleCard?: Flashcard,
    onOpenMemory?: () => void
  ): Promise<{ shownInBrowser: boolean; notification: AppNotification }> {
    const title = `🧠 Flashcard Review Due: ${subject}`;
    const body = `${dueCount} card${dueCount === 1 ? '' : 's'} ready for spaced repetition recall. Retain before memory decay!`;

    this.playAlertChime('flashcard_due');

    let shownInBrowser = false;
    if (this.settings.browserPushEnabled && this.getPermissionStatus() === 'granted') {
      shownInBrowser = await this.showNativeNotification(
        title,
        {
          body: sampleCard ? `${body} E.g.: "${sampleCard.front.substring(0, 50)}..."` : body,
          tag: `flashcard-due-${subject}`,
        },
        onOpenMemory
      );
    }

    const appNotification: AppNotification = {
      id: `deck-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type: 'flashcard_due',
      title,
      message: body,
      timestamp: new Date().toISOString(),
      read: false,
      actionType: 'quick_micro_recall',
      meta: {
        subject,
        cardsCount: dueCount,
        cardId: sampleCard?.id,
        dueCardFront: sampleCard?.front,
        dueCardBack: sampleCard?.back,
        dueCardChapter: sampleCard?.chapter,
      },
    };

    return { shownInBrowser, notification: appNotification };
  }

  /**
   * Schedule a future countdown alert
   */
  public scheduleTimerAlert(
    timerId: string,
    delaySeconds: number,
    onTrigger: () => void
  ): void {
    if (this.scheduledTimers.has(timerId)) {
      window.clearTimeout(this.scheduledTimers.get(timerId));
    }

    const timer = window.setTimeout(() => {
      this.scheduledTimers.delete(timerId);
      onTrigger();
    }, delaySeconds * 1000);

    this.scheduledTimers.set(timerId, timer);
  }

  public cancelTimerAlert(timerId: string): void {
    if (this.scheduledTimers.has(timerId)) {
      window.clearTimeout(this.scheduledTimers.get(timerId));
      this.scheduledTimers.delete(timerId);
    }
  }
}

export const notificationService = NotificationService.getInstance();
