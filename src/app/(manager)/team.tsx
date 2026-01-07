import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../lib/api';

interface TeamEntry {
  id: number;
  user: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    avatar_url?: string;
  };
  clock_in_at: string;
  clock_out_at: string | null;
  total_hours: number | null;
  status: string;
  duration_formatted: string;
}

export default function TeamScreen() {
  const [entries, setEntries] = useState<TeamEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    fetchTeamEntries();
  }, [selectedDate]);

  const fetchTeamEntries = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/time-clock/team', {
        params: {
          date: selectedDate.toISOString().split('T')[0],
        },
      });
      setEntries(response.data.entries || []);
    } catch (error) {
      console.error('Failed to fetch team entries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    if (newDate <= new Date()) {
      setSelectedDate(newDate);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'clocked_in':
        return '#10B981';
      case 'approved':
        return '#3B82F6';
      case 'rejected':
        return '#EF4444';
      default:
        return '#F59E0B';
    }
  };

  const renderEntry = ({ item }: { item: TeamEntry }) => (
    <View style={styles.entryCard}>
      <View style={styles.entryHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {item.user.first_name[0]}{item.user.last_name[0]}
          </Text>
        </View>
        <View style={styles.entryInfo}>
          <Text style={styles.employeeName}>
            {item.user.first_name} {item.user.last_name}
          </Text>
          <Text style={styles.employeeEmail}>{item.user.email}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status.replace('_', ' ')}
          </Text>
        </View>
      </View>
      <View style={styles.entryDetails}>
        <View style={styles.timeBlock}>
          <Ionicons name="arrow-forward-circle" size={16} color="#10B981" />
          <Text style={styles.timeLabel}>In: </Text>
          <Text style={styles.timeValue}>{formatTime(item.clock_in_at)}</Text>
        </View>
        {item.clock_out_at && (
          <View style={styles.timeBlock}>
            <Ionicons name="arrow-back-circle" size={16} color="#EF4444" />
            <Text style={styles.timeLabel}>Out: </Text>
            <Text style={styles.timeValue}>{formatTime(item.clock_out_at)}</Text>
          </View>
        )}
        <View style={styles.totalBlock}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalValue}>
            {item.total_hours ? `${item.total_hours.toFixed(2)}h` : item.duration_formatted || '--'}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Date Selector */}
      <View style={styles.dateSelector}>
        <TouchableOpacity onPress={() => changeDate(-1)} style={styles.dateArrow}>
          <Ionicons name="chevron-back" size={24} color="#F8FAFC" />
        </TouchableOpacity>
        <View style={styles.dateDisplay}>
          <Text style={styles.dateText}>
            {selectedDate.toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })}
          </Text>
          {selectedDate.toDateString() === new Date().toDateString() && (
            <Text style={styles.todayBadge}>Today</Text>
          )}
        </View>
        <TouchableOpacity
          onPress={() => changeDate(1)}
          style={styles.dateArrow}
          disabled={selectedDate.toDateString() === new Date().toDateString()}
        >
          <Ionicons
            name="chevron-forward"
            size={24}
            color={selectedDate.toDateString() === new Date().toDateString() ? '#475569' : '#F8FAFC'}
          />
        </TouchableOpacity>
      </View>

      {/* Team List */}
      {isLoading ? (
        <ActivityIndicator size="large" color="#8B5CF6" style={styles.loader} />
      ) : entries.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="people-outline" size={48} color="#64748B" />
          <Text style={styles.emptyText}>No time entries for this date</Text>
        </View>
      ) : (
        <FlatList
          data={entries}
          renderItem={renderEntry}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    padding: 20,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  dateArrow: {
    padding: 8,
  },
  dateDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  dateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  todayBadge: {
    marginLeft: 8,
    fontSize: 12,
    color: '#8B5CF6',
    backgroundColor: '#8B5CF620',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  loader: {
    marginTop: 48,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 12,
  },
  list: {
    paddingBottom: 20,
  },
  entryCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontWeight: '600',
  },
  entryInfo: {
    flex: 1,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  employeeEmail: {
    fontSize: 12,
    color: '#94A3B8',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  entryDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  timeBlock: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 14,
    color: '#94A3B8',
    marginLeft: 4,
  },
  timeValue: {
    fontSize: 14,
    color: '#F8FAFC',
    fontWeight: '500',
  },
  totalBlock: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 14,
    color: '#94A3B8',
    marginRight: 4,
  },
  totalValue: {
    fontSize: 16,
    color: '#8B5CF6',
    fontWeight: '600',
  },
});
