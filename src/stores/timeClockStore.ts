import { create } from 'zustand';
import { api } from '../lib/api';
import { Alert } from 'react-native';

export interface TimeClock {
  id: number;
  user_id: number;
  organization_id: number;
  clock_in_at: string;
  clock_out_at: string | null;
  clock_in_location_name: string | null;
  clock_out_location_name: string | null;
  total_hours: number | null;
  regular_hours: number | null;
  overtime_hours: number | null;
  status: 'clocked_in' | 'clocked_out' | 'approved' | 'rejected';
  notes: string | null;
}

export interface WeeklySummary {
  total_hours: number;
  regular_hours: number;
  overtime_hours: number;
  by_day: Record<string, number>;
  entries_count: number;
}

interface ClockInData {
  latitude?: number;
  longitude?: number;
  location_name?: string;
  notes?: string;
}

interface TimeClockState {
  currentClock: TimeClock | null;
  isClockedIn: boolean;
  weeklySummary: WeeklySummary | null;
  todayEntries: TimeClock[];
  history: TimeClock[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchStatus: () => Promise<void>;
  clockIn: (data: ClockInData) => Promise<boolean>;
  clockOut: (data: ClockInData) => Promise<boolean>;
  fetchHistory: (params?: { start_date?: string; end_date?: string }) => Promise<void>;
  fetchSummary: (period?: 'week' | 'month') => Promise<void>;
}

export const useTimeClockStore = create<TimeClockState>((set, get) => ({
  currentClock: null,
  isClockedIn: false,
  weeklySummary: null,
  todayEntries: [],
  history: [],
  isLoading: false,
  error: null,

  fetchStatus: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/time-clock/status');
      const { is_clocked_in, current_clock, today, this_week } = response.data;

      set({
        isClockedIn: is_clocked_in,
        currentClock: current_clock,
        todayEntries: today?.entries || [],
        weeklySummary: this_week,
        isLoading: false,
      });
    } catch (error: any) {
      console.error('Failed to fetch time clock status:', error);
      set({
        isLoading: false,
        error: error.response?.data?.message || 'Failed to fetch status',
      });
    }
  },

  clockIn: async (data: ClockInData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/time-clock/clock-in', data);

      if (response.data.success) {
        set({
          isClockedIn: true,
          currentClock: response.data.clock_in,
          isLoading: false,
        });
        return true;
      } else {
        Alert.alert('Clock In Failed', response.data.message);
        set({ isLoading: false, error: response.data.message });
        return false;
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to clock in';
      Alert.alert('Clock In Failed', message);
      set({ isLoading: false, error: message });
      return false;
    }
  },

  clockOut: async (data: ClockInData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/time-clock/clock-out', data);

      if (response.data.success) {
        set({
          isClockedIn: false,
          currentClock: null,
          isLoading: false,
        });

        // Refresh status to update totals
        get().fetchStatus();

        Alert.alert(
          'Clocked Out',
          `Total time: ${response.data.duration}\nHours: ${response.data.total_hours}`
        );
        return true;
      } else {
        Alert.alert('Clock Out Failed', response.data.message);
        set({ isLoading: false, error: response.data.message });
        return false;
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to clock out';
      Alert.alert('Clock Out Failed', message);
      set({ isLoading: false, error: message });
      return false;
    }
  },

  fetchHistory: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/time-clock/history', { params });
      const entries = response.data.entries?.data || response.data.entries || [];

      set({
        history: entries,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.message || 'Failed to fetch history',
      });
    }
  },

  fetchSummary: async (period = 'week') => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/time-clock/summary', { params: { period } });

      set({
        weeklySummary: response.data.summary,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.message || 'Failed to fetch summary',
      });
    }
  },
}));
