// AI Assistant Screen for CRM
import { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import api from '../../lib/api';
import { useCrmStore } from '../../stores/crmStore';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  action?: string;
  timestamp: Date;
}

export default function AiAssistantScreen() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your CRM AI assistant. I can help you manage leads, contacts, and deals. Try saying:\n\n- "Create a lead named John Smith"\n- "Show me all open deals"\n- "Add a contact for ABC Company"',
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const { fetchLeads, fetchContacts, fetchDeals } = useCrmStore();

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      // Parse the command and execute AI action
      const response = await api.post('/crm/ai-action', {
        message: userMessage.content,
        source: 'mobile_chat',
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data.message || response.data.data?.message || 'Action completed.',
        action: response.data.action,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Refresh data if action was performed
      if (response.data.action) {
        fetchLeads();
        fetchContacts();
        fetchDeals();
      }
    } catch (error: any) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: error.response?.data?.message || 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestedCommands = [
    'Create a new lead',
    'Show all deals',
    'Add a contact',
    'Pipeline summary',
  ];

  const handleSuggestion = (command: string) => {
    setInputText(command);
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[styles.messageBubble, item.role === 'user' ? styles.userBubble : styles.assistantBubble]}>
      {item.role === 'assistant' && (
        <View style={styles.avatarContainer}>
          <Ionicons name="sparkles" size={20} color="#8B5CF6" />
        </View>
      )}
      <View style={[styles.messageContent, item.role === 'user' && styles.userContent]}>
        <Text style={[styles.messageText, item.role === 'user' && styles.userText]}>
          {item.content}
        </Text>
        {item.action && (
          <View style={styles.actionBadge}>
            <Ionicons name="checkmark-circle" size={14} color="#22C55E" />
            <Text style={styles.actionText}>{item.action}</Text>
          </View>
        )}
        <Text style={styles.timestamp}>
          {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.aiAvatar}>
            <Ionicons name="sparkles" size={24} color="#FFFFFF" />
          </View>
          <View>
            <Text style={styles.headerTitle}>AI Assistant</Text>
            <Text style={styles.headerSubtitle}>CRM Commands</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.callerButton}
          onPress={() => router.push('/(crm)/caller')}
        >
          <Ionicons name="call" size={20} color="#FFFFFF" />
          <Text style={styles.callerButtonText}>AI Caller</Text>
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        ListFooterComponent={
          isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#8B5CF6" />
              <Text style={styles.loadingText}>Thinking...</Text>
            </View>
          ) : null
        }
      />

      {/* Suggestions */}
      {messages.length <= 2 && (
        <View style={styles.suggestionsContainer}>
          <Text style={styles.suggestionsTitle}>Try these commands:</Text>
          <View style={styles.suggestionsList}>
            {suggestedCommands.map((cmd, index) => (
              <TouchableOpacity
                key={index}
                style={styles.suggestionChip}
                onPress={() => handleSuggestion(cmd)}
              >
                <Text style={styles.suggestionText}>{cmd}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={100}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Ask me anything about your CRM..."
            placeholderTextColor="#64748B"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim() || isLoading}
          >
            <Ionicons name="send" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
  },
  callerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#22C55E',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
  },
  callerButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 6,
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  messageBubble: {
    flexDirection: 'row',
    marginBottom: 16,
    maxWidth: '85%',
  },
  userBubble: {
    alignSelf: 'flex-end',
  },
  assistantBubble: {
    alignSelf: 'flex-start',
  },
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
  },
  userContent: {
    backgroundColor: '#8B5CF6',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 4,
  },
  messageText: {
    fontSize: 15,
    color: '#FFFFFF',
    lineHeight: 22,
  },
  userText: {
    color: '#FFFFFF',
  },
  actionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#22C55E20',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 10,
  },
  actionText: {
    color: '#22C55E',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  timestamp: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  loadingText: {
    color: '#94A3B8',
    marginLeft: 8,
    fontSize: 14,
  },
  suggestionsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  suggestionsTitle: {
    color: '#94A3B8',
    fontSize: 13,
    marginBottom: 10,
  },
  suggestionsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  suggestionChip: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  suggestionText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
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
  sendButtonDisabled: {
    backgroundColor: '#334155',
  },
});
