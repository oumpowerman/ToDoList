import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { Task } from '../types';

// Helper: Convert UUID string to Integer ID (Required for Android Notifications)
const hashCode = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash); // Ensure positive integer
};

export const NotificationService = {
  async init() {
    if (!Capacitor.isNativePlatform()) return;

    try {
        // 1. Request Permissions
        await LocalNotifications.requestPermissions();

        // 2. Create Channel (Required for Android O+)
        // This ensures sound, vibration, and visibility
        await LocalNotifications.createChannel({
            id: 'smarttask_reminders',
            name: 'SmartTask Reminders',
            description: 'แจ้งเตือนเมื่อถึงกำหนดส่งงาน',
            importance: 5, // 5 = High (Heads Up Notification)
            visibility: 1, // 1 = Public
            vibration: true,
            sound: 'beep.wav' 
        });
        console.log('Notification Channel Created');
    } catch (e) {
        console.error("Notification Init Error:", e);
    }
  },

  async requestPermissions() {
      return this.init();
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
              sound: 'beep.wav', 
              channelId: 'smarttask_reminders', // Important for Android
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