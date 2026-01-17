// AI Caller Store for SystemsF1RST Mobile
// Manages AI voice calls through ElevenLabs/Twilio

import { create } from 'zustand';
import api from '../lib/api';

// Types
export interface Voice {
  voice_id: string;
  name: string;
  category?: string;
  description?: string;
  preview_url?: string;
}

export interface AICall {
  id: string;
  contact_id?: number;
  contact_name?: string;
  contact_phone?: string;
  type: 'outbound' | 'follow_up' | 'reminder' | 'security_alert';
  status: 'queued' | 'dialing' | 'in_progress' | 'completed' | 'failed' | 'no_answer';
  voice_id?: string;
  voice_name?: string;
  script?: string;
  duration_seconds?: number;
  transcript?: string;
  summary?: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  action_items?: string[];
  created_at: string;
  started_at?: string;
  ended_at?: string;
}

export interface CallScript {
  id: string;
  name: string;
  type: string;
  content: string;
  variables?: string[];
}

interface CallerState {
  // Calls
  calls: AICall[];
  currentCall: AICall | null;
  callsLoading: boolean;
  callsError: string | null;

  // Voices
  voices: Voice[];
  voicesLoading: boolean;
  selectedVoice: Voice | null;

  // Scripts
  scripts: CallScript[];
  scriptsLoading: boolean;

  // Actions
  fetchCalls: () => Promise<void>;
  fetchVoices: () => Promise<void>;
  fetchScripts: () => Promise<void>;
  initiateCall: (params: {
    contact_id?: number;
    phone_number?: string;
    type: AICall['type'];
    voice_id?: string;
    script?: string;
  }) => Promise<AICall>;
  getCallStatus: (callId: string) => Promise<AICall>;
  getCallTranscript: (callId: string) => Promise<string>;
  cancelCall: (callId: string) => Promise<void>;
  setSelectedVoice: (voice: Voice | null) => void;
  clearCurrentCall: () => void;
}

export const useCallerStore = create<CallerState>((set, get) => ({
  // Initial state
  calls: [],
  currentCall: null,
  callsLoading: false,
  callsError: null,

  voices: [],
  voicesLoading: false,
  selectedVoice: null,

  scripts: [],
  scriptsLoading: false,

  // Fetch call history
  fetchCalls: async () => {
    set({ callsLoading: true, callsError: null });
    try {
      const response = await api.get('/sales/conversational-ai/calls');
      const calls = response.data.data || response.data || [];
      set({ calls, callsLoading: false });
    } catch (error: any) {
      set({ callsError: error.message, callsLoading: false });
      // Return empty array on error (endpoint might not exist yet)
      set({ calls: [] });
    }
  },

  // Fetch available voices
  fetchVoices: async () => {
    set({ voicesLoading: true });
    try {
      const response = await api.get('/sales/elevenlabs/voices');
      const voices = response.data.voices || response.data.data || response.data || [];
      set({ voices, voicesLoading: false });

      // Set default voice if none selected
      if (!get().selectedVoice && voices.length > 0) {
        set({ selectedVoice: voices[0] });
      }
    } catch (error: any) {
      console.error('Failed to fetch voices:', error);
      set({ voicesLoading: false });
      // Set default fallback voices
      set({ voices: [
        { voice_id: 'default', name: 'Default Voice', category: 'general' },
        { voice_id: 'professional', name: 'Professional', category: 'business' },
        { voice_id: 'friendly', name: 'Friendly', category: 'casual' },
      ]});
    }
  },

  // Fetch call scripts
  fetchScripts: async () => {
    set({ scriptsLoading: true });
    try {
      const response = await api.get('/sales/conversational-ai/scripts');
      const scripts = response.data.data || response.data || [];
      set({ scripts, scriptsLoading: false });
    } catch (error: any) {
      console.error('Failed to fetch scripts:', error);
      set({ scriptsLoading: false });
      // Set default scripts
      set({ scripts: [
        {
          id: 'lead_follow_up',
          name: 'Lead Follow-up',
          type: 'follow_up',
          content: 'Hi {name}, this is an AI assistant from {company}. I\'m following up on your recent inquiry...'
        },
        {
          id: 'appointment_reminder',
          name: 'Appointment Reminder',
          type: 'reminder',
          content: 'Hi {name}, this is a reminder about your upcoming appointment on {date} at {time}...'
        },
        {
          id: 'sales_outreach',
          name: 'Sales Outreach',
          type: 'outbound',
          content: 'Hi {name}, I\'m reaching out from {company} to discuss how we can help you with {topic}...'
        },
      ]});
    }
  },

  // Initiate a new AI call
  initiateCall: async (params) => {
    set({ callsLoading: true, callsError: null });
    try {
      const response = await api.post('/sales/conversational-ai/call', {
        contact_id: params.contact_id,
        phone_number: params.phone_number,
        call_type: params.type,
        voice_id: params.voice_id || get().selectedVoice?.voice_id,
        script: params.script,
      });

      const call = response.data.data || response.data;
      set({
        currentCall: call,
        calls: [call, ...get().calls],
        callsLoading: false
      });
      return call;
    } catch (error: any) {
      set({ callsError: error.response?.data?.message || error.message, callsLoading: false });
      throw error;
    }
  },

  // Get call status
  getCallStatus: async (callId) => {
    try {
      const response = await api.get(`/sales/conversational-ai/call/${callId}`);
      const call = response.data.data || response.data;

      // Update in list and current call
      set({
        calls: get().calls.map(c => c.id === callId ? call : c),
        currentCall: get().currentCall?.id === callId ? call : get().currentCall
      });

      return call;
    } catch (error: any) {
      console.error('Failed to get call status:', error);
      throw error;
    }
  },

  // Get call transcript
  getCallTranscript: async (callId) => {
    try {
      const response = await api.get(`/sales/conversational-ai/call/${callId}/transcript`);
      const transcript = response.data.transcript || response.data.data || '';

      // Update call with transcript
      set({
        calls: get().calls.map(c => c.id === callId ? { ...c, transcript } : c)
      });

      return transcript;
    } catch (error: any) {
      console.error('Failed to get transcript:', error);
      throw error;
    }
  },

  // Cancel a call
  cancelCall: async (callId) => {
    try {
      await api.post(`/sales/conversational-ai/call/${callId}/cancel`);
      set({
        calls: get().calls.map(c => c.id === callId ? { ...c, status: 'failed' } : c),
        currentCall: get().currentCall?.id === callId ? null : get().currentCall
      });
    } catch (error: any) {
      console.error('Failed to cancel call:', error);
      throw error;
    }
  },

  // Set selected voice
  setSelectedVoice: (voice) => {
    set({ selectedVoice: voice });
  },

  // Clear current call
  clearCurrentCall: () => {
    set({ currentCall: null });
  },
}));
