import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { router } from 'expo-router';
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
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);

  // Request microphone permission on mount
  useEffect(() => {
    const requestPermission = async () => {
      try {
        const { status } = await Audio.requestPermissionsAsync();
        setPermissionGranted(status === 'granted');
      } catch (error) {
        console.error('Error requesting microphone permission:', error);
      }
    };
    requestPermission();

    // Cleanup recording on unmount
    return () => {
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => {});
      }
    };
  }, []);

  const handleQuickAction = (action: QuickAction) => {
    switch (action.id) {
      case 'email':
        Alert.alert('Draft Email', 'Who would you like to email?', [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Continue',
            onPress: () => {
              setMessage('Help me draft a professional email to ');
            }
          },
        ]);
        break;
      case 'document':
        Alert.alert('Create Document', 'What type of document?', [
          {
            text: 'Contract',
            onPress: () => {
              setMessage('Help me create a contract for ');
            }
          },
          {
            text: 'Proposal',
            onPress: () => {
              setMessage('Help me create a proposal for ');
            }
          },
          { text: 'Cancel', style: 'cancel' },
        ]);
        break;
      case 'call':
        Alert.alert('AI Caller', 'Navigate to AI Caller?', [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Open Caller',
            onPress: () => {
              router.push('/(crm)/caller' as any);
            }
          },
        ]);
        break;
      case 'chat':
        // Focus on text input - handled by default
        break;
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    try {
      const response = await api.post('/agent/chat', {
        message: message.trim(),
      });
      // TODO: Handle AI response - display in conversation
      setMessage('');
    } catch (error) {
      console.error('AI chat error:', error);
      Alert.alert('Error', 'Failed to send message');
    }
  };

  const startRecording = async () => {
    if (!permissionGranted) {
      Alert.alert('Permission Required', 'Microphone permission is needed for voice input.');
      return;
    }

    try {
      // Configure audio mode for recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Create and start recording
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();

      recordingRef.current = recording;
      setIsListening(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start voice recording');
    }
  };

  const stopRecording = async () => {
    if (!recordingRef.current) return;

    setIsListening(false);
    setIsProcessingVoice(true);

    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      if (uri) {
        // Send audio to backend for transcription
        const formData = new FormData();
        formData.append('audio', {
          uri,
          type: 'audio/m4a',
          name: 'voice-input.m4a',
        } as unknown as Blob);

        try {
          const response = await api.post('/agent/transcribe', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });

          if (response.data?.text) {
            setMessage(response.data.text);
          }
        } catch (transcribeError) {
          console.error('Transcription error:', transcribeError);
          Alert.alert('Transcription Failed', 'Could not convert speech to text. Please try typing your message.');
        }
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
    } finally {
      setIsProcessingVoice(false);
      // Reset audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });
    }
  };

  const toggleListening = async () => {
    if (isProcessingVoice) return;

    if (isListening) {
      await stopRecording();
    } else {
      await startRecording();
    }
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
          style={[
            styles.voiceButton,
            isListening && styles.voiceButtonActive,
            isProcessingVoice && styles.voiceButtonProcessing,
          ]}
          onPress={toggleListening}
          disabled={isProcessingVoice}
        >
          {isProcessingVoice ? (
            <ActivityIndicator size="small" color="#8B5CF6" />
          ) : (
            <Ionicons
              name={isListening ? 'mic' : 'mic-outline'}
              size={24}
              color={isListening ? '#fff' : '#8B5CF6'}
            />
          )}
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
  voiceButtonProcessing: {
    backgroundColor: '#334155',
    borderColor: '#64748B',
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
