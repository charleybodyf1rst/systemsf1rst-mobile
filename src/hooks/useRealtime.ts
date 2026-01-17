// Hook to integrate realtime WebSocket updates with stores
import { useEffect, useState, useCallback } from 'react';
import { realtimeService, CrmUpdateEvent, CalendarUpdateEvent, AgentUpdateEvent, NotificationEvent } from '../lib/realtime';
import { useCrmStore, useCalendarStore, useAgentStore, useAuthStore } from '../stores';
import { Alert, Vibration, Platform } from 'react-native';

interface UseRealtimeOptions {
  showNotifications?: boolean;
  vibrateOnUpdate?: boolean;
}

export function useRealtime(options: UseRealtimeOptions = {}) {
  const { showNotifications = true, vibrateOnUpdate = false } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const { user, isAuthenticated } = useAuthStore();
  const crmStore = useCrmStore();
  const calendarStore = useCalendarStore();
  const agentStore = useAgentStore();

  // Handle CRM updates
  const handleCrmUpdate = useCallback((event: CrmUpdateEvent) => {
    crmStore.handleRealtimeUpdate(event);

    if (vibrateOnUpdate && Platform.OS !== 'web') {
      Vibration.vibrate(50);
    }
  }, [crmStore, vibrateOnUpdate]);

  // Handle Calendar updates
  const handleCalendarUpdate = useCallback((event: CalendarUpdateEvent) => {
    // Refresh calendar events on any change
    calendarStore.refreshEvents();
  }, [calendarStore]);

  // Handle Agent updates
  const handleAgentUpdate = useCallback((event: AgentUpdateEvent) => {
    // The agent store handles these through its own mechanisms
    // But we can trigger a refresh for pending approvals
    if (event.type === 'approval_required') {
      agentStore.fetchPendingApprovals();
    }
  }, [agentStore]);

  // Handle Notifications
  const handleNotification = useCallback((event: NotificationEvent) => {
    if (showNotifications) {
      Alert.alert(event.title, event.body);
    }

    if (vibrateOnUpdate && Platform.OS !== 'web') {
      Vibration.vibrate([0, 100, 50, 100]);
    }
  }, [showNotifications, vibrateOnUpdate]);

  // Handle connection changes
  const handleConnectionChange = useCallback((connected: boolean) => {
    setIsConnected(connected);
    setConnectionError(connected ? null : 'Disconnected from server');
  }, []);

  // Connect/disconnect based on auth state
  useEffect(() => {
    if (isAuthenticated && user?.organization_id && user?.id) {
      realtimeService.connect(
        user.organization_id.toString(),
        user.id.toString()
      ).catch((error) => {
        console.error('[useRealtime] Connection failed:', error);
        setConnectionError('Failed to connect to real-time server');
      });
    } else {
      realtimeService.disconnect();
    }

    return () => {
      realtimeService.disconnect();
    };
  }, [isAuthenticated, user?.organization_id, user?.id]);

  // Subscribe to events
  useEffect(() => {
    const unsubCrm = realtimeService.onCrmUpdate(handleCrmUpdate);
    const unsubCalendar = realtimeService.onCalendarUpdate(handleCalendarUpdate);
    const unsubAgent = realtimeService.onAgentUpdate(handleAgentUpdate);
    const unsubNotification = realtimeService.onNotification(handleNotification);
    const unsubConnection = realtimeService.onConnectionChange(handleConnectionChange);

    // Get initial connection status
    setIsConnected(realtimeService.getConnectionStatus());

    return () => {
      unsubCrm();
      unsubCalendar();
      unsubAgent();
      unsubNotification();
      unsubConnection();
    };
  }, [handleCrmUpdate, handleCalendarUpdate, handleAgentUpdate, handleNotification, handleConnectionChange]);

  // Manual reconnect function
  const reconnect = useCallback(async () => {
    if (user?.organization_id && user?.id) {
      setConnectionError(null);
      try {
        await realtimeService.connect(
          user.organization_id.toString(),
          user.id.toString()
        );
      } catch (error) {
        setConnectionError('Failed to reconnect');
      }
    }
  }, [user?.organization_id, user?.id]);

  return {
    isConnected,
    connectionError,
    reconnect,
  };
}

export default useRealtime;
