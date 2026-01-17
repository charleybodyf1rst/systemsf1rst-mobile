// Calendar Store for SystemsF1RST Mobile
// Manages calendar events, external calendar sync, and views

import { create } from 'zustand';
import api from '../lib/api';

// Types
export interface Attendee {
  id: number;
  name: string;
  email: string;
  status: 'pending' | 'accepted' | 'declined' | 'tentative';
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  all_day: boolean;
  location?: string;
  attendees?: Attendee[];
  contact_id?: number;
  contact_name?: string;
  deal_id?: number;
  deal_name?: string;
  reminder_minutes?: number;
  color?: string;
  external_id?: string;
  source: 'local' | 'google' | 'apple' | 'outlook';
  created_at: string;
  updated_at: string;
}

export interface ExternalCalendar {
  id: string;
  provider: 'google' | 'apple' | 'outlook';
  email: string;
  name: string;
  color: string;
  is_synced: boolean;
  is_primary: boolean;
  last_synced_at?: string;
}

export interface CreateEventParams {
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  all_day?: boolean;
  location?: string;
  attendees?: string[]; // emails
  contact_id?: number;
  deal_id?: number;
  reminder_minutes?: number;
  color?: string;
}

type ViewMode = 'month' | 'week' | 'day';

interface CalendarState {
  // Events
  events: CalendarEvent[];
  eventsLoading: boolean;
  eventsError: string | null;

  // Selected state
  selectedDate: Date;
  viewMode: ViewMode;
  selectedEvent: CalendarEvent | null;

  // External calendars
  connectedCalendars: ExternalCalendar[];
  calendarsLoading: boolean;

  // Actions
  fetchEvents: (startDate: Date, endDate: Date) => Promise<void>;
  fetchMonthEvents: (date: Date) => Promise<void>;
  fetchWeekEvents: (date: Date) => Promise<void>;
  fetchDayEvents: (date: Date) => Promise<void>;
  createEvent: (params: CreateEventParams) => Promise<CalendarEvent>;
  updateEvent: (eventId: string, updates: Partial<CreateEventParams>) => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;
  fetchConnectedCalendars: () => Promise<void>;
  connectExternalCalendar: (provider: 'google' | 'apple' | 'outlook') => Promise<string>;
  disconnectExternalCalendar: (calendarId: string) => Promise<void>;
  syncExternalCalendar: (calendarId: string) => Promise<void>;
  setViewMode: (mode: ViewMode) => void;
  setSelectedDate: (date: Date) => void;
  setSelectedEvent: (event: CalendarEvent | null) => void;
  refreshEvents: () => void;
  getEventsForDate: (date: Date) => CalendarEvent[];
}

// Helper functions
const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

const getMonthRange = (date: Date) => {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return { start, end };
};

const getWeekRange = (date: Date) => {
  const start = new Date(date);
  start.setDate(date.getDate() - date.getDay());
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start, end };
};

export const useCalendarStore = create<CalendarState>((set, get) => ({
  // Initial state
  events: [],
  eventsLoading: false,
  eventsError: null,

  selectedDate: new Date(),
  viewMode: 'month',
  selectedEvent: null,

  connectedCalendars: [],
  calendarsLoading: false,

  // Fetch events in date range
  fetchEvents: async (startDate: Date, endDate: Date) => {
    set({ eventsLoading: true, eventsError: null });
    try {
      const response = await api.get('/calendar/events', {
        params: {
          start: formatDate(startDate),
          end: formatDate(endDate),
        },
      });
      const events = response.data.data || response.data || [];
      set({ events, eventsLoading: false });
    } catch (error: any) {
      console.error('Failed to fetch events:', error);
      set({ eventsError: error.message, eventsLoading: false });
    }
  },

  // Fetch month events
  fetchMonthEvents: async (date: Date) => {
    const { start, end } = getMonthRange(date);
    // Extend range to include days from prev/next month visible in calendar
    start.setDate(start.getDate() - 7);
    end.setDate(end.getDate() + 7);
    await get().fetchEvents(start, end);
  },

  // Fetch week events
  fetchWeekEvents: async (date: Date) => {
    const { start, end } = getWeekRange(date);
    await get().fetchEvents(start, end);
  },

  // Fetch day events
  fetchDayEvents: async (date: Date) => {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    await get().fetchEvents(start, end);
  },

  // Create event
  createEvent: async (params: CreateEventParams) => {
    try {
      const response = await api.post('/calendar/events', params);
      const event = response.data.data || response.data;

      set({ events: [...get().events, event] });
      return event;
    } catch (error: any) {
      console.error('Failed to create event:', error);
      throw error;
    }
  },

  // Update event
  updateEvent: async (eventId: string, updates: Partial<CreateEventParams>) => {
    try {
      const response = await api.put(`/calendar/events/${eventId}`, updates);
      const updatedEvent = response.data.data || response.data;

      set({
        events: get().events.map(e => e.id === eventId ? updatedEvent : e),
        selectedEvent: get().selectedEvent?.id === eventId ? updatedEvent : get().selectedEvent,
      });
    } catch (error: any) {
      console.error('Failed to update event:', error);
      throw error;
    }
  },

  // Delete event
  deleteEvent: async (eventId: string) => {
    try {
      await api.delete(`/calendar/events/${eventId}`);

      set({
        events: get().events.filter(e => e.id !== eventId),
        selectedEvent: get().selectedEvent?.id === eventId ? null : get().selectedEvent,
      });
    } catch (error: any) {
      console.error('Failed to delete event:', error);
      throw error;
    }
  },

  // Fetch connected calendars
  fetchConnectedCalendars: async () => {
    set({ calendarsLoading: true });
    try {
      const response = await api.get('/calendar-sync/calendars');
      const calendars = response.data.data || response.data || [];
      set({ connectedCalendars: calendars, calendarsLoading: false });
    } catch (error: any) {
      console.error('Failed to fetch calendars:', error);
      set({ calendarsLoading: false });
    }
  },

  // Connect external calendar (returns OAuth URL)
  connectExternalCalendar: async (provider: 'google' | 'apple' | 'outlook') => {
    try {
      const response = await api.get(`/calendar-sync/oauth/${provider}/authorize`);
      return response.data.url || response.data.data?.url;
    } catch (error: any) {
      console.error('Failed to get OAuth URL:', error);
      throw error;
    }
  },

  // Disconnect external calendar
  disconnectExternalCalendar: async (calendarId: string) => {
    try {
      await api.delete(`/calendar-sync/calendars/${calendarId}`);
      set({
        connectedCalendars: get().connectedCalendars.filter(c => c.id !== calendarId),
      });
    } catch (error: any) {
      console.error('Failed to disconnect calendar:', error);
      throw error;
    }
  },

  // Sync external calendar
  syncExternalCalendar: async (calendarId: string) => {
    try {
      await api.post(`/calendar-sync/calendars/${calendarId}/sync`);

      // Update last synced time
      set({
        connectedCalendars: get().connectedCalendars.map(c =>
          c.id === calendarId
            ? { ...c, last_synced_at: new Date().toISOString() }
            : c
        ),
      });

      // Refresh events
      const { selectedDate, viewMode } = get();
      if (viewMode === 'month') {
        await get().fetchMonthEvents(selectedDate);
      } else if (viewMode === 'week') {
        await get().fetchWeekEvents(selectedDate);
      } else {
        await get().fetchDayEvents(selectedDate);
      }
    } catch (error: any) {
      console.error('Failed to sync calendar:', error);
      throw error;
    }
  },

  // Set view mode
  setViewMode: (mode: ViewMode) => {
    set({ viewMode: mode });
    const { selectedDate } = get();
    if (mode === 'month') {
      get().fetchMonthEvents(selectedDate);
    } else if (mode === 'week') {
      get().fetchWeekEvents(selectedDate);
    } else {
      get().fetchDayEvents(selectedDate);
    }
  },

  // Set selected date
  setSelectedDate: (date: Date) => {
    set({ selectedDate: date });
    const { viewMode } = get();
    if (viewMode === 'month') {
      get().fetchMonthEvents(date);
    } else if (viewMode === 'week') {
      get().fetchWeekEvents(date);
    } else {
      get().fetchDayEvents(date);
    }
  },

  // Set selected event
  setSelectedEvent: (event: CalendarEvent | null) => {
    set({ selectedEvent: event });
  },

  // Refresh events based on current view mode
  refreshEvents: () => {
    const { selectedDate, viewMode } = get();
    if (viewMode === 'month') {
      get().fetchMonthEvents(selectedDate);
    } else if (viewMode === 'week') {
      get().fetchWeekEvents(selectedDate);
    } else {
      get().fetchDayEvents(selectedDate);
    }
  },

  // Get events for specific date
  getEventsForDate: (date: Date) => {
    const dateStr = formatDate(date);
    return get().events.filter(event => {
      const eventStart = event.start_time.split('T')[0];
      const eventEnd = event.end_time.split('T')[0];
      return dateStr >= eventStart && dateStr <= eventEnd;
    });
  },
}));
