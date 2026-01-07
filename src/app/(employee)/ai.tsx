import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../lib/api';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const quickActions: QuickAction[] = [
  {
    id: 'email',
    title: 'Draft Email',
    description: 'Send to client or lead',
    icon: 'mail-outline',
    color: '#3B82F6',
  },
  {
    id: 'document',
    title: 'Create Document',
    description: 'Generate contracts, proposals',
    icon: 'document-text-outline',
    color: '#10B981',
  },
  {
    id: 'call',
    title: 'AI Caller',
    description: 'Call a client with AI voice',
    icon: 'call-outline',
    color: '#8B5CF6',
  },
  {
    id: 'chat',
    title: 'Ask Anything',
    description: 'Chat with your AI assistant',
    icon: 'chatbubble-ellipses-outline',
    color: '#F59E0B',
  },
];

export default function AIAgentScreen() {
  const [message, setMessage] = useState('');
  const [isListening, setIsListening] = useState(false);

  const handleQuickAction = (action: QuickAction) => {
    switch (action.id) {
      case 'email':
        Alert.alert('Draft Email', 'Who would you like to email?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Continue', onPress: () => console.log('Email flow') },
        ]);
        break;
      case 'document':
        Alert.alert('Create Document', 'What type of document?', [
          { text: 'Contract', onPress: () => console.log('Contract') },
          { text: 'Proposal', onPress: () => console.log('Proposal') },
          { text: 'Cancel', style: 'cancel' },
        ]);
        break;
      case 'call':
        Alert.alert('AI Caller', 'Select a contact to call with AI voice', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Select Contact', onPress: () => console.log('Contact picker') },
        ]);
        break;
      case 'chat':
        // Focus on text input or open chat
        break;
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    try {
      const response = await api.post('/agent/chat', {
        message: message.trim(),
      });
      console.log('AI response:', response.data);
      setMessage('');
    } catch (error) {
      console.error('AI chat error:', error);
      Alert.alert('Error', 'Failed to send message');
    }
  };

  const toggleListening = () => {
    setIsListening(!isListening);
    // TODO: Implement voice input
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="sparkles" size={32} color="#8B5CF6" />
          <Text style={styles.title}>AI Agent</Text>
        </View>

        <Text style={styles.subtitle}>What can I help you with?</Text>

        {/* Quick Actions */}
        <View style={styles.actionsGrid}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={styles.actionCard}
              onPress={() => handleQuickAction(action)}
            >
              <View style={[styles.actionIcon, { backgroundColor: action.color + '20' }]}>
                <Ionicons name={action.icon} size={24} color={action.color} />
              </View>
              <Text style={styles.actionTitle}>{action.title}</Text>
              <Text style={styles.actionDescription}>{action.description}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Conversations */}
        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>Recent Conversations</Text>
          <View style={styles.emptyConversations}>
            <Ionicons name="chatbubbles-outline" size={32} color="#64748B" />
            <Text style={styles.emptyText}>No recent conversations</Text>
          </View>
        </View>
      </ScrollView>

      {/* Input Area */}
      <View style={styles.inputContainer}>
        <TouchableOpacity
          style={[styles.voiceButton, isListening && styles.voiceButtonActive]}
          onPress={toggleListening}
        >
          <Ionicons
            name={isListening ? 'mic' : 'mic-outline'}
            size={24}
            color={isListening ? '#fff' : '#8B5CF6'}
          />
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder="Type a message or tap mic to speak..."
          placeholderTextColor="#64748B"
          value={message}
          onChangeText={setMessage}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendButton, !message.trim() && styles.sendButtonDisabled]}
          onPress={handleSendMessage}
          disabled={!message.trim()}
        >
          <Ionicons name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },
  subtitle: {
    fontSize: 16,
    color: '#94A3B8',
    marginBottom: 24,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
  },
  actionCard: {
    width: '48%',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 12,
    color: '#94A3B8',
  },
  recentSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 16,
  },
  emptyConversations: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748B',
    marginTop: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    paddingBottom: 32,
    backgroundColor: '#1E293B',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    gap: 12,
  },
  voiceButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1E293B',
    borderWidth: 2,
    borderColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceButtonActive: {
    backgroundColor: '#8B5CF6',
  },
  input: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#F8FAFC',
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#334155',
  },
});
