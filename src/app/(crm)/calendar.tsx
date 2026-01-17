// Calendar Screen - Month view with events
import { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCalendarStore, CalendarEvent } from '../../stores/calendarStore';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function CalendarScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const {
    events,
    eventsLoading,
    selectedDate,
    viewMode,
    setSelectedDate,
    setViewMode,
    fetchMonthEvents,
    getEventsForDate,
    fetchConnectedCalendars,
    connectedCalendars,
  } = useCalendarStore();

  useEffect(() => {
    fetchMonthEvents(selectedDate);
    fetchConnectedCalendars();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMonthEvents(selectedDate);
    setRefreshing(false);
  };

  // Calculate calendar grid
  const calendarDays = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPad = firstDay.getDay();
    const days: Date[] = [];

    // Previous month padding
    for (let i = startPad - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      days.push(d);
    }

    // Current month days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    // Next month padding
    const remaining = 42 - days.length; // 6 rows
    for (let i = 1; i <= remaining; i++) {
      days.push(new Date(year, month + 1, i));
    }

    return days;
  }, [selectedDate]);

  const selectedDateEvents = useMemo(() => {
    return getEventsForDate(selectedDate);
  }, [selectedDate, events]);

  const navigateMonth = (direction: number) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date) => {
    return date.toDateString() === selectedDate.toDateString();
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === selectedDate.getMonth();
  };

  const getEventColor = (event: CalendarEvent) => {
    if (event.color) return event.color;
    switch (event.source) {
      case 'google': return '#4285F4';
      case 'apple': return '#FF3B30';
      case 'outlook': return '#0078D4';
      default: return '#8B5CF6';
    }
  };

  const formatEventTime = (event: CalendarEvent) => {
    if (event.all_day) return 'All day';
    const start = new Date(event.start_time);
    return start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getDayEvents = (date: Date) => {
    return getEventsForDate(date);
  };

  const renderCalendarDay = (date: Date, index: number) => {
    const dayEvents = getDayEvents(date);
    const hasEvents = dayEvents.length > 0;

    return (
      <TouchableOpacity
        key={index}
        style={[
          styles.calendarDay,
          isSelected(date) && styles.selectedDay,
          !isCurrentMonth(date) && styles.otherMonthDay,
        ]}
        onPress={() => setSelectedDate(date)}
      >
        <Text style={[
          styles.dayNumber,
          isToday(date) && styles.todayNumber,
          isSelected(date) && styles.selectedDayNumber,
          !isCurrentMonth(date) && styles.otherMonthDayNumber,
        ]}>
          {date.getDate()}
        </Text>
        {hasEvents && (
          <View style={styles.eventDotsContainer}>
            {dayEvents.slice(0, 3).map((event, idx) => (
              <View
                key={idx}
                style={[styles.eventDot, { backgroundColor: getEventColor(event) }]}
              />
            ))}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderEvent = (event: CalendarEvent) => (
    <TouchableOpacity
      key={event.id}
      style={[styles.eventCard, { borderLeftColor: getEventColor(event) }]}
      onPress={() => router.push({ pathname: '/(crm)/event-detail', params: { eventId: event.id } })}
    >
      <View style={styles.eventTimeContainer}>
        <Text style={styles.eventTime}>{formatEventTime(event)}</Text>
      </View>
      <View style={styles.eventInfo}>
        <Text style={styles.eventTitle} numberOfLines={1}>{event.title}</Text>
        {event.location && (
          <View style={styles.eventLocationRow}>
            <Ionicons name="location-outline" size={12} color="#64748B" />
            <Text style={styles.eventLocation} numberOfLines={1}>{event.location}</Text>
          </View>
        )}
        {(event.contact_name || event.deal_name) && (
          <View style={styles.eventLinksRow}>
            {event.contact_name && (
              <View style={styles.eventLink}>
                <Ionicons name="person-outline" size={12} color="#8B5CF6" />
                <Text style={styles.eventLinkText}>{event.contact_name}</Text>
              </View>
            )}
            {event.deal_name && (
              <View style={styles.eventLink}>
                <Ionicons name="briefcase-outline" size={12} color="#22C55E" />
                <Text style={styles.eventLinkText}>{event.deal_name}</Text>
              </View>
            )}
          </View>
        )}
      </View>
      <Ionicons name="chevron-forward" size={20} color="#64748B" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>{MONTHS[selectedDate.getMonth()]}</Text>
          <Text style={styles.headerSubtitle}>{selectedDate.getFullYear()}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.todayBtn} onPress={goToToday}>
            <Text style={styles.todayBtnText}>Today</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => router.push('/(crm)/calendar-sync')}
          >
            <Ionicons name="sync" size={22} color="#FFFFFF" />
            {connectedCalendars.length > 0 && (
              <View style={styles.syncBadge}>
                <Text style={styles.syncBadgeText}>{connectedCalendars.length}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => router.push({ pathname: '/(crm)/event-detail', params: { eventId: 'new' } })}
          >
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8B5CF6" />
        }
      >
        {/* Month Navigation */}
        <View style={styles.monthNav}>
          <TouchableOpacity style={styles.navBtn} onPress={() => navigateMonth(-1)}>
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.monthNavTitle}>
            {MONTHS[selectedDate.getMonth()]} {selectedDate.getFullYear()}
          </Text>
          <TouchableOpacity style={styles.navBtn} onPress={() => navigateMonth(1)}>
            <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Calendar Grid */}
        <View style={styles.calendarContainer}>
          {/* Day Headers */}
          <View style={styles.dayHeaders}>
            {DAYS.map((day) => (
              <View key={day} style={styles.dayHeader}>
                <Text style={styles.dayHeaderText}>{day}</Text>
              </View>
            ))}
          </View>

          {/* Calendar Days */}
          <View style={styles.calendarGrid}>
            {calendarDays.map((date, index) => renderCalendarDay(date, index))}
          </View>
        </View>

        {/* Selected Date Events */}
        <View style={styles.eventsSection}>
          <View style={styles.eventsSectionHeader}>
            <Text style={styles.eventsSectionTitle}>
              {isToday(selectedDate) ? 'Today' : selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </Text>
            <Text style={styles.eventsSectionCount}>
              {selectedDateEvents.length} event{selectedDateEvents.length !== 1 ? 's' : ''}
            </Text>
          </View>

          {eventsLoading && selectedDateEvents.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#8B5CF6" />
            </View>
          ) : selectedDateEvents.length === 0 ? (
            <View style={styles.noEventsContainer}>
              <Ionicons name="calendar-outline" size={40} color="#334155" />
              <Text style={styles.noEventsText}>No events scheduled</Text>
              <TouchableOpacity
                style={styles.addEventBtn}
                onPress={() => router.push({ pathname: '/(crm)/event-detail', params: { eventId: 'new' } })}
              >
                <Ionicons name="add" size={18} color="#8B5CF6" />
                <Text style={styles.addEventBtnText}>Add Event</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.eventsList}>
              {selectedDateEvents.map(renderEvent)}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#FFFFFF' },
  headerSubtitle: { fontSize: 14, color: '#94A3B8' },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  todayBtn: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  todayBtnText: { color: '#FFFFFF', fontWeight: '500', fontSize: 14 },
  headerBtn: { padding: 8, marginRight: 4, position: 'relative' },
  syncBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#22C55E',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  syncBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '600' },
  addBtn: {
    backgroundColor: '#8B5CF6',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  content: { flex: 1 },

  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  navBtn: { padding: 8 },
  monthNavTitle: { fontSize: 18, fontWeight: '600', color: '#FFFFFF' },

  calendarContainer: { paddingHorizontal: 8 },
  dayHeaders: { flexDirection: 'row' },
  dayHeader: { flex: 1, alignItems: 'center', paddingVertical: 10 },
  dayHeaderText: { fontSize: 12, fontWeight: '600', color: '#64748B' },

  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  selectedDay: {
    backgroundColor: '#8B5CF620',
    borderRadius: 12,
  },
  otherMonthDay: { opacity: 0.4 },
  dayNumber: { fontSize: 16, fontWeight: '500', color: '#FFFFFF' },
  todayNumber: { color: '#8B5CF6', fontWeight: '700' },
  selectedDayNumber: { color: '#8B5CF6' },
  otherMonthDayNumber: { color: '#64748B' },
  eventDotsContainer: {
    flexDirection: 'row',
    marginTop: 4,
    height: 6,
  },
  eventDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 1,
  },

  eventsSection: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 40,
  },
  eventsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  eventsSectionTitle: { fontSize: 18, fontWeight: '600', color: '#FFFFFF' },
  eventsSectionCount: { fontSize: 14, color: '#64748B' },

  loadingContainer: { paddingVertical: 40, alignItems: 'center' },

  noEventsContainer: { alignItems: 'center', paddingVertical: 40 },
  noEventsText: { color: '#64748B', fontSize: 16, marginTop: 12 },
  addEventBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 16,
  },
  addEventBtnText: { color: '#8B5CF6', fontWeight: '500', marginLeft: 6 },

  eventsList: {},
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 4,
  },
  eventTimeContainer: { width: 60, marginRight: 12 },
  eventTime: { fontSize: 13, fontWeight: '600', color: '#8B5CF6' },
  eventInfo: { flex: 1 },
  eventTitle: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
  eventLocationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  eventLocation: { fontSize: 12, color: '#64748B', marginLeft: 4, flex: 1 },
  eventLinksRow: { flexDirection: 'row', marginTop: 6 },
  eventLink: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginRight: 8,
  },
  eventLinkText: { fontSize: 11, color: '#94A3B8', marginLeft: 4 },
});
