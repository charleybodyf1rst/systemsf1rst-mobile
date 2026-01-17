// Messaging Store for SystemsF1RST Mobile
// Manages SMS, email, and conversation threads

import { create } from 'zustand';
import api from '../lib/api';

// Types
export interface Participant {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  type: 'contact' | 'lead' | 'user';
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id?: number;
  sender_name?: string;
  sender_type: 'user' | 'contact' | 'system' | 'ai';
  content: string;
  type: 'sms' | 'email' | 'internal' | 'ai_response';
  status: 'sent' | 'delivered' | 'read' | 'failed' | 'pending';
  media_url?: string;
  metadata?: {
    subject?: string;
    twilio_sid?: string;
    email_id?: string;
  };
  created_at: string;
  read_at?: string;
}

export interface Conversation {
  id: string;
  participant_id?: number;
  participant_name: string;
  participant_phone?: string;
  participant_email?: string;
  participant_type: 'contact' | 'lead';
  channel: 'sms' | 'email' | 'mixed';
  last_message?: string;
  last_message_at?: string;
  unread_count: number;
  status: 'active' | 'archived' | 'closed';
  created_at: string;
}

interface MessagingState {
  // Conversations
  conversations: Conversation[];
  conversationsLoading: boolean;
  conversationsError: string | null;

  // Current thread
  currentConversation: Conversation | null;
  messages: Message[];
  messagesLoading: boolean;
  messagesError: string | null;

  // Sending state
  sendingMessage: boolean;
  sendError: string | null;

  // Actions
  fetchConversations: () => Promise<void>;
  fetchMessages: (conversationId: string) => Promise<void>;
  sendMessage: (conversationId: string, content: string, type?: 'sms' | 'email') => Promise<Message>;
  sendNewMessage: (params: {
    to: string;
    content: string;
    type: 'sms' | 'email';
    subject?: string;
  }) => Promise<Message>;
  markAsRead: (conversationId: string, messageId?: string) => Promise<void>;
  archiveConversation: (conversationId: string) => Promise<void>;
  setCurrentConversation: (conversation: Conversation | null) => void;

  // Real-time handlers
  handleNewMessage: (message: Message) => void;
  handleMessageStatusUpdate: (messageId: string, status: Message['status']) => void;
}

export const useMessagingStore = create<MessagingState>((set, get) => ({
  // Initial state
  conversations: [],
  conversationsLoading: false,
  conversationsError: null,

  currentConversation: null,
  messages: [],
  messagesLoading: false,
  messagesError: null,

  sendingMessage: false,
  sendError: null,

  // Fetch all conversations
  fetchConversations: async () => {
    set({ conversationsLoading: true, conversationsError: null });
    try {
      const response = await api.get('/customer/conversations');
      const conversations = response.data.data || response.data || [];
      set({ conversations, conversationsLoading: false });
    } catch (error: any) {
      console.error('Failed to fetch conversations:', error);
      set({ conversationsError: error.message, conversationsLoading: false });
      // Return empty array on error (endpoint might not exist)
      set({ conversations: [] });
    }
  },

  // Fetch messages for a conversation
  fetchMessages: async (conversationId: string) => {
    set({ messagesLoading: true, messagesError: null });
    try {
      const response = await api.get(`/customer/conversations/${conversationId}/messages`);
      const messages = response.data.data || response.data || [];
      set({ messages, messagesLoading: false });
    } catch (error: any) {
      console.error('Failed to fetch messages:', error);
      set({ messagesError: error.message, messagesLoading: false });
    }
  },

  // Send a message in existing conversation
  sendMessage: async (conversationId, content, type = 'sms') => {
    set({ sendingMessage: true, sendError: null });
    try {
      const response = await api.post(`/customer/conversations/${conversationId}/messages`, {
        content,
        type,
      });
      const message = response.data.data || response.data;

      // Add to messages list
      set({ messages: [...get().messages, message] });

      // Update conversation last message
      set({
        conversations: get().conversations.map(c =>
          c.id === conversationId
            ? { ...c, last_message: content, last_message_at: new Date().toISOString() }
            : c
        ),
        sendingMessage: false
      });

      return message;
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message;
      set({ sendError: errorMsg, sendingMessage: false });
      throw new Error(errorMsg);
    }
  },

  // Send a new message (creates conversation if needed)
  sendNewMessage: async (params) => {
    set({ sendingMessage: true, sendError: null });
    try {
      const response = await api.post('/customer/messages/send', {
        to: params.to,
        content: params.content,
        type: params.type,
        subject: params.subject,
      });
      const message = response.data.data || response.data;

      // Refresh conversations to get new thread
      await get().fetchConversations();

      set({ sendingMessage: false });
      return message;
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message;
      set({ sendError: errorMsg, sendingMessage: false });
      throw new Error(errorMsg);
    }
  },

  // Mark messages as read
  markAsRead: async (conversationId, messageId) => {
    try {
      if (messageId) {
        await api.post(`/customer/conversations/${conversationId}/messages/${messageId}/read`);
        set({
          messages: get().messages.map(m =>
            m.id === messageId ? { ...m, status: 'read', read_at: new Date().toISOString() } : m
          )
        });
      } else {
        // Mark all as read
        await api.post(`/customer/conversations/${conversationId}/read`);
        set({
          messages: get().messages.map(m => ({ ...m, status: 'read', read_at: new Date().toISOString() })),
          conversations: get().conversations.map(c =>
            c.id === conversationId ? { ...c, unread_count: 0 } : c
          )
        });
      }
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  },

  // Archive a conversation
  archiveConversation: async (conversationId) => {
    try {
      await api.post(`/customer/conversations/${conversationId}/archive`);
      set({
        conversations: get().conversations.map(c =>
          c.id === conversationId ? { ...c, status: 'archived' } : c
        )
      });
    } catch (error: any) {
      console.error('Failed to archive:', error);
      throw error;
    }
  },

  // Set current conversation
  setCurrentConversation: (conversation) => {
    set({ currentConversation: conversation, messages: [] });
    if (conversation) {
      get().fetchMessages(conversation.id);
      get().markAsRead(conversation.id);
    }
  },

  // Real-time: Handle incoming message
  handleNewMessage: (message) => {
    const { currentConversation, conversations } = get();

    // Add to current thread if in that conversation
    if (currentConversation?.id === message.conversation_id) {
      set({ messages: [...get().messages, message] });
    }

    // Update conversation list
    set({
      conversations: conversations.map(c =>
        c.id === message.conversation_id
          ? {
              ...c,
              last_message: message.content,
              last_message_at: message.created_at,
              unread_count: currentConversation?.id === message.conversation_id ? c.unread_count : c.unread_count + 1
            }
          : c
      )
    });
  },

  // Real-time: Handle message status update
  handleMessageStatusUpdate: (messageId, status) => {
    set({
      messages: get().messages.map(m =>
        m.id === messageId ? { ...m, status } : m
      )
    });
  },
}));
