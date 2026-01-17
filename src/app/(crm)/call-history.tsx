// Call History Screen - View all AI calls
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallerStore, AICall } from '../../stores/callerStore';

const STATUS_FILTERS = [
  { id: null, name: 'All' },
  { id: 'completed', name: 'Completed' },
  { id: 'in_progress', name: 'In Progress' },
  { id: 'failed', name: 'Failed' },
];

export default function CallHistoryScreen() {
  const router = useRouter();
  const { calls, callsLoading, fetchCalls } = useCallerStore();
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchCalls();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCalls();
    setRefreshing(false);
  };

  const filteredCalls = statusFilter
    ? calls.filter(c => c.status === statusFilter)
    : calls;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#22C55E';
      case 'in_progress': return '#3B82F6';
      case 'dialing': case 'queued': return '#F59E0B';
      case 'failed': case 'no_answer': return '#EF4444';
      default: return '#64748B';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return 'checkmark-circle';
      case 'in_progress': return 'radio-button-on';
      case 'dialing': case 'queued': return 'time';
      case 'failed': case 'no_answer': return 'close-circle';
      default: return 'help-circle';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'outbound': return 'call-outline';
      case 'follow_up': return 'refresh-outline';
      case 'reminder': return 'alarm-outline';
      case 'security_alert': return 'shield-outline';
      default: return 'call';
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderCall = ({ item }: { item: AICall }) => (
    <TouchableOpacity
      style={styles.callCard}
      onPress={() => router.push({ pathname: '/(crm)/call-detail', params: { callId: item.id } })}
    >
      <View style={styles.callLeft}>
        <View style={[styles.typeIconContainer, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Ionicons name={getTypeIcon(item.type) as any} size={24} color={getStatusColor(item.status)} />
        </View>
      </View>

      <View style={styles.callCenter}>
        <Text style={styles.callContact}>{item.contact_name || item.contact_phone || 'Unknown'}</Text>
        <View style={styles.callMetaRow}>
          <Text style={styles.callType}>{item.type.replace('_', ' ')}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
            <Ionicons name={getStatusIcon(item.status) as any} size={12} color={getStatusColor(item.status)} />
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status.replace('_', ' ')}</Text>
          </View>
        </View>
        {item.summary && (
          <Text style={styles.callSummary} numberOfLines={1}>{item.summary}</Text>
        )}
      </View>

      <View style={styles.callRight}>
        <Text style={styles.callDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
        <Text style={styles.callTime}>{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
        <Text style={styles.callDuration}>{formatDuration(item.duration_seconds)}</Text>
      </View>
    </TouchableOpacity>
  );

  // Group calls by date
  const groupedCalls = filteredCalls.reduce((groups, call) => {
    const date = new Date(call.created_at).toLocaleDateString();
    if (!groups[date]) groups[date] = [];
    groups[date].push(call);
    return groups;
  }, {} as Record<string, AICall[]>);

  const sections = Object.entries(groupedCalls).map(([date, calls]) => ({ date, calls }));

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Call History</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{calls.length}</Text>
          <Text style={styles.statLabel}>Total Calls</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{calls.filter(c => c.status === 'completed').length}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {formatDuration(calls.reduce((sum, c) => sum + (c.duration_seconds || 0), 0))}
          </Text>
          <Text style={styles.statLabel}>Total Time</Text>
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filtersRow}>
        {STATUS_FILTERS.map(filter => (
          <TouchableOpacity
            key={filter.id || 'all'}
            style={[styles.filterChip, statusFilter === filter.id && styles.filterChipActive]}
            onPress={() => setStatusFilter(filter.id)}
          >
            <Text style={[styles.filterText, statusFilter === filter.id && styles.filterTextActive]}>
              {filter.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Calls List */}
      {callsLoading && !refreshing ? (
        <ActivityIndicator size="large" color="#8B5CF6" style={styles.loader} />
      ) : filteredCalls.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="call-outline" size={64} color="#64748B" />
          <Text style={styles.emptyText}>No calls found</Text>
          <Text style={styles.emptySubtext}>
            {statusFilter ? `No ${statusFilter} calls yet` : 'Start making AI calls'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={sections}
          keyExtractor={(item) => item.date}
          renderItem={({ item: section }) => (
            <View>
              <Text style={styles.dateHeader}>{section.date}</Text>
              {section.calls.map(call => (
                <View key={call.id}>{renderCall({ item: call })}</View>
              ))}
            </View>
          )}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8B5CF6" />
          }
        />
      )}

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => router.push('/(crm)/caller')}>
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20 },
  backBtn: { padding: 8 },
  title: { fontSize: 24, fontWeight: '700', color: '#FFFFFF' },

  statsRow: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: '#1E293B', borderRadius: 12, padding: 16, marginHorizontal: 4, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '700', color: '#FFFFFF' },
  statLabel: { fontSize: 12, color: '#94A3B8', marginTop: 4 },

  filtersRow: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 16 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#1E293B', marginRight: 8 },
  filterChipActive: { backgroundColor: '#8B5CF6' },
  filterText: { fontSize: 14, color: '#94A3B8' },
  filterTextActive: { color: '#FFFFFF' },

  loader: { flex: 1, justifyContent: 'center' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 18, color: '#FFFFFF', marginTop: 16 },
  emptySubtext: { fontSize: 14, color: '#64748B', marginTop: 4 },

  listContainer: { paddingHorizontal: 20, paddingBottom: 100 },
  dateHeader: { fontSize: 14, fontWeight: '600', color: '#8B5CF6', marginTop: 20, marginBottom: 12 },

  callCard: { flexDirection: 'row', backgroundColor: '#1E293B', borderRadius: 12, padding: 16, marginBottom: 10 },
  callLeft: { marginRight: 12 },
  typeIconContainer: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },

  callCenter: { flex: 1 },
  callContact: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  callMetaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  callType: { fontSize: 13, color: '#64748B', textTransform: 'capitalize', marginRight: 8 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  statusText: { fontSize: 11, marginLeft: 4, textTransform: 'capitalize' },
  callSummary: { fontSize: 13, color: '#94A3B8', marginTop: 6 },

  callRight: { alignItems: 'flex-end' },
  callDate: { fontSize: 12, color: '#64748B' },
  callTime: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  callDuration: { fontSize: 14, fontWeight: '600', color: '#FFFFFF', marginTop: 8 },

  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: '#8B5CF6', alignItems: 'center', justifyContent: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4 },
});
