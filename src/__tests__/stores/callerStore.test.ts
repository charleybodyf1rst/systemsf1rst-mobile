import { act } from '@testing-library/react-native';
import { useCallerStore } from '../../stores/callerStore';
import type { AICall, Voice, CallScript } from '../../stores/callerStore';

// Mock the api module
jest.mock('../../lib/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

import api from '../../lib/api';

const mockVoice: Voice = {
  voice_id: 'voice-1',
  name: 'Professional Voice',
  category: 'business',
  description: 'A professional sounding voice',
  preview_url: 'https://example.com/preview.mp3',
};

const mockCall: AICall = {
  id: 'call-1',
  contact_id: 1,
  contact_name: 'John Smith',
  contact_phone: '(555) 123-4567',
  type: 'outbound',
  status: 'queued',
  voice_id: 'voice-1',
  voice_name: 'Professional Voice',
  script: 'Hi, this is an AI assistant...',
  created_at: '2024-01-15T10:00:00Z',
};

const mockScript: CallScript = {
  id: 'script-1',
  name: 'Sales Outreach',
  type: 'outbound',
  content: 'Hi {name}, I\'m reaching out from {company}...',
  variables: ['name', 'company'],
};

describe('Caller Store', () => {
  beforeEach(() => {
    // Reset the store state before each test
    useCallerStore.setState({
      calls: [],
      currentCall: null,
      callsLoading: false,
      callsError: null,
      voices: [],
      voicesLoading: false,
      selectedVoice: null,
      scripts: [],
      scriptsLoading: false,
    });
    jest.clearAllMocks();
  });

  describe('Calls Operations', () => {
    it('should fetch calls successfully', async () => {
      (api.get as jest.Mock).mockResolvedValueOnce({ data: { data: [mockCall] } });

      const store = useCallerStore.getState();
      await act(async () => {
        await store.fetchCalls();
      });

      const updatedStore = useCallerStore.getState();
      expect(updatedStore.calls).toHaveLength(1);
      expect(updatedStore.calls[0].contact_name).toBe('John Smith');
      expect(updatedStore.callsLoading).toBe(false);
      expect(api.get).toHaveBeenCalledWith('/sales/conversational-ai/calls');
    });

    it('should handle fetch calls error', async () => {
      (api.get as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const store = useCallerStore.getState();
      await act(async () => {
        await store.fetchCalls();
      });

      const updatedStore = useCallerStore.getState();
      expect(updatedStore.callsError).toBe('Network error');
      expect(updatedStore.callsLoading).toBe(false);
      expect(updatedStore.calls).toEqual([]);
    });

    it('should initiate a call', async () => {
      useCallerStore.setState({ selectedVoice: mockVoice });
      const initiatedCall = { ...mockCall, status: 'dialing' as const };
      (api.post as jest.Mock).mockResolvedValueOnce({ data: { data: initiatedCall } });

      const store = useCallerStore.getState();
      let call: AICall | undefined;

      await act(async () => {
        call = await store.initiateCall({
          contact_id: 1,
          type: 'outbound',
          script: 'Hi, this is an AI assistant...',
        });
      });

      expect(call).toBeDefined();
      expect(call?.status).toBe('dialing');
      expect(useCallerStore.getState().currentCall).toEqual(initiatedCall);
      expect(useCallerStore.getState().calls).toHaveLength(1);
    });

    it('should initiate a call with phone number', async () => {
      (api.post as jest.Mock).mockResolvedValueOnce({ data: { data: mockCall } });

      const store = useCallerStore.getState();
      await act(async () => {
        await store.initiateCall({
          phone_number: '(555) 123-4567',
          type: 'outbound',
        });
      });

      expect(api.post).toHaveBeenCalledWith('/sales/conversational-ai/call', expect.objectContaining({
        phone_number: '(555) 123-4567',
        call_type: 'outbound',
      }));
    });

    it('should handle initiate call error', async () => {
      (api.post as jest.Mock).mockRejectedValueOnce({
        response: { data: { message: 'Invalid phone number' } },
      });

      const store = useCallerStore.getState();

      await expect(
        act(async () => {
          await store.initiateCall({ phone_number: 'invalid', type: 'outbound' });
        })
      ).rejects.toBeDefined();

      expect(useCallerStore.getState().callsError).toBe('Invalid phone number');
    });

    it('should get call status', async () => {
      useCallerStore.setState({ calls: [mockCall] });
      const updatedCall = { ...mockCall, status: 'in_progress' as const };
      (api.get as jest.Mock).mockResolvedValueOnce({ data: { data: updatedCall } });

      const store = useCallerStore.getState();
      let call: AICall | undefined;

      await act(async () => {
        call = await store.getCallStatus('call-1');
      });

      expect(call?.status).toBe('in_progress');
      expect(useCallerStore.getState().calls[0].status).toBe('in_progress');
    });

    it('should update current call when getting status', async () => {
      useCallerStore.setState({ calls: [mockCall], currentCall: mockCall });
      const updatedCall = { ...mockCall, status: 'completed' as const };
      (api.get as jest.Mock).mockResolvedValueOnce({ data: { data: updatedCall } });

      const store = useCallerStore.getState();
      await act(async () => {
        await store.getCallStatus('call-1');
      });

      expect(useCallerStore.getState().currentCall?.status).toBe('completed');
    });

    it('should get call transcript', async () => {
      useCallerStore.setState({ calls: [mockCall] });
      (api.get as jest.Mock).mockResolvedValueOnce({ data: { transcript: 'Hello, this is the transcript...' } });

      const store = useCallerStore.getState();
      let transcript: string | undefined;

      await act(async () => {
        transcript = await store.getCallTranscript('call-1');
      });

      expect(transcript).toBe('Hello, this is the transcript...');
      expect(useCallerStore.getState().calls[0].transcript).toBe('Hello, this is the transcript...');
    });

    it('should cancel a call', async () => {
      useCallerStore.setState({ calls: [mockCall], currentCall: mockCall });
      (api.post as jest.Mock).mockResolvedValueOnce({});

      const store = useCallerStore.getState();
      await act(async () => {
        await store.cancelCall('call-1');
      });

      expect(useCallerStore.getState().calls[0].status).toBe('failed');
      expect(useCallerStore.getState().currentCall).toBeNull();
    });

    it('should clear current call', () => {
      useCallerStore.setState({ currentCall: mockCall });

      const store = useCallerStore.getState();
      act(() => {
        store.clearCurrentCall();
      });

      expect(useCallerStore.getState().currentCall).toBeNull();
    });

    it('should support all call types', () => {
      const types: AICall['type'][] = ['outbound', 'follow_up', 'reminder', 'security_alert'];
      types.forEach((type) => {
        useCallerStore.setState({ calls: [{ ...mockCall, type }] });
        expect(useCallerStore.getState().calls[0].type).toBe(type);
      });
    });

    it('should support all call statuses', () => {
      const statuses: AICall['status'][] = ['queued', 'dialing', 'in_progress', 'completed', 'failed', 'no_answer'];
      statuses.forEach((status) => {
        useCallerStore.setState({ calls: [{ ...mockCall, status }] });
        expect(useCallerStore.getState().calls[0].status).toBe(status);
      });
    });
  });

  describe('Voices Operations', () => {
    it('should fetch voices successfully', async () => {
      (api.get as jest.Mock).mockResolvedValueOnce({ data: { voices: [mockVoice] } });

      const store = useCallerStore.getState();
      await act(async () => {
        await store.fetchVoices();
      });

      const updatedStore = useCallerStore.getState();
      expect(updatedStore.voices).toHaveLength(1);
      expect(updatedStore.voices[0].name).toBe('Professional Voice');
      expect(updatedStore.voicesLoading).toBe(false);
      // Should auto-select first voice
      expect(updatedStore.selectedVoice).toEqual(mockVoice);
    });

    it('should not override selected voice when fetching', async () => {
      const existingVoice = { ...mockVoice, voice_id: 'voice-2', name: 'Existing Voice' };
      useCallerStore.setState({ selectedVoice: existingVoice });
      (api.get as jest.Mock).mockResolvedValueOnce({ data: { voices: [mockVoice] } });

      const store = useCallerStore.getState();
      await act(async () => {
        await store.fetchVoices();
      });

      // Should keep existing selection
      expect(useCallerStore.getState().selectedVoice?.voice_id).toBe('voice-2');
    });

    it('should set fallback voices on error', async () => {
      (api.get as jest.Mock).mockRejectedValueOnce(new Error('API error'));

      const store = useCallerStore.getState();
      await act(async () => {
        await store.fetchVoices();
      });

      const updatedStore = useCallerStore.getState();
      expect(updatedStore.voices).toHaveLength(3);
      expect(updatedStore.voices.map(v => v.voice_id)).toContain('default');
      expect(updatedStore.voices.map(v => v.voice_id)).toContain('professional');
      expect(updatedStore.voices.map(v => v.voice_id)).toContain('friendly');
    });

    it('should set selected voice', () => {
      const store = useCallerStore.getState();

      act(() => {
        store.setSelectedVoice(mockVoice);
      });

      expect(useCallerStore.getState().selectedVoice).toEqual(mockVoice);
    });

    it('should clear selected voice', () => {
      useCallerStore.setState({ selectedVoice: mockVoice });

      const store = useCallerStore.getState();
      act(() => {
        store.setSelectedVoice(null);
      });

      expect(useCallerStore.getState().selectedVoice).toBeNull();
    });
  });

  describe('Scripts Operations', () => {
    it('should fetch scripts successfully', async () => {
      (api.get as jest.Mock).mockResolvedValueOnce({ data: { data: [mockScript] } });

      const store = useCallerStore.getState();
      await act(async () => {
        await store.fetchScripts();
      });

      const updatedStore = useCallerStore.getState();
      expect(updatedStore.scripts).toHaveLength(1);
      expect(updatedStore.scripts[0].name).toBe('Sales Outreach');
      expect(updatedStore.scriptsLoading).toBe(false);
    });

    it('should set fallback scripts on error', async () => {
      (api.get as jest.Mock).mockRejectedValueOnce(new Error('API error'));

      const store = useCallerStore.getState();
      await act(async () => {
        await store.fetchScripts();
      });

      const updatedStore = useCallerStore.getState();
      expect(updatedStore.scripts).toHaveLength(3);
      expect(updatedStore.scripts.map(s => s.id)).toContain('lead_follow_up');
      expect(updatedStore.scripts.map(s => s.id)).toContain('appointment_reminder');
      expect(updatedStore.scripts.map(s => s.id)).toContain('sales_outreach');
    });

    it('should have script variables', async () => {
      (api.get as jest.Mock).mockResolvedValueOnce({ data: { data: [mockScript] } });

      const store = useCallerStore.getState();
      await act(async () => {
        await store.fetchScripts();
      });

      expect(useCallerStore.getState().scripts[0].variables).toContain('name');
      expect(useCallerStore.getState().scripts[0].variables).toContain('company');
    });
  });

  describe('API Response Handling', () => {
    it('should handle voices response format', async () => {
      (api.get as jest.Mock).mockResolvedValueOnce({ data: { voices: [mockVoice] } });

      const store = useCallerStore.getState();
      await act(async () => {
        await store.fetchVoices();
      });

      expect(useCallerStore.getState().voices).toHaveLength(1);
    });

    it('should handle data.data response format', async () => {
      (api.get as jest.Mock).mockResolvedValueOnce({ data: { data: [mockVoice] } });

      const store = useCallerStore.getState();
      await act(async () => {
        await store.fetchVoices();
      });

      expect(useCallerStore.getState().voices).toHaveLength(1);
    });

    it('should handle direct array response format', async () => {
      (api.get as jest.Mock).mockResolvedValueOnce({ data: [mockVoice] });

      const store = useCallerStore.getState();
      await act(async () => {
        await store.fetchVoices();
      });

      expect(useCallerStore.getState().voices).toHaveLength(1);
    });
  });

  describe('Call Analysis Features', () => {
    it('should store call summary', () => {
      const callWithSummary = {
        ...mockCall,
        summary: 'Customer is interested in the product',
        sentiment: 'positive' as const,
        action_items: ['Schedule follow-up', 'Send pricing'],
      };

      useCallerStore.setState({ calls: [callWithSummary] });

      const updatedStore = useCallerStore.getState();
      expect(updatedStore.calls[0].summary).toBe('Customer is interested in the product');
      expect(updatedStore.calls[0].sentiment).toBe('positive');
      expect(updatedStore.calls[0].action_items).toHaveLength(2);
    });

    it('should store call duration', () => {
      const completedCall = {
        ...mockCall,
        status: 'completed' as const,
        duration_seconds: 180,
        started_at: '2024-01-15T10:00:00Z',
        ended_at: '2024-01-15T10:03:00Z',
      };

      useCallerStore.setState({ calls: [completedCall] });

      expect(useCallerStore.getState().calls[0].duration_seconds).toBe(180);
    });

    it('should support all sentiment values', () => {
      const sentiments: AICall['sentiment'][] = ['positive', 'neutral', 'negative'];
      sentiments.forEach((sentiment) => {
        useCallerStore.setState({ calls: [{ ...mockCall, sentiment }] });
        expect(useCallerStore.getState().calls[0].sentiment).toBe(sentiment);
      });
    });
  });
});
