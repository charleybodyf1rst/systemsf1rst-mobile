// AI Agent Screen - Full AI Orchestra with tool execution
import { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useOrchestraStore, AgentMessage, ToolCall, PendingApproval } from '../../stores/orchestra-store';

export default function AgentScreen() {
  const router = useRouter();
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const {
    currentSession,
    pendingApprovals,
    sendingMessage,
    sendMessage,
    fetchPendingApprovals,
    approveAction,
    rejectAction,
    createNewSession,
  } = useOrchestraStore();

  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  const handleSend = async () => {
    if (!inputText.trim() || sendingMessage) return;
    const message = inputText.trim();
    setInputText('');
    await sendMessage(message);
  };

  const handleApprove = async (approval: PendingApproval) => {
    try {
      await approveAction(approval.id);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to approve action');
    }
  };

  const handleReject = (approval: PendingApproval) => {
    Alert.alert(
      'Reject Action',
      `Are you sure you want to reject "${approval.tool_name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              await rejectAction(approval.id);
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to reject action');
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

  const getToolStatusColor = (status: string) => {
    switch (status) {
      case 'executed': return '#22C55E';
      case 'approved': return '#3B82F6';
      case 'rejected': return '#EF4444';
      case 'failed': return '#EF4444';
      default: return '#F59E0B';
    }
  };

  const getToolStatusIcon = (status: string) => {
    switch (status) {
      case 'executed': return 'checkmark-circle';
      case 'approved': return 'play-circle';
      case 'rejected': return 'close-circle';
      case 'failed': return 'warning';
      default: return 'time';
    }
  };

  const renderToolCall = (toolCall: ToolCall) => (
    <View key={toolCall.id} style={styles.toolCallCard}>
      <View style={styles.toolCallHeader}>
        <View style={styles.toolNameRow}>
          <Ionicons name="code-slash" size={16} color="#8B5CF6" />
          <Text style={styles.toolName}>{toolCall.name}</Text>
        </View>
        <View style={[styles.toolStatusBadge, { backgroundColor: getToolStatusColor(toolCall.status) + '20' }]}>
          <Ionicons name={getToolStatusIcon(toolCall.status) as any} size={14} color={getToolStatusColor(toolCall.status)} />
          <Text style={[styles.toolStatusText, { color: getToolStatusColor(toolCall.status) }]}>
            {toolCall.status}
          </Text>
        </View>
      </View>
      {Object.keys(toolCall.parameters).length > 0 && (
        <View style={styles.toolParams}>
          {Object.entries(toolCall.parameters).slice(0, 3).map(([key, value]) => (
            <Text key={key} style={styles.toolParamText} numberOfLines={1}>
              {key}: {typeof value === 'object' ? JSON.stringify(value) : String(value)}
            </Text>
          ))}
        </View>
      )}
    </View>
  );

  const renderPendingApproval = (approval: PendingApproval) => (
    <View key={approval.id} style={styles.approvalCard}>
      <View style={styles.approvalHeader}>
        <View style={styles.approvalTitleRow}>
          <Ionicons name="shield-checkmark" size={20} color="#F59E0B" />
          <Text style={styles.approvalTitle}>Approval Required</Text>
        </View>
        <View style={[styles.riskBadge, { backgroundColor: getRiskColor(approval.risk_level) + '20' }]}>
          <Text style={[styles.riskText, { color: getRiskColor(approval.risk_level) }]}>
            {approval.risk_level} risk
          </Text>
        </View>
      </View>
      <Text style={styles.approvalToolName}>{approval.tool_name}</Text>
      <Text style={styles.approvalDescription}>{approval.description}</Text>
      <View style={styles.approvalActions}>
        <TouchableOpacity
          style={[styles.approvalBtn, styles.rejectBtn]}
          onPress={() => handleReject(approval)}
        >
          <Ionicons name="close" size={18} color="#EF4444" />
          <Text style={styles.rejectBtnText}>Reject</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.approvalBtn, styles.approveBtn]}
          onPress={() => handleApprove(approval)}
        >
          <Ionicons name="checkmark" size={18} color="#FFFFFF" />
          <Text style={styles.approveBtnText}>Approve</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderMessage = ({ item }: { item: AgentMessage }) => (
    <View style={[styles.messageBubble, item.role === 'user' ? styles.userBubble : styles.assistantBubble]}>
      {item.role === 'assistant' && (
        <View style={styles.avatarContainer}>
          <Ionicons name="hardware-chip" size={20} color="#8B5CF6" />
        </View>
      )}
      <View style={[styles.messageContent, item.role === 'user' && styles.userContent]}>
        <Text style={[styles.messageText, item.role === 'user' && styles.userText]}>
          {item.content}
        </Text>

        {/* Tool Calls */}
        {item.tool_calls && item.tool_calls.length > 0 && (
          <View style={styles.toolCallsContainer}>
            {item.tool_calls.map(renderToolCall)}
          </View>
        )}

        {/* Tool Results */}
        {item.tool_results && item.tool_results.length > 0 && (
          <View style={styles.toolResultsContainer}>
            {item.tool_results.map((result, idx) => (
              <View key={idx} style={[styles.toolResultCard, !result.success && styles.toolResultError]}>
                <Ionicons
                  name={result.success ? 'checkmark-circle' : 'alert-circle'}
                  size={16}
                  color={result.success ? '#22C55E' : '#EF4444'}
                />
                <Text style={styles.toolResultText}>
                  {result.success ? 'Success' : result.error || 'Failed'}
                </Text>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.timestamp}>
          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </View>
  );

  const messages = currentSession?.messages || [];
  const sessionApprovals = pendingApprovals.filter(a =>
    !currentSession || a.session_id === currentSession.id
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.agentAvatar}>
            <Ionicons name="hardware-chip" size={24} color="#FFFFFF" />
          </View>
          <View>
            <Text style={styles.headerTitle}>AI Agent</Text>
            <Text style={styles.headerSubtitle}>
              {currentSession?.status === 'waiting_approval' ? 'Waiting for approval' : '100+ tools available'}
            </Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => router.push('/(crm)/approvals')}
          >
            <Ionicons name="shield-checkmark" size={22} color="#F59E0B" />
            {pendingApprovals.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{pendingApprovals.length}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} onPress={createNewSession}>
            <Ionicons name="add-circle-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Pending Approvals Banner */}
      {sessionApprovals.length > 0 && (
        <View style={styles.approvalsBanner}>
          {sessionApprovals.map(renderPendingApproval)}
        </View>
      )}

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="hardware-chip" size={64} color="#334155" />
            <Text style={styles.emptyTitle}>AI Agent Ready</Text>
            <Text style={styles.emptyText}>
              Ask me to perform actions like creating leads, sending emails, scheduling calls, or analyzing data.
            </Text>
            <View style={styles.suggestionsGrid}>
              {[
                'Create a lead from my last email',
                'Schedule a follow-up call',
                'Summarize today\'s activities',
                'Find contacts without deals',
              ].map((suggestion, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.suggestionCard}
                  onPress={() => setInputText(suggestion)}
                >
                  <Text style={styles.suggestionText}>{suggestion}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        }
        ListFooterComponent={
          sendingMessage ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#8B5CF6" />
              <Text style={styles.loadingText}>Processing...</Text>
            </View>
          ) : null
        }
      />

      {/* Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={100}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Ask the AI agent to do something..."
            placeholderTextColor="#64748B"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={1000}
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!inputText.trim() || sendingMessage) && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim() || sendingMessage}
          >
            <Ionicons name="send" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  agentAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#FFFFFF' },
  headerSubtitle: { fontSize: 14, color: '#94A3B8' },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  headerBtn: { padding: 8, marginLeft: 8, position: 'relative' },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '600' },

  approvalsBanner: { paddingHorizontal: 16, paddingTop: 12 },
  approvalCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  approvalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  approvalTitleRow: { flexDirection: 'row', alignItems: 'center' },
  approvalTitle: { fontSize: 14, fontWeight: '600', color: '#F59E0B', marginLeft: 8 },
  riskBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  riskText: { fontSize: 12, fontWeight: '500', textTransform: 'capitalize' },
  approvalToolName: { fontSize: 16, fontWeight: '600', color: '#FFFFFF', marginBottom: 6 },
  approvalDescription: { fontSize: 14, color: '#94A3B8', marginBottom: 14 },
  approvalActions: { flexDirection: 'row', justifyContent: 'flex-end' },
  approvalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginLeft: 10,
  },
  rejectBtn: { backgroundColor: '#EF444420' },
  rejectBtnText: { color: '#EF4444', fontWeight: '500', marginLeft: 6 },
  approveBtn: { backgroundColor: '#22C55E' },
  approveBtnText: { color: '#FFFFFF', fontWeight: '500', marginLeft: 6 },

  messagesList: { paddingHorizontal: 16, paddingVertical: 12, flexGrow: 1 },
  messageBubble: { flexDirection: 'row', marginBottom: 16, maxWidth: '90%' },
  userBubble: { alignSelf: 'flex-end' },
  assistantBubble: { alignSelf: 'flex-start' },
  avatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  messageContent: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 14,
    borderTopLeftRadius: 4,
    flex: 1,
  },
  userContent: {
    backgroundColor: '#8B5CF6',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 4,
  },
  messageText: { fontSize: 15, color: '#FFFFFF', lineHeight: 22 },
  userText: { color: '#FFFFFF' },
  timestamp: { fontSize: 11, color: '#64748B', marginTop: 8 },

  toolCallsContainer: { marginTop: 12 },
  toolCallCard: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  toolCallHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toolNameRow: { flexDirection: 'row', alignItems: 'center' },
  toolName: { fontSize: 13, fontWeight: '600', color: '#8B5CF6', marginLeft: 6 },
  toolStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  toolStatusText: { fontSize: 11, fontWeight: '500', marginLeft: 4, textTransform: 'capitalize' },
  toolParams: { marginTop: 8 },
  toolParamText: { fontSize: 12, color: '#94A3B8', marginBottom: 2 },

  toolResultsContainer: { marginTop: 10 },
  toolResultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#22C55E20',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 4,
  },
  toolResultError: { backgroundColor: '#EF444420' },
  toolResultText: { fontSize: 12, color: '#E2E8F0', marginLeft: 6, flex: 1 },

  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: '#FFFFFF', marginTop: 16 },
  emptyText: { fontSize: 14, color: '#94A3B8', textAlign: 'center', marginTop: 8, paddingHorizontal: 40 },
  suggestionsGrid: { marginTop: 24, paddingHorizontal: 10 },
  suggestionCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  suggestionText: { fontSize: 14, color: '#FFFFFF' },

  loadingContainer: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  loadingText: { color: '#94A3B8', marginLeft: 8, fontSize: 14 },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    backgroundColor: '#0F172A',
  },
  input: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 16,
    maxHeight: 100,
    marginRight: 10,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: { backgroundColor: '#334155' },
});
