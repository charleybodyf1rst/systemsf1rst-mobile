// Messages Screen - Real SMS & Email Conversations
import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  TextInput,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMessagingStore, Conversation, Message } from '../../stores/messagingStore';
import { useCrmStore, Contact } from '../../stores/crmStore';

export default function MessagesScreen() {
  const {
    conversations, conversationsLoading, conversationsError,
    currentConversation, messages, messagesLoading,
    sendingMessage, sendError,
    fetchConversations, fetchMessages, sendMessage, sendNewMessage,
    setCurrentConversation, markAsRead
  } = useMessagingStore();

  const { contacts, fetchContacts } = useCrmStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [showThread, setShowThread] = useState(false);
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [newMessageType, setNewMessageType] = useState<'sms' | 'email'>('sms');
  const [newMessageTo, setNewMessageTo] = useState('');
  const [newMessageSubject, setNewMessageSubject] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    fetchConversations();
    fetchContacts();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchConversations();
    setRefreshing(false);
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const filteredConversations = conversations.filter(conv =>
    conv.participant_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openConversation = (conversation: Conversation) => {
    setCurrentConversation(conversation);
    setShowThread(true);
  };

  const closeThread = () => {
    setShowThread(false);
    setCurrentConversation(null);
    setMessageInput('');
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !currentConversation) return;

    try {
      await sendMessage(currentConversation.id, messageInput.trim(), currentConversation.channel);
      setMessageInput('');
      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send message');
    }
  };

  const handleSendNewMessage = async () => {
    if (!newMessageTo.trim() || !messageInput.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      await sendNewMessage({
        to: newMessageTo.trim(),
        content: messageInput.trim(),
        type: newMessageType,
        subject: newMessageType === 'email' ? newMessageSubject : undefined,
      });
      setShowNewMessage(false);
      setNewMessageTo('');
      setNewMessageSubject('');
      setMessageInput('');
      Alert.alert('Success', 'Message sent successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send message');
    }
  };

  const renderConversation = ({ item }: { item: Conversation }) => (
    <TouchableOpacity style={styles.conversationCard} onPress={() => openConversation(item)}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {item.participant_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
        </Text>
      </View>
      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Text style={styles.contactName}>{item.participant_name}</Text>
          <Text style={styles.timestamp}>{formatTime(item.last_message_at)}</Text>
        </View>
        <View style={styles.conversationFooter}>
          <Ionicons
            name={item.channel === 'sms' ? 'chatbubble' : 'mail'}
            size={14}
            color="#64748B"
          />
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.last_message || 'No messages yet'}
          </Text>
        </View>
      </View>
      {item.unread_count > 0 && (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadCount}>{item.unread_count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderMessage = ({ item }: { item: Message }) => {
    const isOutgoing = item.sender_type === 'user';

    return (
      <View style={[styles.messageContainer, isOutgoing && styles.messageOutgoing]}>
        <View style={[styles.messageBubble, isOutgoing ? styles.bubbleOutgoing : styles.bubbleIncoming]}>
          <Text style={[styles.messageText, isOutgoing && styles.messageTextOutgoing]}>
            {item.content}
          </Text>
          <View style={styles.messageFooter}>
            <Text style={[styles.messageTime, isOutgoing && styles.messageTimeOutgoing]}>
              {formatTime(item.created_at)}
            </Text>
            {isOutgoing && (
              <Ionicons
                name={item.status === 'read' ? 'checkmark-done' : item.status === 'delivered' ? 'checkmark-done' : 'checkmark'}
                size={14}
                color={item.status === 'read' ? '#3B82F6' : isOutgoing ? '#E2E8F0' : '#64748B'}
                style={{ marginLeft: 4 }}
              />
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#64748B" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search conversations..."
          placeholderTextColor="#64748B"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => { setNewMessageType('sms'); setShowNewMessage(true); }}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: '#3B82F620' }]}>
            <Ionicons name="chatbubble-ellipses" size={20} color="#3B82F6" />
          </View>
          <Text style={styles.quickActionText}>New SMS</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => { setNewMessageType('email'); setShowNewMessage(true); }}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: '#10B98120' }]}>
            <Ionicons name="mail" size={20} color="#10B981" />
          </View>
          <Text style={styles.quickActionText}>New Email</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{conversations.length}</Text>
          <Text style={styles.statLabel}>Conversations</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{conversations.reduce((sum, c) => sum + c.unread_count, 0)}</Text>
          <Text style={styles.statLabel}>Unread</Text>
        </View>
      </View>

      {/* Conversations List */}
      {conversationsLoading && !refreshing ? (
        <ActivityIndicator size="large" color="#8B5CF6" style={styles.loader} />
      ) : filteredConversations.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="chatbubbles-outline" size={48} color="#64748B" />
          <Text style={styles.emptyText}>No conversations yet</Text>
          <Text style={styles.emptySubtext}>
            Start messaging your clients and leads
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredConversations}
          renderItem={renderConversation}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8B5CF6" />
          }
        />
      )}

      {/* Thread Modal */}
      <Modal visible={showThread} animationType="slide">
        <KeyboardAvoidingView
          style={styles.threadContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          {/* Thread Header */}
          <View style={styles.threadHeader}>
            <TouchableOpacity onPress={closeThread} style={styles.threadBackBtn}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.threadHeaderInfo}>
              <Text style={styles.threadName}>{currentConversation?.participant_name}</Text>
              <Text style={styles.threadSubtitle}>
                {currentConversation?.participant_phone || currentConversation?.participant_email}
              </Text>
            </View>
            <TouchableOpacity style={styles.threadActionBtn}>
              <Ionicons name="call" size={22} color="#22C55E" />
            </TouchableOpacity>
          </View>

          {/* Messages */}
          {messagesLoading ? (
            <ActivityIndicator size="large" color="#8B5CF6" style={{ flex: 1 }} />
          ) : messages.length === 0 ? (
            <View style={styles.emptyThread}>
              <Ionicons name="chatbubble-outline" size={48} color="#64748B" />
              <Text style={styles.emptyThreadText}>No messages yet</Text>
              <Text style={styles.emptyThreadSubtext}>Send the first message below</Text>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderMessage}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.messagesList}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
            />
          )}

          {/* Input Bar */}
          <View style={styles.inputBar}>
            <TouchableOpacity style={styles.attachBtn}>
              <Ionicons name="add-circle" size={28} color="#8B5CF6" />
            </TouchableOpacity>
            <TextInput
              style={styles.messageInputField}
              placeholder={`Type a ${currentConversation?.channel || 'message'}...`}
              placeholderTextColor="#64748B"
              value={messageInput}
              onChangeText={setMessageInput}
              multiline
            />
            <TouchableOpacity
              style={[styles.sendBtn, !messageInput.trim() && styles.sendBtnDisabled]}
              onPress={handleSendMessage}
              disabled={!messageInput.trim() || sendingMessage}
            >
              {sendingMessage ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="send" size={20} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* New Message Modal */}
      <Modal visible={showNewMessage} animationType="slide" transparent>
        <View style={styles.newMessageOverlay}>
          <KeyboardAvoidingView
            style={styles.newMessageContent}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <View style={styles.newMessageHeader}>
              <Text style={styles.newMessageTitle}>
                New {newMessageType === 'sms' ? 'SMS' : 'Email'}
              </Text>
              <TouchableOpacity onPress={() => { setShowNewMessage(false); setMessageInput(''); }}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>To</Text>
            <TextInput
              style={styles.newMessageInput}
              placeholder={newMessageType === 'sms' ? 'Phone number' : 'Email address'}
              placeholderTextColor="#64748B"
              keyboardType={newMessageType === 'sms' ? 'phone-pad' : 'email-address'}
              autoCapitalize="none"
              value={newMessageTo}
              onChangeText={setNewMessageTo}
            />

            {newMessageType === 'email' && (
              <>
                <Text style={styles.inputLabel}>Subject</Text>
                <TextInput
                  style={styles.newMessageInput}
                  placeholder="Email subject"
                  placeholderTextColor="#64748B"
                  value={newMessageSubject}
                  onChangeText={setNewMessageSubject}
                />
              </>
            )}

            <Text style={styles.inputLabel}>Message</Text>
            <TextInput
              style={[styles.newMessageInput, styles.messageTextArea]}
              placeholder="Type your message..."
              placeholderTextColor="#64748B"
              multiline
              numberOfLines={5}
              value={messageInput}
              onChangeText={setMessageInput}
            />

            {/* Quick Contact Picker */}
            {contacts.length > 0 && (
              <>
                <Text style={styles.inputLabel}>Or select a contact</Text>
                <FlatList
                  horizontal
                  data={contacts.filter(c => newMessageType === 'sms' ? c.phone : c.email)}
                  keyExtractor={(item) => item.id.toString()}
                  showsHorizontalScrollIndicator={false}
                  style={styles.contactPicker}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.contactChip,
                        newMessageTo === (newMessageType === 'sms' ? item.phone : item.email) && styles.contactChipActive
                      ]}
                      onPress={() => setNewMessageTo((newMessageType === 'sms' ? item.phone : item.email) || '')}
                    >
                      <Text style={styles.contactChipText}>{item.name}</Text>
                    </TouchableOpacity>
                  )}
                />
              </>
            )}

            <TouchableOpacity
              style={[styles.sendMessageBtn, sendingMessage && styles.sendMessageBtnDisabled]}
              onPress={handleSendNewMessage}
              disabled={sendingMessage}
            >
              {sendingMessage ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="send" size={20} color="#FFFFFF" />
                  <Text style={styles.sendMessageBtnText}>Send {newMessageType === 'sms' ? 'SMS' : 'Email'}</Text>
                </>
              )}
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    padding: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    marginLeft: 12,
    color: '#F8FAFC',
    fontSize: 16,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  quickAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionText: {
    color: '#F8FAFC',
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  statItem: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 12,
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
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 8,
  },
  list: {
    paddingBottom: 20,
  },
  conversationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  timestamp: {
    fontSize: 12,
    color: '#64748B',
  },
  conversationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  lastMessage: {
    flex: 1,
    fontSize: 14,
    color: '#94A3B8',
  },
  unreadBadge: {
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8,
  },
  unreadCount: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },

  // Thread styles
  threadContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  threadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'ios' ? 56 : 12,
  },
  threadBackBtn: {
    padding: 8,
  },
  threadHeaderInfo: {
    flex: 1,
    marginLeft: 8,
  },
  threadName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  threadSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 2,
  },
  threadActionBtn: {
    padding: 8,
  },
  emptyThread: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyThreadText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginTop: 12,
  },
  emptyThreadSubtext: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  messagesList: {
    padding: 16,
  },
  messageContainer: {
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  messageOutgoing: {
    alignItems: 'flex-end',
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: 16,
    padding: 12,
  },
  bubbleIncoming: {
    backgroundColor: '#1E293B',
    borderBottomLeftRadius: 4,
  },
  bubbleOutgoing: {
    backgroundColor: '#8B5CF6',
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 15,
    color: '#E2E8F0',
    lineHeight: 20,
  },
  messageTextOutgoing: {
    color: '#FFFFFF',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  messageTime: {
    fontSize: 11,
    color: '#64748B',
  },
  messageTimeOutgoing: {
    color: '#E2E8F0',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
  },
  attachBtn: {
    padding: 8,
  },
  messageInputField: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 16,
    maxHeight: 100,
    marginHorizontal: 8,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#64748B',
  },

  // New message modal
  newMessageOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  newMessageContent: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
  },
  newMessageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  newMessageTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  inputLabel: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 8,
    marginTop: 12,
  },
  newMessageInput: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 16,
    color: '#FFFFFF',
    fontSize: 16,
  },
  messageTextArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  contactPicker: {
    marginTop: 8,
    marginBottom: 16,
  },
  contactChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#0F172A',
    marginRight: 8,
  },
  contactChipActive: {
    backgroundColor: '#8B5CF6',
  },
  contactChipText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  sendMessageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  sendMessageBtnDisabled: {
    backgroundColor: '#64748B',
  },
  sendMessageBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
