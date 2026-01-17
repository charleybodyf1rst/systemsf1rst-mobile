import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import api from './api';

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    priority: Notifications.AndroidNotificationPriority.HIGH,
  }),
});

export interface NotificationData {
  type?: 'alert' | 'threat' | 'message' | 'reminder' | 'time_clock';
  id?: string;
  route?: string;
  [key: string]: any;
}

/**
 * Request notification permissions and get the Expo push token
 */
export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  // Check existing permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Request permissions if not granted
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Push notification permissions not granted');
    return null;
  }

  // Get Expo push token
  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    return tokenData.data;
  } catch (error) {
    console.error('Error getting push token:', error);
    return null;
  }
}

/**
 * Send the push token to the backend for storage
 */
export async function sendPushTokenToServer(token: string, deviceId?: string): Promise<boolean> {
  try {
    await api.post('/push-tokens', {
      token,
      device_id: deviceId,
      platform: Platform.OS,
      device_name: Device.deviceName || 'Unknown Device',
    });
    return true;
  } catch (error) {
    console.error('Error sending push token to server:', error);
    return false;
  }
}

/**
 * Schedule a local notification
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: NotificationData,
  seconds: number = 1
): Promise<string> {
  return await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger: seconds > 0 ? { seconds } : null,
  });
}

/**
 * Handle notification tap - navigate to appropriate screen
 */
export function handleNotificationResponse(response: Notifications.NotificationResponse): void {
  const data = response.notification.request.content.data as NotificationData;

  if (!data) return;

  // Handle navigation based on notification type
  switch (data.type) {
    case 'alert':
      if (data.id) {
        router.push(`/(admin)/alerts/${data.id}` as any);
      } else {
        router.push('/(admin)/alerts' as any);
      }
      break;

    case 'threat':
      if (data.id) {
        router.push(`/(admin)/threats/${data.id}` as any);
      } else {
        router.push('/(admin)/threats' as any);
      }
      break;

    case 'message':
      router.push('/(employee)/messages' as any);
      break;

    case 'reminder':
      router.push('/(employee)/calendar' as any);
      break;

    case 'time_clock':
      router.push('/(employee)/time-clock' as any);
      break;

    default:
      // Use custom route if provided
      if (data.route) {
        router.push(data.route as any);
      }
      break;
  }
}

/**
 * Set the badge count on the app icon
 */
export async function setBadgeCount(count: number): Promise<boolean> {
  try {
    await Notifications.setBadgeCountAsync(count);
    return true;
  } catch (error) {
    console.error('Error setting badge count:', error);
    return false;
  }
}

/**
 * Clear all delivered notifications
 */
export async function clearAllNotifications(): Promise<void> {
  await Notifications.dismissAllNotificationsAsync();
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllScheduledNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Setup notification channels for Android
 */
export async function setupNotificationChannels(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('alerts', {
      name: 'Security Alerts',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF0000',
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync('messages', {
      name: 'Messages',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync('time_clock', {
      name: 'Time Clock',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
    });
  }
}
