// AI Caller Screen - Initiate and manage AI voice calls
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Modal, Alert, ActivityIndicator, ScrollView, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallerStore, AICall, Voice, CallScript } from '../../stores/callerStore';
import { useCrmStore, Contact } from '../../stores/crmStore';

const CALL_TYPES = [
  { id: 'outbound', name: 'Sales Outreach', icon: 'call-outline', color: '#3B82F6' },
  { id: 'follow_up', name: 'Follow Up', icon: 'refresh-outline', color: '#8B5CF6' },
  { id: 'reminder', name: 'Reminder', icon: 'alarm-outline', color: '#F59E0B' },
  { id: 'security_alert', name: 'Security Alert', icon: 'shield-outline', color: '#EF4444' },
];

export default function CallerScreen() {
  const router = useRouter();
  const {
    calls, currentCall, callsLoading, callsError,
    voices, voicesLoading, selectedVoice,
    scripts, scriptsLoading,
    fetchCalls, fetchVoices, fetchScripts,
    initiateCall, getCallStatus, clearCurrentCall, setSelectedVoice
  } = useCallerStore();

  const { contacts, fetchContacts } = useCrmStore();

  const [showNewCall, setShowNewCall] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [manualPhone, setManualPhone] = useState('');
  const [selectedType, setSelectedType] = useState<string>('outbound');
  const [selectedScript, setSelectedScript] = useState<CallScript | null>(null);
  const [customScript, setCustomScript] = useState('');
  const [showContactPicker, setShowContactPicker] = useState(false);
  const [showVoicePicker, setShowVoicePicker] = useState(false);
  const [polling, setPolling] = useState(false);

  useEffect(() => {
    fetchCalls();
    fetchVoices();
    fetchScripts();
    fetchContacts();
  }, []);

  // Poll for call status when there's an active call
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (currentCall && ['queued', 'dialing', 'in_progress'].includes(currentCall.status)) {
      setPolling(true);
      interval = setInterval(async () => {
        try {
          await getCallStatus(currentCall.id);
        } catch (e) {
          console.error('Poll error:', e);
        }
      }, 3000);
    } else {
      setPolling(false);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentCall?.id, currentCall?.status]);

  const handleInitiateCall = async () => {
    if (!selectedContact && !manualPhone) {
      Alert.alert('Error', 'Please select a contact or enter a phone number');
      return;
    }

    try {
      await initiateCall({
        contact_id: selectedContact?.id,
        phone_number: manualPhone || selectedContact?.phone,
        type: selectedType as AICall['type'],
        voice_id: selectedVoice?.voice_id,
        script: customScript || selectedScript?.content,
      });
      setShowNewCall(false);
      resetForm();
    } catch (error: any) {
      Alert.alert('Call Failed', error.message || 'Failed to initiate call');
    }
  };

  const resetForm = () => {
    setSelectedContact(null);
    setManualPhone('');
    setSelectedType('outbound');
    setSelectedScript(null);
    setCustomScript('');
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

  const renderRecentCall = ({ item }: { item: AICall }) => (
    <TouchableOpacity
      style={styles.callCard}
      onPress={() => router.push({ pathname: '/(crm)/call-detail', params: { callId: item.id } })}
    >
      <View style={styles.callHeader}>
        <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
        <Text style={styles.callContact}>{item.contact_name || item.contact_phone || 'Unknown'}</Text>
        <Ionicons name={getStatusIcon(item.status) as any} size={20} color={getStatusColor(item.status)} />
      </View>
      <View style={styles.callMeta}>
        <Text style={styles.callType}>{item.type.replace('_', ' ')}</Text>
        <Text style={styles.callTime}>
          {new Date(item.created_at).toLocaleDateString()} • {item.duration_seconds ? `${Math.floor(item.duration_seconds / 60)}:${(item.duration_seconds % 60).toString().padStart(2, '0')}` : '--:--'}
        </Text>
      </View>
      {item.summary && (
        <Text style={styles.callSummary} numberOfLines={2}>{item.summary}</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>AI Caller</Text>
        <TouchableOpacity onPress={() => router.push('/(crm)/call-history')} style={styles.historyBtn}>
          <Ionicons name="list" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Active Call Banner */}
      {currentCall && ['queued', 'dialing', 'in_progress'].includes(currentCall.status) && (
        <View style={styles.activeCallBanner}>
          <View style={styles.activeCallContent}>
            <ActivityIndicator size="small" color="#FFFFFF" />
            <View style={styles.activeCallInfo}>
              <Text style={styles.activeCallName}>{currentCall.contact_name || currentCall.contact_phone}</Text>
              <Text style={styles.activeCallStatus}>{currentCall.status.replace('_', ' ')}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => router.push({ pathname: '/(crm)/call-detail', params: { callId: currentCall.id } })}>
            <Ionicons name="open-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}

      {/* Quick Call Button */}
      <TouchableOpacity style={styles.quickCallBtn} onPress={() => setShowNewCall(true)}>
        <View style={styles.quickCallIcon}>
          <Ionicons name="call" size={32} color="#FFFFFF" />
        </View>
        <View style={styles.quickCallText}>
          <Text style={styles.quickCallTitle}>Start AI Call</Text>
          <Text style={styles.quickCallSubtitle}>Make an AI-powered voice call</Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color="#8B5CF6" />
      </TouchableOpacity>

      {/* Call Types */}
      <Text style={styles.sectionTitle}>Call Types</Text>
      <View style={styles.typesGrid}>
        {CALL_TYPES.map(type => (
          <TouchableOpacity
            key={type.id}
            style={styles.typeCard}
            onPress={() => {
              setSelectedType(type.id);
              setShowNewCall(true);
            }}
          >
            <View style={[styles.typeIcon, { backgroundColor: type.color + '20' }]}>
              <Ionicons name={type.icon as any} size={24} color={type.color} />
            </View>
            <Text style={styles.typeName}>{type.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Recent Calls */}
      <View style={styles.recentHeader}>
        <Text style={styles.sectionTitle}>Recent Calls</Text>
        <TouchableOpacity onPress={() => router.push('/(crm)/call-history')}>
          <Text style={styles.seeAll}>See All</Text>
        </TouchableOpacity>
      </View>

      {callsLoading ? (
        <ActivityIndicator size="large" color="#8B5CF6" style={styles.loader} />
      ) : calls.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="call-outline" size={48} color="#64748B" />
          <Text style={styles.emptyText}>No calls yet</Text>
          <Text style={styles.emptySubtext}>Start your first AI call above</Text>
        </View>
      ) : (
        <FlatList
          data={calls.slice(0, 5)}
          keyExtractor={(item) => item.id}
          renderItem={renderRecentCall}
          contentContainerStyle={styles.callsList}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* New Call Modal */}
      <Modal visible={showNewCall} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalScroll}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>New AI Call</Text>
                <TouchableOpacity onPress={() => { setShowNewCall(false); resetForm(); }}>
                  <Ionicons name="close" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              {/* Contact Selection */}
              <Text style={styles.label}>Contact</Text>
              <TouchableOpacity style={styles.selectBtn} onPress={() => setShowContactPicker(true)}>
                <Ionicons name="person" size={20} color="#8B5CF6" />
                <Text style={styles.selectText}>
                  {selectedContact ? selectedContact.name : 'Select a contact'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#64748B" />
              </TouchableOpacity>

              <Text style={styles.orText}>OR</Text>

              <TextInput
                style={styles.input}
                placeholder="Enter phone number"
                placeholderTextColor="#64748B"
                keyboardType="phone-pad"
                value={manualPhone}
                onChangeText={setManualPhone}
              />

              {/* Call Type */}
              <Text style={styles.label}>Call Type</Text>
              <View style={styles.typeSelect}>
                {CALL_TYPES.map(type => (
                  <TouchableOpacity
                    key={type.id}
                    style={[styles.typeOption, selectedType === type.id && { backgroundColor: type.color + '30', borderColor: type.color }]}
                    onPress={() => setSelectedType(type.id)}
                  >
                    <Ionicons name={type.icon as any} size={18} color={selectedType === type.id ? type.color : '#94A3B8'} />
                    <Text style={[styles.typeOptionText, selectedType === type.id && { color: type.color }]}>
                      {type.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Voice Selection */}
              <Text style={styles.label}>AI Voice</Text>
              <TouchableOpacity style={styles.selectBtn} onPress={() => setShowVoicePicker(true)}>
                <Ionicons name="mic" size={20} color="#8B5CF6" />
                <Text style={styles.selectText}>
                  {selectedVoice ? selectedVoice.name : 'Select voice'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#64748B" />
              </TouchableOpacity>

              {/* Script */}
              <Text style={styles.label}>Call Script (Optional)</Text>
              <View style={styles.scriptSelect}>
                {scripts.slice(0, 3).map(script => (
                  <TouchableOpacity
                    key={script.id}
                    style={[styles.scriptOption, selectedScript?.id === script.id && styles.scriptOptionActive]}
                    onPress={() => {
                      setSelectedScript(script);
                      setCustomScript(script.content);
                    }}
                  >
                    <Text style={styles.scriptOptionText}>{script.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Custom script or message..."
                placeholderTextColor="#64748B"
                multiline
                numberOfLines={4}
                value={customScript}
                onChangeText={setCustomScript}
              />

              {/* Start Call Button */}
              <TouchableOpacity
                style={[styles.callBtn, callsLoading && styles.callBtnDisabled]}
                onPress={handleInitiateCall}
                disabled={callsLoading}
              >
                {callsLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="call" size={24} color="#FFFFFF" />
                    <Text style={styles.callBtnText}>Start AI Call</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Contact Picker Modal */}
      <Modal visible={showContactPicker} animationType="slide" transparent>
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerContent}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Select Contact</Text>
              <TouchableOpacity onPress={() => setShowContactPicker(false)}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={contacts.filter(c => c.phone)}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.pickerItem}
                  onPress={() => {
                    setSelectedContact(item);
                    setShowContactPicker(false);
                  }}
                >
                  <View style={styles.contactAvatar}>
                    <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
                  </View>
                  <View style={styles.contactInfo}>
                    <Text style={styles.contactName}>{item.name}</Text>
                    <Text style={styles.contactPhone}>{item.phone}</Text>
                  </View>
                  {selectedContact?.id === item.id && (
                    <Ionicons name="checkmark-circle" size={24} color="#8B5CF6" />
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyPickerText}>No contacts with phone numbers</Text>
              }
            />
          </View>
        </View>
      </Modal>

      {/* Voice Picker Modal */}
      <Modal visible={showVoicePicker} animationType="slide" transparent>
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerContent}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Select AI Voice</Text>
              <TouchableOpacity onPress={() => setShowVoicePicker(false)}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            {voicesLoading ? (
              <ActivityIndicator size="large" color="#8B5CF6" style={{ marginTop: 40 }} />
            ) : (
              <FlatList
                data={voices}
                keyExtractor={(item) => item.voice_id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.voiceItem}
                    onPress={() => {
                      setSelectedVoice(item);
                      setShowVoicePicker(false);
                    }}
                  >
                    <View style={styles.voiceIcon}>
                      <Ionicons name="mic" size={20} color="#8B5CF6" />
                    </View>
                    <View style={styles.voiceInfo}>
                      <Text style={styles.voiceName}>{item.name}</Text>
                      {item.category && <Text style={styles.voiceCategory}>{item.category}</Text>}
                    </View>
                    {selectedVoice?.voice_id === item.voice_id && (
                      <Ionicons name="checkmark-circle" size={24} color="#8B5CF6" />
                    )}
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20 },
  backBtn: { padding: 8 },
  title: { fontSize: 24, fontWeight: '700', color: '#FFFFFF' },
  historyBtn: { padding: 8 },

  activeCallBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#22C55E', marginHorizontal: 20, borderRadius: 12, padding: 16, marginBottom: 20 },
  activeCallContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  activeCallInfo: { marginLeft: 12 },
  activeCallName: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  activeCallStatus: { fontSize: 14, color: '#FFFFFF', opacity: 0.9, textTransform: 'capitalize' },

  quickCallBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E293B', marginHorizontal: 20, borderRadius: 16, padding: 20, marginBottom: 24 },
  quickCallIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#8B5CF6', alignItems: 'center', justifyContent: 'center' },
  quickCallText: { flex: 1, marginLeft: 16 },
  quickCallTitle: { fontSize: 18, fontWeight: '600', color: '#FFFFFF' },
  quickCallSubtitle: { fontSize: 14, color: '#94A3B8', marginTop: 2 },

  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#FFFFFF', paddingHorizontal: 20, marginBottom: 12 },

  typesGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 15, marginBottom: 24 },
  typeCard: { width: '48%', backgroundColor: '#1E293B', borderRadius: 12, padding: 16, margin: '1%', alignItems: 'center' },
  typeIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  typeName: { fontSize: 14, fontWeight: '500', color: '#FFFFFF', textAlign: 'center' },

  recentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 12 },
  seeAll: { fontSize: 14, color: '#8B5CF6' },

  loader: { marginTop: 40 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 16, color: '#FFFFFF', marginTop: 12 },
  emptySubtext: { fontSize: 14, color: '#64748B', marginTop: 4 },

  callsList: { paddingHorizontal: 20 },
  callCard: { backgroundColor: '#1E293B', borderRadius: 12, padding: 16, marginBottom: 10 },
  callHeader: { flexDirection: 'row', alignItems: 'center' },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  callContact: { flex: 1, fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  callMeta: { flexDirection: 'row', marginTop: 8 },
  callType: { fontSize: 13, color: '#8B5CF6', textTransform: 'capitalize', marginRight: 12 },
  callTime: { fontSize: 13, color: '#64748B' },
  callSummary: { fontSize: 13, color: '#94A3B8', marginTop: 8 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)' },
  modalScroll: { flex: 1, marginTop: 60 },
  modalContent: { backgroundColor: '#1E293B', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, minHeight: 600 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 22, fontWeight: '700', color: '#FFFFFF' },

  label: { fontSize: 14, fontWeight: '500', color: '#94A3B8', marginBottom: 8, marginTop: 16 },
  selectBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0F172A', borderRadius: 12, padding: 16 },
  selectText: { flex: 1, fontSize: 16, color: '#FFFFFF', marginLeft: 12 },
  orText: { textAlign: 'center', color: '#64748B', marginVertical: 12, fontSize: 14 },
  input: { backgroundColor: '#0F172A', borderRadius: 12, padding: 16, color: '#FFFFFF', fontSize: 16 },
  textArea: { height: 100, textAlignVertical: 'top', marginTop: 8 },

  typeSelect: { flexDirection: 'row', flexWrap: 'wrap' },
  typeOption: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 20, backgroundColor: '#0F172A', marginRight: 8, marginBottom: 8, borderWidth: 1, borderColor: 'transparent' },
  typeOptionText: { marginLeft: 6, fontSize: 13, color: '#94A3B8' },

  scriptSelect: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  scriptOption: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#0F172A', marginRight: 8, marginBottom: 8 },
  scriptOptionActive: { backgroundColor: '#8B5CF620', borderWidth: 1, borderColor: '#8B5CF6' },
  scriptOptionText: { fontSize: 13, color: '#FFFFFF' },

  callBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#22C55E', borderRadius: 12, padding: 18, marginTop: 24 },
  callBtnDisabled: { backgroundColor: '#64748B' },
  callBtnText: { fontSize: 18, fontWeight: '600', color: '#FFFFFF', marginLeft: 10 },

  pickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  pickerContent: { backgroundColor: '#1E293B', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '80%' },
  pickerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#334155' },
  pickerTitle: { fontSize: 18, fontWeight: '600', color: '#FFFFFF' },
  pickerItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#334155' },
  contactAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#8B5CF6', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, fontWeight: '600', color: '#FFFFFF' },
  contactInfo: { flex: 1, marginLeft: 12 },
  contactName: { fontSize: 16, fontWeight: '500', color: '#FFFFFF' },
  contactPhone: { fontSize: 14, color: '#94A3B8', marginTop: 2 },
  emptyPickerText: { textAlign: 'center', color: '#64748B', padding: 40 },

  voiceItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#334155' },
  voiceIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#8B5CF620', alignItems: 'center', justifyContent: 'center' },
  voiceInfo: { flex: 1, marginLeft: 12 },
  voiceName: { fontSize: 16, fontWeight: '500', color: '#FFFFFF' },
  voiceCategory: { fontSize: 14, color: '#8B5CF6', marginTop: 2, textTransform: 'capitalize' },
});
