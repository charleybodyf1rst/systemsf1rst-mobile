// Calendar Widget Component for Mobile Dashboard
// Shows today's events and quick access to calendar

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCalendarStore, CalendarEvent } from '../stores/calendarStore';

interface CalendarWidgetProps {
  maxEvents?: number;
  showHeader?: boolean;
}

export default function CalendarWidget({
  maxEvents = 3,
  showHeader = true,
}: CalendarWidgetProps) {
  const router = useRouter();
  const { events, eventsLoading, fetchDayEvents, getEventsForDate } = useCalendarStore();

  // Fetch today's events on mount
  useEffect(() => {
    fetchDayEvents(new Date());
  }, []);

  const todayEvents = getEventsForDate(new Date());
  const displayEvents = todayEvents.slice(0, maxEvents);

  const formatEventTime = (event: CalendarEvent) => {
    if (event.all_day) return 'All Day';

    const date = new Date(event.start_time);
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  const getEventColor = (source: CalendarEvent['source']) => {
    const colors: Record<CalendarEvent['source'], string> = {
      local: '#8B5CF6',
      google: '#4285F4',
      apple: '#64748B',
      outlook: '#0078D4',
    };
    return colors[source];
  };

  const navigateToCalendar = () => {
    router.push('/(crm)/calendar');
  };

  return (
    <View style={styles.container}>
      {showHeader && (
        <TouchableOpacity style={styles.header} onPress={navigateToCalendar}>
          <View style={styles.headerLeft}>
            <Ionicons name="calendar" size={20} color="#8B5CF6" />
            <Text style={styles.headerTitle}>Today's Schedule</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.eventCount}>{todayEvents.length}</Text>
            <Ionicons name="chevron-forward" size={16} color="#64748B" />
          </View>
        </TouchableOpacity>
      )}

      <View style={styles.content}>
        {eventsLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#8B5CF6" />
          </View>
        ) : displayEvents.length > 0 ? (
          <>
            {displayEvents.map((event) => (
              <TouchableOpacity
                key={event.id}
                style={styles.eventItem}
                onPress={navigateToCalendar}
              >
                <View
                  style={[
                    styles.eventIndicator,
                    { backgroundColor: getEventColor(event.source) },
                  ]}
                />
                <View style={styles.eventContent}>
                  <Text style={styles.eventTime}>{formatEventTime(event)}</Text>
                  <Text style={styles.eventTitle} numberOfLines={1}>
                    {event.title}
                  </Text>
                  {event.location && (
                    <View style={styles.locationRow}>
                      <Ionicons name="location-outline" size={12} color="#64748B" />
                      <Text style={styles.eventLocation} numberOfLines={1}>
                        {event.location}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}

            {todayEvents.length > maxEvents && (
              <TouchableOpacity
                style={styles.moreButton}
                onPress={navigateToCalendar}
              >
                <Text style={styles.moreButtonText}>
                  +{todayEvents.length - maxEvents} more events
                </Text>
              </TouchableOpacity>
            )}
          </>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={32} color="#475569" />
            <Text style={styles.emptyText}>No events today</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={navigateToCalendar}
            >
              <Text style={styles.addButtonText}>Add Event</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eventCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B5CF6',
    backgroundColor: '#8B5CF620',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  content: {
    padding: 12,
  },
  loadingContainer: {
    padding: 24,
    alignItems: 'center',
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  eventIndicator: {
    width: 4,
    height: '100%',
    minHeight: 40,
    borderRadius: 2,
    marginRight: 12,
  },
  eventContent: {
    flex: 1,
  },
  eventTime: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8B5CF6',
    marginBottom: 2,
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#F8FAFC',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  eventLocation: {
    fontSize: 12,
    color: '#64748B',
    flex: 1,
  },
  moreButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  moreButtonText: {
    fontSize: 14,
    color: '#8B5CF6',
    fontWeight: '500',
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 8,
    marginBottom: 12,
  },
  addButton: {
    backgroundColor: '#8B5CF620',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8B5CF6',
  },
});
