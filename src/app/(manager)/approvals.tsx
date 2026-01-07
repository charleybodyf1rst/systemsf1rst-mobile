import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../lib/api';

interface PendingEntry {
  id: number;
  user: {
    first_name: string;
    last_name: string;
  };
  clock_in_at: string;
  clock_out_at: string;
  total_hours: number;
  clock_in_location_name: string | null;
}

export default function ApprovalsScreen() {
  const [entries, setEntries] = useState<PendingEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPendingEntries();
  }, []);

  const fetchPendingEntries = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/time-clock/team', {
        params: { status: 'clocked_out' },
      });
      setEntries(response.data.entries?.filter((e: any) => e.status === 'clocked_out') || []);
    } catch (error) {
      console.error('Failed to fetch pending entries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await api.post(`/time-clock/${id}/approve`);
      setEntries(entries.filter(e => e.id !== id));
      Alert.alert('Success', 'Time entry approved');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to approve');
    }
  };

  const handleReject = async (id: number) => {
    Alert.prompt(
      'Rejection Reason',
      'Please provide a reason for rejecting this entry:',
      async (reason) => {
        if (reason) {
          try {
            await api.post(`/time-clock/${id}/reject`, { reason });
            setEntries(entries.filter(e => e.id !== id));
            Alert.alert('Success', 'Time entry rejected');
          } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to reject');
          }
        }
      }
    );
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const renderEntry = ({ item }: { item: PendingEntry }) => (
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
          <Text style={styles.locationText}>
            {item.clock_in_location_name || 'No location'}
          </Text>
        </View>
        <View style={styles.hoursBox}>
          <Text style={styles.hoursValue}>{item.total_hours?.toFixed(2) || '--'}</Text>
          <Text style={styles.hoursLabel}>hours</Text>
        </View>
      </View>

      <View style={styles.timeRow}>
        <View style={styles.timeItem}>
          <Ionicons name="arrow-forward-circle" size={16} color="#10B981" />
          <Text style={styles.timeText}>{formatDateTime(item.clock_in_at)}</Text>
        </View>
        <Ionicons name="arrow-forward" size={16} color="#64748B" />
        <View style={styles.timeItem}>
          <Ionicons name="arrow-back-circle" size={16} color="#EF4444" />
          <Text style={styles.timeText}>{formatDateTime(item.clock_out_at)}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.rejectButton]}
          onPress={() => handleReject(item.id)}
        >
          <Ionicons name="close" size={20} color="#EF4444" />
          <Text style={styles.rejectText}>Reject</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.approveButton]}
          onPress={() => handleApprove(item.id)}
        >
          <Ionicons name="checkmark" size={20} color="#fff" />
          <Text style={styles.approveText}>Approve</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Pending Approvals</Text>
        <Text style={styles.subtitle}>{entries.length} entries awaiting review</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color="#8B5CF6" style={styles.loader} />
      ) : entries.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="checkmark-circle-outline" size={64} color="#10B981" />
          <Text style={styles.emptyTitle}>All caught up!</Text>
          <Text style={styles.emptyText}>No pending time entries to review</Text>
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
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 4,
  },
  loader: {
    marginTop: 48,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#F8FAFC',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  list: {
    paddingBottom: 20,
  },
  entryCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
  locationText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  hoursBox: {
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  hoursValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B5CF6',
  },
  hoursLabel: {
    fontSize: 10,
    color: '#64748B',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#334155',
  },
  timeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeText: {
    fontSize: 14,
    color: '#E2E8F0',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  rejectButton: {
    backgroundColor: '#EF444420',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  approveButton: {
    backgroundColor: '#10B981',
  },
  rejectText: {
    color: '#EF4444',
    fontWeight: '600',
  },
  approveText: {
    color: '#fff',
    fontWeight: '600',
  },
});
