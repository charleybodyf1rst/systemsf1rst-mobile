import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Network from 'expo-network';
import { AxiosRequestConfig } from 'axios';
import { AppState, AppStateStatus } from 'react-native';
import api from './api';

// Dev-only logging helper
const devLog = (...args: unknown[]) => {
  if (__DEV__) {
    console.log(...args);
  }
};

// Storage key for persisted queue
const OFFLINE_QUEUE_KEY = 'sf_offline_queue';

// Queue item interface
export interface QueuedRequest {
  id: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  data?: unknown;
  headers?: Record<string, string>;
  retries: number;
  maxRetries: number;
  createdAt: number;
  lastAttempt?: number;
}

// Configuration
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;
const MAX_DELAY_MS = 30000;
const QUEUE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

// In-memory queue
let requestQueue: QueuedRequest[] = [];
let isProcessingQueue = false;
let isOnline = true;

// Listeners
type QueueChangeListener = (queue: QueuedRequest[]) => void;
const listeners: Set<QueueChangeListener> = new Set();

// Generate unique ID
const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Calculate exponential backoff delay
const getBackoffDelay = (retries: number): number => {
  const delay = BASE_DELAY_MS * Math.pow(2, retries);
  return Math.min(delay, MAX_DELAY_MS);
};

// Notify listeners
const notifyListeners = () => {
  listeners.forEach((listener) => listener([...requestQueue]));
};

// Load queue from storage
export const loadQueue = async (): Promise<void> => {
  try {
    const stored = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    if (stored) {
      const parsed: QueuedRequest[] = JSON.parse(stored);
      // Filter out expired items
      const now = Date.now();
      requestQueue = parsed.filter((item) => now - item.createdAt < QUEUE_EXPIRY_MS);
      notifyListeners();
    }
  } catch (error) {
    console.error('[OfflineQueue] Failed to load queue:', error);
  }
};

// Save queue to storage
const saveQueue = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(requestQueue));
  } catch (error) {
    console.error('[OfflineQueue] Failed to save queue:', error);
  }
};

// Add request to queue
export const queueRequest = async (config: AxiosRequestConfig): Promise<string> => {
  const queuedRequest: QueuedRequest = {
    id: generateId(),
    url: config.url || '',
    method: (config.method?.toUpperCase() as QueuedRequest['method']) || 'GET',
    data: config.data,
    headers: config.headers as Record<string, string>,
    retries: 0,
    maxRetries: MAX_RETRIES,
    createdAt: Date.now(),
  };

  requestQueue.push(queuedRequest);
  await saveQueue();
  notifyListeners();

  devLog('[OfflineQueue] Request queued:', queuedRequest.id, queuedRequest.method, queuedRequest.url);

  return queuedRequest.id;
};

// Remove request from queue
export const removeFromQueue = async (id: string): Promise<void> => {
  requestQueue = requestQueue.filter((req) => req.id !== id);
  await saveQueue();
  notifyListeners();
};

// Clear entire queue
export const clearQueue = async (): Promise<void> => {
  requestQueue = [];
  await saveQueue();
  notifyListeners();
};

// Get current queue
export const getQueue = (): QueuedRequest[] => {
  return [...requestQueue];
};

// Get queue count
export const getQueueCount = (): number => {
  return requestQueue.length;
};

// Process a single request
const processRequest = async (request: QueuedRequest): Promise<boolean> => {
  try {
    await api({
      url: request.url,
      method: request.method,
      data: request.data,
      headers: request.headers,
    });

    devLog('[OfflineQueue] Request succeeded:', request.id);
    return true;
  } catch (error) {
    console.error('[OfflineQueue] Request failed:', request.id, error);
    return false;
  }
};

// Process the entire queue
export const processQueue = async (): Promise<void> => {
  if (isProcessingQueue || !isOnline || requestQueue.length === 0) {
    return;
  }

  isProcessingQueue = true;
  devLog('[OfflineQueue] Processing queue, items:', requestQueue.length);

  const toProcess = [...requestQueue];

  for (const request of toProcess) {
    // Check if still online before each request
    const state = await Network.getNetworkStateAsync();
    if (!state.isConnected) {
      devLog('[OfflineQueue] Lost connection, stopping queue processing');
      isProcessingQueue = false;
      return;
    }

    // Check backoff delay
    if (request.lastAttempt) {
      const delay = getBackoffDelay(request.retries);
      const timeSinceLastAttempt = Date.now() - request.lastAttempt;
      if (timeSinceLastAttempt < delay) {
        continue; // Skip this request, not ready for retry yet
      }
    }

    const success = await processRequest(request);

    if (success) {
      await removeFromQueue(request.id);
    } else {
      // Update retry count
      const index = requestQueue.findIndex((r) => r.id === request.id);
      if (index !== -1) {
        requestQueue[index].retries += 1;
        requestQueue[index].lastAttempt = Date.now();

        // Remove if max retries exceeded
        if (requestQueue[index].retries >= requestQueue[index].maxRetries) {
          devLog('[OfflineQueue] Max retries exceeded, removing:', request.id);
          await removeFromQueue(request.id);
        } else {
          await saveQueue();
        }
      }
    }
  }

  isProcessingQueue = false;
  notifyListeners();
};

// Check if device is online
export const checkOnlineStatus = async (): Promise<boolean> => {
  try {
    const state = await Network.getNetworkStateAsync();
    isOnline = state.isConnected ?? false;
  } catch {
    isOnline = false;
  }
  return isOnline;
};

// Handle app state changes (to check network when app becomes active)
const handleAppStateChange = async (nextState: AppStateStatus): Promise<void> => {
  if (nextState === 'active') {
    const wasOffline = !isOnline;
    await checkOnlineStatus();

    devLog('[OfflineQueue] App became active, network status:', isOnline ? 'online' : 'offline');

    // Process queue when coming back online
    if (wasOffline && isOnline && requestQueue.length > 0) {
      devLog('[OfflineQueue] Back online, processing queue');
      setTimeout(() => processQueue(), 1000);
    }
  }
};

// Periodic network check interval
let networkCheckInterval: ReturnType<typeof setInterval> | null = null;
let appStateSubscription: ReturnType<typeof AppState.addEventListener> | null = null;

export const initOfflineQueue = async (): Promise<void> => {
  // Load persisted queue
  await loadQueue();

  // Check initial online status
  await checkOnlineStatus();

  // Subscribe to app state changes
  appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

  // Periodic network check every 30 seconds when queue has items
  networkCheckInterval = setInterval(async () => {
    if (requestQueue.length > 0) {
      const wasOffline = !isOnline;
      await checkOnlineStatus();

      if (wasOffline && isOnline) {
        devLog('[OfflineQueue] Network restored, processing queue');
        processQueue();
      }
    }
  }, 30000);

  // Process any pending requests if online
  if (isOnline && requestQueue.length > 0) {
    setTimeout(() => processQueue(), 2000);
  }

  devLog('[OfflineQueue] Initialized, queue size:', requestQueue.length, 'online:', isOnline);
};

// Cleanup
export const cleanupOfflineQueue = (): void => {
  if (appStateSubscription) {
    appStateSubscription.remove();
    appStateSubscription = null;
  }
  if (networkCheckInterval) {
    clearInterval(networkCheckInterval);
    networkCheckInterval = null;
  }
};

// Subscribe to queue changes
export const subscribeToQueueChanges = (listener: QueueChangeListener): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

// Check if online
export const isNetworkOnline = (): boolean => {
  return isOnline;
};

// Wrapper for API calls with offline support
export const makeOfflineAwareRequest = async <T>(
  config: AxiosRequestConfig
): Promise<T | { queued: true; queueId: string }> => {
  // Check network status
  const online = await checkOnlineStatus();

  if (!online) {
    // Queue the request for later
    const queueId = await queueRequest(config);
    return { queued: true, queueId };
  }

  try {
    const response = await api(config);
    return response.data;
  } catch (error) {
    // Check if it's a network error
    const isNetworkError =
      (error as { message?: string })?.message === 'Network Error' ||
      (error as { code?: string })?.code === 'ERR_NETWORK';

    if (isNetworkError) {
      // Queue the request for later
      const queueId = await queueRequest(config);
      return { queued: true, queueId };
    }

    throw error;
  }
};
