import { Task, Habit } from '../types';
import { sounds } from './sound';

class NotificationService {
  private checkedReminders: Set<string> = new Set();

  // Check if browser/device supports Notifications
  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  // Get current permission status
  public getPermission(): NotificationPermission {
    if (!this.isSupported()) return 'denied';
    return Notification.permission;
  }

  // Request permission with friendly explanation
  public async requestPermission(): Promise<boolean> {
    if (!this.isSupported()) {
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (err) {
      console.warn('Error requesting notification permission:', err);
      return false;
    }
  }

  // Send immediate local notification
  public async sendNotification(title: string, options?: NotificationOptions): Promise<void> {
    if (!this.isSupported() || Notification.permission !== 'granted') {
      return;
    }

    sounds.playAlert();

    const defaultOptions: NotificationOptions = {
      icon: '/pwa-192x192.png',
      badge: '/icon.svg',
      tag: 'bone-breaker-alert',
      ...options,
    };

    // If ServiceWorker registration is ready, use registration.showNotification (works in PWA background)
    if ('serviceWorker' in navigator) {
      try {
        const reg = await navigator.serviceWorker.ready;
        if (reg && reg.showNotification) {
          await reg.showNotification(title, defaultOptions);
          return;
        }
      } catch {
        // Fallback to standard Notification
      }
    }

    try {
      new Notification(title, defaultOptions);
    } catch {
      // Ignored
    }
  }

  // Send notification when a new task is created
  public async notifyTaskCreated(task: Task): Promise<void> {
    const dueInfo = task.dueDate ? ` | Due: ${task.dueDate}${task.dueTime ? ' ' + task.dueTime : ''}` : '';
    await this.sendNotification(`⚔️ Mission Logged: ${task.title}`, {
      body: `Priority: ${task.priority.toUpperCase()}${dueInfo}\nPrepare for execution. No retreat.`,
    });
  }

  // Check due tasks and habits
  public checkDueReminders(tasks: Task[], habits: Habit[]): void {
    const now = new Date();
    const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const todayStr = now.toISOString().split('T')[0];

    // Check Tasks with dueTime or reminderTime
    tasks.forEach((task) => {
      if (task.completed || !task.dueDate) return;
      if (task.dueDate !== todayStr) return;

      // Check exact due time
      if (task.dueTime && task.dueTime === currentTimeStr) {
        const key = `task-due-${task.id}-${todayStr}-${currentTimeStr}`;
        if (!this.checkedReminders.has(key)) {
          this.checkedReminders.add(key);
          this.sendNotification(`🚨 MISSION DUE NOW: ${task.title}`, {
            body: `Tactical deadline reached. Finish the mission immediately!`,
            requireInteraction: true,
          });
        }
      }

      // Check reminder offset if set
      if (task.reminderTime && task.dueTime) {
        const [dueH, dueM] = task.dueTime.split(':').map(Number);
        const taskDueMs = new Date(now.getFullYear(), now.getMonth(), now.getDate(), dueH, dueM).getTime();
        let reminderOffsetMs = 0;
        if (task.reminderTime === '15m') reminderOffsetMs = 15 * 60 * 1000;
        if (task.reminderTime === '30m') reminderOffsetMs = 30 * 60 * 1000;
        if (task.reminderTime === '1h') reminderOffsetMs = 60 * 60 * 1000;

        if (reminderOffsetMs > 0) {
          const diff = taskDueMs - now.getTime();
          if (diff > 0 && diff <= reminderOffsetMs && diff >= reminderOffsetMs - 60000) {
            const key = `task-reminder-${task.id}-${task.reminderTime}`;
            if (!this.checkedReminders.has(key)) {
              this.checkedReminders.add(key);
              this.sendNotification(`⚠️ UPCOMING MISSION: ${task.title}`, {
                body: `Mission starts in ${task.reminderTime}. Gear up.`,
              });
            }
          }
        }
      }
    });

    // Check Habits with reminderTime
    habits.forEach((habit) => {
      if (habit.reminderTime && habit.reminderTime === currentTimeStr) {
        const alreadyDone = habit.history && habit.history[todayStr];
        if (!alreadyDone) {
          const key = `habit-due-${habit.id}-${todayStr}-${currentTimeStr}`;
          if (!this.checkedReminders.has(key)) {
            this.checkedReminders.add(key);
            this.sendNotification(`🔥 HABIT DIRECTIVE: ${habit.title}`, {
              body: `Current Streak: ${habit.currentStreak} Days. Keep the flame alive!`,
            });
          }
        }
      }
    });
  }
}

export const notifications = new NotificationService();
