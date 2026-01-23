import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useHRStore, Schedule } from '../../stores';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const shiftTypeColors = {
  regular: { bg: '#3B82F620', text: '#3B82F6', label: 'Regular' },
  overtime: { bg: '#F59E0B20', text: '#F59E0B', label: 'Overtime' },
  on_call: { bg: '#8B5CF620', text: '#8B5CF6', label: 'On Call' },
};

const statusColors = {
  scheduled: { bg: '#64748B20', text: '#64748B', label: 'Scheduled' },
  confirmed: { bg: '#10B98120', text: '#10B981', label: 'Confirmed' },
  completed: { bg: '#3B82F620', text: '#3B82F6', label: 'Completed' },
  cancelled: { bg: '#EF444420', text: '#EF4444', label: 'Cancelled' },
};

function ScheduleCard({ schedule }: { schedule: Schedule }) {
  const shiftType = shiftTypeColors[schedule.shiftType];
  const status = statusColors[schedule.status];
  const date = new Date(schedule.date);

  return (
    <TouchableOpacity style={styles.scheduleCard} activeOpacity={0.7}>
      <View style={styles.dateColumn}>
        <Text style={styles.dayName}>{DAYS[date.getDay()]}</Text>
        <Text style={styles.dayNumber}>{date.getDate()}</Text>
      </View>

      <View style={styles.scheduleContent}>
        <View style={styles.scheduleHeader}>
          <Text style={styles.employeeName}>{schedule.employeeName}</Text>
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <Text style={[styles.statusText, { color: status.text }]}>{status.label}</Text>
          </View>
        </View>

        <View style={styles.scheduleDetails}>
          <View style={styles.detailItem}>
            <Ionicons name="time" size={14} color="#64748B" />
            <Text style={styles.detailText}>
              {schedule.startTime} - {schedule.endTime}
            </Text>
          </View>
          <View style={[styles.shiftBadge, { backgroundColor: shiftType.bg }]}>
            <Text style={[styles.shiftText, { color: shiftType.text }]}>{shiftType.label}</Text>
          </View>
        </View>

        {schedule.notes && (
          <Text style={styles.scheduleNotes} numberOfLines={1}>
            {schedule.notes}
          </Text>
        )}
      </View>

      <TouchableOpacity style={styles.moreButton}>
        <Ionicons name="ellipsis-vertical" size={18} color="#64748B" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

function WeekSelector({
  currentDate,
  onPrev,
  onNext,
  onToday,
}: {
  currentDate: Date;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}) {
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  const formatDate = (date: Date) =>
    date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <View style={styles.weekSelector}>
      <TouchableOpacity onPress={onPrev} style={styles.weekNavButton}>
        <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
      </TouchableOpacity>

      <TouchableOpacity onPress={onToday} style={styles.weekDisplay}>
        <Text style={styles.weekText}>
          {formatDate(startOfWeek)} - {formatDate(endOfWeek)}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={onNext} style={styles.weekNavButton}>
        <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

export default function SchedulesScreen() {
  const { schedules, employees, schedulesLoading, fetchSchedules, fetchEmployees } = useHRStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchSchedules();
    fetchEmployees();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSchedules();
    setRefreshing(false);
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDay(null);
  };

  // Get week days
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + i);
    return day;
  });

  // Filter schedules for selected day or all week
  const filteredSchedules = schedules.filter((schedule) => {
    const scheduleDate = new Date(schedule.date);
    if (selectedDay !== null) {
      const selectedDate = weekDays[selectedDay];
      return scheduleDate.toDateString() === selectedDate.toDateString();
    }
    // Show all schedules for the week
    return weekDays.some((d) => scheduleDate.toDateString() === d.toDateString());
  });

  // Group schedules by day
  const schedulesByDay = weekDays.map((day) => ({
    date: day,
    schedules: schedules.filter(
      (s) => new Date(s.date).toDateString() === day.toDateString()
    ),
  }));

  const today = new Date();
  const isToday = (date: Date) => date.toDateString() === today.toDateString();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Team Schedules</Text>
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Week Selector */}
      <WeekSelector
        currentDate={currentDate}
        onPrev={() => navigateWeek('prev')}
        onNext={() => navigateWeek('next')}
        onToday={goToToday}
      />

      {/* Day Selector */}
      <View style={styles.daySelector}>
        {weekDays.map((day, index) => {
          const dayScheduleCount = schedulesByDay[index].schedules.length;
          const isSelected = selectedDay === index;
          const todayStyle = isToday(day);

          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.dayButton,
                isSelected && styles.dayButtonSelected,
                todayStyle && !isSelected && styles.dayButtonToday,
              ]}
              onPress={() => setSelectedDay(isSelected ? null : index)}
            >
              <Text
                style={[
                  styles.dayButtonText,
                  isSelected && styles.dayButtonTextSelected,
                ]}
              >
                {DAYS[day.getDay()]}
              </Text>
              <Text
                style={[
                  styles.dayButtonNumber,
                  isSelected && styles.dayButtonTextSelected,
                  todayStyle && !isSelected && styles.dayButtonNumberToday,
                ]}
              >
                {day.getDate()}
              </Text>
              {dayScheduleCount > 0 && (
                <View
                  style={[
                    styles.dayBadge,
                    isSelected && styles.dayBadgeSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayBadgeText,
                      isSelected && styles.dayBadgeTextSelected,
                    ]}
                  >
                    {dayScheduleCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Ionicons name="people" size={18} color="#8B5CF6" />
          <Text style={styles.statValue}>{employees.length}</Text>
          <Text style={styles.statLabel}>Employees</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="calendar" size={18} color="#10B981" />
          <Text style={[styles.statValue, { color: '#10B981' }]}>
            {schedules.filter((s) => s.status === 'confirmed').length}
          </Text>
          <Text style={styles.statLabel}>Confirmed</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="time" size={18} color="#F59E0B" />
          <Text style={[styles.statValue, { color: '#F59E0B' }]}>
            {schedules.filter((s) => s.shiftType === 'overtime').length}
          </Text>
          <Text style={styles.statLabel}>Overtime</Text>
        </View>
      </View>

      {/* Schedule List */}
      {schedulesLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
        </View>
      ) : (
        <ScrollView
          style={styles.listContainer}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8B5CF6" />
          }
        >
          {filteredSchedules.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color="#64748B" />
              <Text style={styles.emptyText}>No schedules for this period</Text>
              <TouchableOpacity style={styles.emptyButton}>
                <Ionicons name="add" size={20} color="#FFFFFF" />
                <Text style={styles.emptyButtonText}>Create Schedule</Text>
              </TouchableOpacity>
            </View>
          ) : selectedDay !== null ? (
            // Show schedules for selected day
            filteredSchedules.map((schedule) => (
              <ScheduleCard key={schedule.id} schedule={schedule} />
            ))
          ) : (
            // Show schedules grouped by day
            schedulesByDay.map(
              ({ date, schedules: daySchedules }, index) =>
                daySchedules.length > 0 && (
                  <View key={index} style={styles.dayGroup}>
                    <Text style={styles.dayGroupTitle}>
                      {date.toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Text>
                    {daySchedules.map((schedule) => (
                      <ScheduleCard key={schedule.id} schedule={schedule} />
                    ))}
                  </View>
                )
            )
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  addButton: {
    padding: 8,
    backgroundColor: '#8B5CF6',
    borderRadius: 8,
  },
  weekSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 16,
  },
  weekNavButton: {
    padding: 8,
  },
  weekDisplay: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#1E293B',
    borderRadius: 8,
  },
  weekText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  daySelector: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 4,
  },
  dayButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#1E293B',
    gap: 2,
  },
  dayButtonSelected: {
    backgroundColor: '#8B5CF6',
  },
  dayButtonToday: {
    borderWidth: 1,
    borderColor: '#8B5CF6',
  },
  dayButtonText: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '500',
  },
  dayButtonTextSelected: {
    color: '#FFFFFF',
  },
  dayButtonNumber: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  dayButtonNumberToday: {
    color: '#8B5CF6',
  },
  dayBadge: {
    backgroundColor: '#8B5CF6',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 4,
  },
  dayBadgeSelected: {
    backgroundColor: '#FFFFFF',
  },
  dayBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  dayBadgeTextSelected: {
    color: '#8B5CF6',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 10,
    color: '#64748B',
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  dayGroup: {
    marginBottom: 16,
  },
  dayGroupTitle: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
  },
  scheduleCard: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    gap: 12,
  },
  dateColumn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 8,
  },
  dayName: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '500',
  },
  dayNumber: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  scheduleContent: {
    flex: 1,
  },
  scheduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  employeeName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  scheduleDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 6,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    color: '#94A3B8',
    fontSize: 13,
  },
  shiftBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  shiftText: {
    fontSize: 10,
    fontWeight: '600',
  },
  scheduleNotes: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 6,
  },
  moreButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    color: '#64748B',
    fontSize: 16,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
    marginTop: 8,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
