// Approvals Screen - Manage pending AI agent tool approvals
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useOrchestraStore, PendingApproval } from '../../stores/orchestra-store';

export default function ApprovalsScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const {
    pendingApprovals,
    approvalsLoading,
    fetchPendingApprovals,
    approveAction,
    rejectAction,
  } = useOrchestraStore();

  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPendingApprovals();
    setRefreshing(false);
  };

  const handleApprove = async (approval: PendingApproval) => {
    setProcessingId(approval.id);
    try {
      await approveAction(approval.id);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to approve action');
    }
    setProcessingId(null);
  };

  const handleReject = (approval: PendingApproval) => {
    Alert.alert(
      'Reject Action',
      `Are you sure you want to reject "${approval.tool_name}"?\n\nThis action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            setProcessingId(approval.id);
            try {
              await rejectAction(approval.id, 'Rejected by user');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to reject action');
            }
            setProcessingId(null);
          },
        },
      ]
    );
  };

  const handleApproveAll = () => {
    if (pendingApprovals.length === 0) return;

    Alert.alert(
      'Approve All',
      `Are you sure you want to approve all ${pendingApprovals.length} pending actions?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve All',
          onPress: async () => {
            for (const approval of pendingApprovals) {
              try {
                await approveAction(approval.id);
              } catch (e) {
                console.error('Failed to approve:', approval.id);
              }
            }
          },
        },
      ]
    );
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      default: return '#22C55E';
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'high': return 'alert-circle';
      case 'medium': return 'warning';
      default: return 'shield-checkmark';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const renderApproval = ({ item }: { item: PendingApproval }) => {
    const isProcessing = processingId === item.id;

    return (
      <View style={[styles.approvalCard, isProcessing && styles.approvalCardProcessing]}>
        {/* Risk Badge */}
        <View style={[styles.riskStrip, { backgroundColor: getRiskColor(item.risk_level) }]} />

        <View style={styles.approvalContent}>
          {/* Header */}
          <View style={styles.approvalHeader}>
            <View style={[styles.riskBadge, { backgroundColor: getRiskColor(item.risk_level) + '20' }]}>
              <Ionicons name={getRiskIcon(item.risk_level) as any} size={14} color={getRiskColor(item.risk_level)} />
              <Text style={[styles.riskText, { color: getRiskColor(item.risk_level) }]}>
                {item.risk_level} risk
              </Text>
            </View>
            <Text style={styles.timeText}>{formatTime(item.created_at)}</Text>
          </View>

          {/* Tool Info */}
          <View style={styles.toolInfo}>
            <Ionicons name="code-slash" size={20} color="#8B5CF6" />
            <Text style={styles.toolName}>{item.tool_name}</Text>
          </View>

          {/* Description */}
          <Text style={styles.description}>{item.description}</Text>

          {/* Parameters Preview */}
          {Object.keys(item.parameters).length > 0 && (
            <View style={styles.paramsContainer}>
              <Text style={styles.paramsLabel}>Parameters:</Text>
              {Object.entries(item.parameters).slice(0, 4).map(([key, value]) => (
                <View key={key} style={styles.paramRow}>
                  <Text style={styles.paramKey}>{key}:</Text>
                  <Text style={styles.paramValue} numberOfLines={1}>
                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                  </Text>
                </View>
              ))}
              {Object.keys(item.parameters).length > 4 && (
                <Text style={styles.moreParams}>
                  +{Object.keys(item.parameters).length - 4} more parameters
                </Text>
              )}
            </View>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            {isProcessing ? (
              <ActivityIndicator color="#8B5CF6" />
            ) : (
              <>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.rejectBtn]}
                  onPress={() => handleReject(item)}
                >
                  <Ionicons name="close" size={18} color="#EF4444" />
                  <Text style={styles.rejectBtnText}>Reject</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.approveBtn]}
                  onPress={() => handleApprove(item)}
                >
                  <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                  <Text style={styles.approveBtnText}>Approve</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Pending Approvals</Text>
          <Text style={styles.headerSubtitle}>{pendingApprovals.length} actions waiting</Text>
        </View>
        {pendingApprovals.length > 1 && (
          <TouchableOpacity style={styles.approveAllBtn} onPress={handleApproveAll}>
            <Text style={styles.approveAllText}>Approve All</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* List */}
      <FlatList
        data={pendingApprovals}
        keyExtractor={(item) => item.id}
        renderItem={renderApproval}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#8B5CF6"
          />
        }
        ListEmptyComponent={
          approvalsLoading ? (
            <View style={styles.loadingState}>
              <ActivityIndicator size="large" color="#8B5CF6" />
              <Text style={styles.loadingText}>Loading approvals...</Text>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="shield-checkmark" size={64} color="#334155" />
              <Text style={styles.emptyTitle}>No Pending Approvals</Text>
              <Text style={styles.emptyText}>
                All AI agent actions have been processed. New approvals will appear here when the agent needs permission to execute tools.
              </Text>
              <TouchableOpacity style={styles.backToAgentBtn} onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={18} color="#8B5CF6" />
                <Text style={styles.backToAgentText}>Back to Agent</Text>
              </TouchableOpacity>
            </View>
          )
        }
      />

      {/* Risk Legend */}
      {pendingApprovals.length > 0 && (
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#22C55E' }]} />
            <Text style={styles.legendText}>Low Risk</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
            <Text style={styles.legendText}>Medium Risk</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
            <Text style={styles.legendText}>High Risk</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  backBtn: { padding: 8 },
  headerCenter: { flex: 1, marginLeft: 12 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#FFFFFF' },
  headerSubtitle: { fontSize: 14, color: '#94A3B8' },
  approveAllBtn: {
    backgroundColor: '#22C55E',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  approveAllText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },

  list: { padding: 16, flexGrow: 1 },
  approvalCard: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  approvalCardProcessing: { opacity: 0.7 },
  riskStrip: { width: 4 },
  approvalContent: { flex: 1, padding: 16 },

  approvalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  riskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  riskText: { fontSize: 12, fontWeight: '500', marginLeft: 4, textTransform: 'capitalize' },
  timeText: { fontSize: 12, color: '#64748B' },

  toolInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  toolName: { fontSize: 16, fontWeight: '600', color: '#FFFFFF', marginLeft: 8 },

  description: { fontSize: 14, color: '#94A3B8', marginBottom: 12, lineHeight: 20 },

  paramsContainer: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  paramsLabel: { fontSize: 12, color: '#64748B', marginBottom: 8 },
  paramRow: { flexDirection: 'row', marginBottom: 4 },
  paramKey: { fontSize: 13, color: '#8B5CF6', width: 100 },
  paramValue: { fontSize: 13, color: '#E2E8F0', flex: 1 },
  moreParams: { fontSize: 12, color: '#64748B', fontStyle: 'italic', marginTop: 4 },

  actions: { flexDirection: 'row', justifyContent: 'flex-end' },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    marginLeft: 10,
  },
  rejectBtn: { backgroundColor: '#EF444420' },
  rejectBtnText: { color: '#EF4444', fontWeight: '600', marginLeft: 6 },
  approveBtn: { backgroundColor: '#22C55E' },
  approveBtnText: { color: '#FFFFFF', fontWeight: '600', marginLeft: 6 },

  loadingState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 100 },
  loadingText: { color: '#94A3B8', marginTop: 16, fontSize: 16 },

  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: '#FFFFFF', marginTop: 16 },
  emptyText: { fontSize: 14, color: '#94A3B8', textAlign: 'center', marginTop: 8, lineHeight: 22 },
  backToAgentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#1E293B',
    borderRadius: 20,
  },
  backToAgentText: { color: '#8B5CF6', fontWeight: '500', marginLeft: 8 },

  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 12 },
  legendDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  legendText: { fontSize: 12, color: '#64748B' },
});
