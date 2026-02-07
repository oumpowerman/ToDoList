import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { Task } from '../types';

// Helper: Convert UUID string to Integer ID (Required for Android Notifications)
const hashCode = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; 
  }
  return Math.abs(hash); // Ensure positive integer
};

export const NotificationService = {
  async requestPermissions() {
    try {
        if (Capacitor.isNativePlatform()) {
            return await LocalNotifications.requestPermissions();
        } else if (typeof Notification !== 'undefined') {
            return await Notification.requestPermission();
        }
    } catch (e) {
        console.warn("Notification permissions warning:", e);
    }
    return { display: 'granted' };
  },

  async schedule(task: Task) {
    // 1. Check if task has due date and is in the future
    if (!task.dueDate || task.dueDate < Date.now()) return;

    // 2. Schedule logic
    if (Capacitor.isNativePlatform()) {
      const id = hashCode(task.id);
      try {
          // Cancel any existing notification for this task first to avoid duplicates
          await LocalNotifications.cancel({ notifications: [{ id }] });
          
          await LocalNotifications.schedule({
            notifications: [{
              title: "⏰ ถึงเวลาแล้ว!",
              body: `อย่าลืมทำ: ${task.title}`,
              id: id,
              schedule: { at: new Date(task.dueDate) },
              sound: 'beep.wav', // Native sound
              actionTypeId: "",
              extra: { taskId: task.id }
            }]
          });
          console.log(`Scheduled notification for task: ${task.title} at ${new Date(task.dueDate)}`);
      } catch (e) {
          console.error("Notification Schedule Error", e);
      }
    } else {
        // Web context is handled by setInterval in the hook
        console.log("Web Notification handled by polling");
    }
  },

  async cancel(taskId: string) {
    if (Capacitor.isNativePlatform()) {
       const id = hashCode(taskId);
       try {
        await LocalNotifications.cancel({ notifications: [{ id }] });
       } catch (e) {
        console.error("Notification Cancel Error", e);
       }
    }
  }
};