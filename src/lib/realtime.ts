// Real-time WebSocket Integration using Pusher/Laravel Reverb
// Connects mobile app to backend for instant updates

import Pusher, { Channel } from 'pusher-js/react-native';
import Constants from 'expo-constants';
import { getAuthToken } from './api';

// Dev-only logging helper
const devLog = (...args: unknown[]) => {
  if (__DEV__) {
    console.log(...args);
  }
};

// WebSocket configuration from app.json extra config
const extra = Constants.expoConfig?.extra ?? {};
const WS_HOST = extra.wsHost ?? 'bodyf1rst-backend-clean-mdkalcrowq-uc.a.run.app';
const WS_PORT = extra.wsPort ?? 443;
const APP_KEY = extra.pusherKey ?? 'systemsf1rst-app';
const APP_CLUSTER = extra.pusherCluster ?? 'mt1';

// Event types
export interface CrmUpdateEvent {
  entity: 'lead' | 'contact' | 'deal' | 'communication';
  action: 'created' | 'updated' | 'deleted';
  data: any;
}

export interface CalendarUpdateEvent {
  action: 'created' | 'updated' | 'deleted';
  event: any;
}

export interface AgentUpdateEvent {
  type: 'message' | 'tool_call' | 'approval_required' | 'session_ended';
  sessionId: string;
  data: any;
}

export interface NotificationEvent {
  id: string;
  type: string;
  title: string;
  body: string;
  data?: any;
}

type EventCallback<T> = (data: T) => void;

class RealtimeService {
  private pusher: Pusher | null = null;
  private channels: Map<string, Channel> = new Map();
  private isConnected: boolean = false;
  private organizationId: string | null = null;
  private userId: string | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  // Event listeners
  private crmListeners: EventCallback<CrmUpdateEvent>[] = [];
  private calendarListeners: EventCallback<CalendarUpdateEvent>[] = [];
  private agentListeners: EventCallback<AgentUpdateEvent>[] = [];
  private notificationListeners: EventCallback<NotificationEvent>[] = [];
  private connectionListeners: EventCallback<boolean>[] = [];

  /**
   * Initialize and connect to WebSocket server
   */
  async connect(organizationId: string, userId: string): Promise<void> {
    if (this.isConnected && this.organizationId === organizationId) {
      devLog('[Realtime] Already connected to organization:', organizationId);
      return;
    }

    // Disconnect existing connection
    this.disconnect();

    this.organizationId = organizationId;
    this.userId = userId;

    try {
      const token = await getAuthToken();

      this.pusher = new Pusher(APP_KEY, {
        cluster: APP_CLUSTER,
        wsHost: WS_HOST,
        wsPort: WS_PORT,
        wssPort: WS_PORT,
        forceTLS: true,
        enabledTransports: ['ws', 'wss'],
        authEndpoint: `https://${WS_HOST}/api/broadcasting/auth`,
        auth: {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-App': 'systemsf1rst-mobile',
          },
        },
      });

      // Connection state handlers
      this.pusher.connection.bind('connected', () => {
        devLog('[Realtime] Connected to WebSocket');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.notifyConnectionListeners(true);
        this.subscribeToChannels();
      });

      this.pusher.connection.bind('disconnected', () => {
        devLog('[Realtime] Disconnected from WebSocket');
        this.isConnected = false;
        this.notifyConnectionListeners(false);
        this.attemptReconnect();
      });

      this.pusher.connection.bind('error', (error: any) => {
        console.error('[Realtime] Connection error:', error);
        this.notifyConnectionListeners(false);
      });

      this.pusher.connection.bind('unavailable', () => {
        console.warn('[Realtime] Connection unavailable');
        this.isConnected = false;
        this.notifyConnectionListeners(false);
      });

    } catch (error) {
      console.error('[Realtime] Failed to connect:', error);
      throw error;
    }
  }

  /**
   * Disconnect and cleanup
   */
  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    this.channels.forEach((channel, name) => {
      channel.unbind_all();
      this.pusher?.unsubscribe(name);
    });
    this.channels.clear();

    if (this.pusher) {
      this.pusher.disconnect();
      this.pusher = null;
    }

    this.isConnected = false;
    this.organizationId = null;
    this.userId = null;
    this.reconnectAttempts = 0;
    this.notifyConnectionListeners(false);
  }

  /**
   * Subscribe to relevant channels
   */
  private subscribeToChannels(): void {
    if (!this.pusher || !this.organizationId || !this.userId) return;

    // Private organization channel for CRM updates
    const orgChannel = this.subscribeToChannel(`private-organization.${this.organizationId}`);
    if (orgChannel) {
      // CRM events
      orgChannel.bind('crm.lead.created', (data: any) => this.handleCrmEvent('lead', 'created', data));
      orgChannel.bind('crm.lead.updated', (data: any) => this.handleCrmEvent('lead', 'updated', data));
      orgChannel.bind('crm.lead.deleted', (data: any) => this.handleCrmEvent('lead', 'deleted', data));
      orgChannel.bind('crm.contact.created', (data: any) => this.handleCrmEvent('contact', 'created', data));
      orgChannel.bind('crm.contact.updated', (data: any) => this.handleCrmEvent('contact', 'updated', data));
      orgChannel.bind('crm.contact.deleted', (data: any) => this.handleCrmEvent('contact', 'deleted', data));
      orgChannel.bind('crm.deal.created', (data: any) => this.handleCrmEvent('deal', 'created', data));
      orgChannel.bind('crm.deal.updated', (data: any) => this.handleCrmEvent('deal', 'updated', data));
      orgChannel.bind('crm.deal.deleted', (data: any) => this.handleCrmEvent('deal', 'deleted', data));
      orgChannel.bind('crm.communication.created', (data: any) => this.handleCrmEvent('communication', 'created', data));

      // Calendar events
      orgChannel.bind('calendar.event.created', (data: any) => this.handleCalendarEvent('created', data));
      orgChannel.bind('calendar.event.updated', (data: any) => this.handleCalendarEvent('updated', data));
      orgChannel.bind('calendar.event.deleted', (data: any) => this.handleCalendarEvent('deleted', data));
    }

    // Private user channel for personal notifications
    const userChannel = this.subscribeToChannel(`private-user.${this.userId}`);
    if (userChannel) {
      userChannel.bind('notification', (data: any) => this.handleNotification(data));

      // Agent events
      userChannel.bind('agent.message', (data: any) => this.handleAgentEvent('message', data));
      userChannel.bind('agent.tool_call', (data: any) => this.handleAgentEvent('tool_call', data));
      userChannel.bind('agent.approval_required', (data: any) => this.handleAgentEvent('approval_required', data));
      userChannel.bind('agent.session_ended', (data: any) => this.handleAgentEvent('session_ended', data));
    }

    // Presence channel for online status (optional)
    const presenceChannel = this.subscribeToChannel(`presence-organization.${this.organizationId}`);
    if (presenceChannel) {
      presenceChannel.bind('pusher:member_added', (member: any) => {
        devLog('[Realtime] Member joined:', member.id);
      });
      presenceChannel.bind('pusher:member_removed', (member: any) => {
        devLog('[Realtime] Member left:', member.id);
      });
    }
  }

  /**
   * Subscribe to a channel
   */
  private subscribeToChannel(channelName: string): Channel | null {
    if (!this.pusher) return null;

    if (this.channels.has(channelName)) {
      return this.channels.get(channelName)!;
    }

    const channel = this.pusher.subscribe(channelName);
    this.channels.set(channelName, channel);

    channel.bind('pusher:subscription_error', (error: any) => {
      console.error(`[Realtime] Subscription error for ${channelName}:`, error);
    });

    channel.bind('pusher:subscription_succeeded', () => {
      console.log(`[Realtime] Subscribed to ${channelName}`);
    });

    return channel;
  }

  /**
   * Attempt to reconnect after disconnection
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[Realtime] Max reconnection attempts reached');
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectAttempts++;

    console.log(`[Realtime] Attempting reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);

    this.reconnectTimeout = setTimeout(() => {
      if (this.organizationId && this.userId && !this.isConnected) {
        this.connect(this.organizationId, this.userId);
      }
    }, delay);
  }

  // Event handlers
  private handleCrmEvent(entity: CrmUpdateEvent['entity'], action: CrmUpdateEvent['action'], data: any): void {
    const event: CrmUpdateEvent = { entity, action, data };
    devLog('[Realtime] CRM event:', event);
    this.crmListeners.forEach(listener => listener(event));
  }

  private handleCalendarEvent(action: CalendarUpdateEvent['action'], data: any): void {
    const event: CalendarUpdateEvent = { action, event: data };
    devLog('[Realtime] Calendar event:', event);
    this.calendarListeners.forEach(listener => listener(event));
  }

  private handleAgentEvent(type: AgentUpdateEvent['type'], data: any): void {
    const event: AgentUpdateEvent = { type, sessionId: data.session_id, data };
    devLog('[Realtime] Agent event:', event);
    this.agentListeners.forEach(listener => listener(event));
  }

  private handleNotification(data: any): void {
    const event: NotificationEvent = {
      id: data.id,
      type: data.type,
      title: data.title,
      body: data.body,
      data: data.data,
    };
    devLog('[Realtime] Notification:', event);
    this.notificationListeners.forEach(listener => listener(event));
  }

  private notifyConnectionListeners(connected: boolean): void {
    this.connectionListeners.forEach(listener => listener(connected));
  }

  // Subscription methods
  onCrmUpdate(callback: EventCallback<CrmUpdateEvent>): () => void {
    this.crmListeners.push(callback);
    return () => {
      this.crmListeners = this.crmListeners.filter(l => l !== callback);
    };
  }

  onCalendarUpdate(callback: EventCallback<CalendarUpdateEvent>): () => void {
    this.calendarListeners.push(callback);
    return () => {
      this.calendarListeners = this.calendarListeners.filter(l => l !== callback);
    };
  }

  onAgentUpdate(callback: EventCallback<AgentUpdateEvent>): () => void {
    this.agentListeners.push(callback);
    return () => {
      this.agentListeners = this.agentListeners.filter(l => l !== callback);
    };
  }

  onNotification(callback: EventCallback<NotificationEvent>): () => void {
    this.notificationListeners.push(callback);
    return () => {
      this.notificationListeners = this.notificationListeners.filter(l => l !== callback);
    };
  }

  onConnectionChange(callback: EventCallback<boolean>): () => void {
    this.connectionListeners.push(callback);
    return () => {
      this.connectionListeners = this.connectionListeners.filter(l => l !== callback);
    };
  }

  // Getters
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  getOrganizationId(): string | null {
    return this.organizationId;
  }
}

// Singleton instance
export const realtimeService = new RealtimeService();

export default realtimeService;
