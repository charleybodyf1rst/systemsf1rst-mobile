// Call Detail Screen - View call transcript and details
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Share, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useCallerStore, AICall } from '../../stores/callerStore';

export default function CallDetailScreen() {
  const router = useRouter();
  const { callId } = useLocalSearchParams<{ callId: string }>();
  const { calls, getCallStatus, getCallTranscript, cancelCall } = useCallerStore();
  const [call, setCall] = useState<AICall | null>(null);
  const [loading, setLoading] = useState(true);
  const [transcriptLoading, setTranscriptLoading] = useState(false);

  useEffect(() => {
    loadCall();
  }, [callId]);

  const loadCall = async () => {
    setLoading(true);
    try {
      // First check local state
      const localCall = calls.find(c => c.id === callId);
      if (localCall) {
        setCall(localCall);
      }

      // Then fetch latest from API
      if (callId) {
        const updatedCall = await getCallStatus(callId);
        setCall(updatedCall);

        // Load transcript if call is completed
        if (updatedCall.status === 'completed' && !updatedCall.transcript) {
          setTranscriptLoading(true);
          try {
            const transcript = await getCallTranscript(callId);
            setCall(prev => prev ? { ...prev, transcript } : null);
          } catch (e) {
            console.error('Failed to load transcript:', e);
          }
          setTranscriptLoading(false);
        }
      }
    } catch (error) {
      console.error('Failed to load call:', error);
    }
    setLoading(false);
  };

  const handleShare = async () => {
    if (!call) return;
    try {
      await Share.share({
        title: `AI Call: ${call.contact_name || call.contact_phone}`,
        message: `Call Summary:\n${call.summary || 'No summary available'}\n\nTranscript:\n${call.transcript || 'No transcript available'}`,
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Call',
      'Are you sure you want to cancel this call?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelCall(callId!);
              router.back();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to cancel call');
            }
          }
        }
      ]
    );
  };

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

  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive': return '#22C55E';
      case 'negative': return '#EF4444';
      default: return '#F59E0B';
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#8B5CF6" style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  if (!call) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <View style={styles.errorState}>
          <Ionicons name="alert-circle" size={64} color="#EF4444" />
          <Text style={styles.errorText}>Call not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isActiveCall = ['queued', 'dialing', 'in_progress'].includes(call.status);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Call Details</Text>
        <TouchableOpacity onPress={handleShare} style={styles.shareBtn}>
          <Ionicons name="share-outline" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status Banner */}
        <View style={[styles.statusBanner, { backgroundColor: getStatusColor(call.status) + '20' }]}>
          <View style={styles.statusRow}>
            <Ionicons name={getStatusIcon(call.status) as any} size={32} color={getStatusColor(call.status)} />
            <View style={styles.statusInfo}>
              <Text style={[styles.statusText, { color: getStatusColor(call.status) }]}>
                {call.status.replace('_', ' ')}
              </Text>
              {isActiveCall && (
                <Text style={styles.statusSubtext}>Call in progress...</Text>
              )}
            </View>
          </View>
          {isActiveCall && (
            <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
              <Ionicons name="close-circle" size={20} color="#EF4444" />
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Contact Info */}
        <View style={styles.contactCard}>
          <View style={styles.contactAvatar}>
            <Text style={styles.avatarText}>
              {(call.contact_name || call.contact_phone || '?').charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.contactInfo}>
            <Text style={styles.contactName}>{call.contact_name || 'Unknown Contact'}</Text>
            <Text style={styles.contactPhone}>{call.contact_phone || 'No phone'}</Text>
          </View>
          {call.contact_phone && (
            <TouchableOpacity style={styles.callBtn}>
              <Ionicons name="call" size={24} color="#22C55E" />
            </TouchableOpacity>
          )}
        </View>

        {/* Call Info */}
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Type</Text>
            <Text style={styles.infoValue}>{call.type.replace('_', ' ')}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Duration</Text>
            <Text style={styles.infoValue}>{formatDuration(call.duration_seconds)}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Started</Text>
            <Text style={styles.infoValue}>
              {call.started_at ? new Date(call.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Voice</Text>
            <Text style={styles.infoValue}>{call.voice_name || 'Default'}</Text>
          </View>
        </View>

        {/* Summary */}
        {call.summary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Summary</Text>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryText}>{call.summary}</Text>
              {call.sentiment && (
                <View style={[styles.sentimentBadge, { backgroundColor: getSentimentColor(call.sentiment) + '20' }]}>
                  <Text style={[styles.sentimentText, { color: getSentimentColor(call.sentiment) }]}>
                    {call.sentiment} sentiment
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Action Items */}
        {call.action_items && call.action_items.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Action Items</Text>
            {call.action_items.map((item, index) => (
              <View key={index} style={styles.actionItem}>
                <View style={styles.actionCheckbox}>
                  <Ionicons name="square-outline" size={20} color="#8B5CF6" />
                </View>
                <Text style={styles.actionText}>{item}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Transcript */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Transcript</Text>
            {call.status === 'completed' && (
              <TouchableOpacity onPress={() => loadCall()}>
                <Ionicons name="refresh" size={20} color="#8B5CF6" />
              </TouchableOpacity>
            )}
          </View>

          {transcriptLoading ? (
            <View style={styles.transcriptLoading}>
              <ActivityIndicator color="#8B5CF6" />
              <Text style={styles.loadingText}>Loading transcript...</Text>
            </View>
          ) : call.transcript ? (
            <View style={styles.transcriptCard}>
              <Text style={styles.transcriptText}>{call.transcript}</Text>
            </View>
          ) : (
            <View style={styles.noTranscript}>
              <Ionicons name="document-text-outline" size={32} color="#64748B" />
              <Text style={styles.noTranscriptText}>
                {call.status === 'completed' ? 'Transcript not available' : 'Transcript will appear after call ends'}
              </Text>
            </View>
          )}
        </View>

        {/* Script Used */}
        {call.script && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Script Used</Text>
            <View style={styles.scriptCard}>
              <Text style={styles.scriptText}>{call.script}</Text>
            </View>
          </View>
        )}

        {/* Timestamps */}
        <View style={styles.timestamps}>
          <Text style={styles.timestampText}>
            Created: {new Date(call.created_at).toLocaleString()}
          </Text>
          {call.ended_at && (
            <Text style={styles.timestampText}>
              Ended: {new Date(call.ended_at).toLocaleString()}
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20 },
  backBtn: { padding: 8 },
  title: { fontSize: 20, fontWeight: '600', color: '#FFFFFF' },
  shareBtn: { padding: 8 },

  errorState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { fontSize: 18, color: '#FFFFFF', marginTop: 16 },

  content: { flex: 1, paddingHorizontal: 20 },

  statusBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 16, padding: 16, marginBottom: 20 },
  statusRow: { flexDirection: 'row', alignItems: 'center' },
  statusInfo: { marginLeft: 12 },
  statusText: { fontSize: 18, fontWeight: '600', textTransform: 'capitalize' },
  statusSubtext: { fontSize: 14, color: '#94A3B8', marginTop: 2 },
  cancelBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EF444420', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  cancelText: { color: '#EF4444', marginLeft: 6, fontWeight: '500' },

  contactCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E293B', borderRadius: 16, padding: 16, marginBottom: 20 },
  contactAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#8B5CF6', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 24, fontWeight: '600', color: '#FFFFFF' },
  contactInfo: { flex: 1, marginLeft: 16 },
  contactName: { fontSize: 18, fontWeight: '600', color: '#FFFFFF' },
  contactPhone: { fontSize: 14, color: '#94A3B8', marginTop: 4 },
  callBtn: { padding: 12 },

  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 },
  infoItem: { width: '50%', paddingVertical: 12 },
  infoLabel: { fontSize: 12, color: '#64748B', marginBottom: 4 },
  infoValue: { fontSize: 16, fontWeight: '500', color: '#FFFFFF', textTransform: 'capitalize' },

  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#FFFFFF', marginBottom: 12 },

  summaryCard: { backgroundColor: '#1E293B', borderRadius: 12, padding: 16 },
  summaryText: { fontSize: 15, color: '#E2E8F0', lineHeight: 22 },
  sentimentBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginTop: 12 },
  sentimentText: { fontSize: 13, fontWeight: '500', textTransform: 'capitalize' },

  actionItem: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#1E293B', borderRadius: 12, padding: 14, marginBottom: 8 },
  actionCheckbox: { marginRight: 12, marginTop: 2 },
  actionText: { flex: 1, fontSize: 14, color: '#E2E8F0', lineHeight: 20 },

  transcriptLoading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  loadingText: { color: '#94A3B8', marginLeft: 12 },

  transcriptCard: { backgroundColor: '#1E293B', borderRadius: 12, padding: 16 },
  transcriptText: { fontSize: 14, color: '#E2E8F0', lineHeight: 22 },

  noTranscript: { alignItems: 'center', paddingVertical: 32 },
  noTranscriptText: { color: '#64748B', marginTop: 8, textAlign: 'center' },

  scriptCard: { backgroundColor: '#1E293B', borderRadius: 12, padding: 16 },
  scriptText: { fontSize: 14, color: '#94A3B8', lineHeight: 20, fontStyle: 'italic' },

  timestamps: { paddingVertical: 20, borderTopWidth: 1, borderTopColor: '#334155', marginBottom: 40 },
  timestampText: { fontSize: 12, color: '#64748B', marginBottom: 4 },
});
