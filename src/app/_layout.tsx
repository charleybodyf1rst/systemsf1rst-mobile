import { useEffect, useRef } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { useAuthStore } from '../stores/authStore';
import { RealtimeProvider } from '../components/RealtimeProvider';
import ErrorBoundary from '../components/ErrorBoundary';
import { initOfflineQueue, cleanupOfflineQueue } from '../lib/offline-queue';
import { initSentry, setUser } from '../lib/sentry';
import {
  registerForPushNotifications,
  sendPushTokenToServer,
  handleNotificationResponse,
  setupNotificationChannels,
} from '../lib/notifications';

// Initialize Sentry before anything else
initSentry();

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { isLoading, loadStoredAuth, user } = useAuthStore();
  const notificationListener = useRef<Notifications.EventSubscription>();
  const responseListener = useRef<Notifications.EventSubscription>();

  useEffect(() => {
    const init = async () => {
      await loadStoredAuth();
      await initOfflineQueue();

      // Setup notification channels (Android)
      await setupNotificationChannels();

      // Register for push notifications
      const pushToken = await registerForPushNotifications();
      if (pushToken) {
        await sendPushTokenToServer(pushToken);
      }

      await SplashScreen.hideAsync();
    };
    init();

    // Setup notification listeners
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      // Handle foreground notification (can show in-app alert)
      console.log('Notification received:', notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      // Handle notification tap
      handleNotificationResponse(response);
    });

    return () => {
      cleanupOfflineQueue();
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  // Update Sentry user context when user changes
  useEffect(() => {
    if (user) {
      setUser({ id: user.id, email: user.email, name: user.name });
    } else {
      setUser(null);
    }
  }, [user]);

  if (isLoading) {
    return null;
  }

  return (
    <ErrorBoundary>
      <RealtimeProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(employee)" options={{ headerShown: false }} />
          <Stack.Screen name="(manager)" options={{ headerShown: false }} />
          <Stack.Screen name="(admin)" options={{ headerShown: false }} />
          <Stack.Screen name="(crm)" options={{ headerShown: false }} />
        </Stack>
        <StatusBar style="auto" />
      </RealtimeProvider>
    </ErrorBoundary>
  );
}
