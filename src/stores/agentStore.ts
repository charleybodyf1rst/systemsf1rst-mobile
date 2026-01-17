// Agent Store for SystemsF1RST Mobile
// Manages AI Agent sessions, tool execution, and approvals

import { create } from 'zustand';
import api from '../lib/api';

// Types
export interface ToolCall {
  id: string;
  name: string;
  parameters: Record<string, any>;
  status: 'pending' | 'approved' | 'rejected' | 'executed' | 'failed';
}

export interface ToolResult {
  tool_call_id: string;
  success: boolean;
  result?: any;
  error?: string;
}

export interface AgentMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tool_calls?: ToolCall[];
  tool_results?: ToolResult[];
  timestamp: string;
}

export interface AgentSession {
  id: string;
  messages: AgentMessage[];
  status: 'active' | 'completed' | 'waiting_approval';
  created_at: string;
  updated_at: string;
}

export interface PendingApproval {
  id: string;
  session_id: string;
  tool_name: string;
  parameters: Record<string, any>;
  description: string;
  risk_level: 'low' | 'medium' | 'high';
  created_at: string;
}

export interface AgentTool {
  name: string;
  description: string;
  category: string;
  parameters: {
    name: string;
    type: string;
    required: boolean;
    description: string;
  }[];
  requires_approval: boolean;
}

interface AgentState {
  // Sessions
  sessions: AgentSession[];
  currentSession: AgentSession | null;
  sessionsLoading: boolean;
  sessionsError: string | null;

  // Approvals
  pendingApprovals: PendingApproval[];
  approvalsLoading: boolean;
  approvalsError: string | null;

  // Tools
  availableTools: AgentTool[];
  toolsLoading: boolean;

  // Chat state
  sendingMessage: boolean;
  sendError: string | null;

  // Actions
  sendMessage: (message: string, sessionId?: string) => Promise<AgentMessage | null>;
  fetchPendingApprovals: () => Promise<void>;
  approveAction: (approvalId: string) => Promise<void>;
  rejectAction: (approvalId: string, reason?: string) => Promise<void>;
  fetchTools: () => Promise<void>;
  executeApprovedTool: (approvalId: string) => Promise<void>;
  fetchSessionHistory: () => Promise<void>;
  fetchSession: (sessionId: string) => Promise<void>;
  createNewSession: () => void;
  setCurrentSession: (session: AgentSession | null) => void;

  // Real-time handlers
  handleToolApproved: (approvalId: string) => void;
  handleToolExecuted: (toolCallId: string, result: ToolResult) => void;
}

export const useAgentStore = create<AgentState>((set, get) => ({
  // Initial state
  sessions: [],
  currentSession: null,
  sessionsLoading: false,
  sessionsError: null,

  pendingApprovals: [],
  approvalsLoading: false,
  approvalsError: null,

  availableTools: [],
  toolsLoading: false,

  sendingMessage: false,
  sendError: null,

  // Send message to AI agent
  sendMessage: async (message: string, sessionId?: string) => {
    set({ sendingMessage: true, sendError: null });
    try {
      const response = await api.post('/agent/chat', {
        message,
        session_id: sessionId || get().currentSession?.id,
      });

      const data = response.data.data || response.data;
      const assistantMessage: AgentMessage = {
        id: data.message_id || Date.now().toString(),
        role: 'assistant',
        content: data.content || data.message || '',
        tool_calls: data.tool_calls,
        tool_results: data.tool_results,
        timestamp: new Date().toISOString(),
      };

      // Update current session with new messages
      const userMessage: AgentMessage = {
        id: (Date.now() - 1).toString(),
        role: 'user',
        content: message,
        timestamp: new Date().toISOString(),
      };

      const currentSession = get().currentSession;
      if (currentSession) {
        set({
          currentSession: {
            ...currentSession,
            messages: [...currentSession.messages, userMessage, assistantMessage],
            status: data.waiting_approval ? 'waiting_approval' : 'active',
          },
          sendingMessage: false,
        });
      } else {
        // Create new session
        const newSession: AgentSession = {
          id: data.session_id || Date.now().toString(),
          messages: [userMessage, assistantMessage],
          status: data.waiting_approval ? 'waiting_approval' : 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        set({
          currentSession: newSession,
          sessions: [newSession, ...get().sessions],
          sendingMessage: false,
        });
      }

      // If there are pending approvals, refresh them
      if (data.pending_approvals?.length > 0) {
        get().fetchPendingApprovals();
      }

      return assistantMessage;
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to send message';
      set({ sendError: errorMsg, sendingMessage: false });
      return null;
    }
  },

  // Fetch pending approvals
  fetchPendingApprovals: async () => {
    set({ approvalsLoading: true, approvalsError: null });
    try {
      const response = await api.get('/agent/pending');
      const approvals = response.data.data || response.data || [];
      set({ pendingApprovals: approvals, approvalsLoading: false });
    } catch (error: any) {
      console.error('Failed to fetch pending approvals:', error);
      set({ approvalsError: error.message, approvalsLoading: false });
    }
  },

  // Approve an action
  approveAction: async (approvalId: string) => {
    try {
      await api.post('/agent/approve', { approval_id: approvalId });

      // Remove from pending list
      set({
        pendingApprovals: get().pendingApprovals.filter(a => a.id !== approvalId),
      });

      // Update tool call status in current session
      const currentSession = get().currentSession;
      if (currentSession) {
        const updatedMessages = currentSession.messages.map(msg => {
          if (msg.tool_calls) {
            return {
              ...msg,
              tool_calls: msg.tool_calls.map(tc =>
                tc.id === approvalId ? { ...tc, status: 'approved' as const } : tc
              ),
            };
          }
          return msg;
        });
        set({
          currentSession: { ...currentSession, messages: updatedMessages },
        });
      }
    } catch (error: any) {
      console.error('Failed to approve action:', error);
      throw error;
    }
  },

  // Reject an action
  rejectAction: async (approvalId: string, reason?: string) => {
    try {
      await api.post('/agent/reject', { approval_id: approvalId, reason });

      // Remove from pending list
      set({
        pendingApprovals: get().pendingApprovals.filter(a => a.id !== approvalId),
      });

      // Update tool call status in current session
      const currentSession = get().currentSession;
      if (currentSession) {
        const updatedMessages = currentSession.messages.map(msg => {
          if (msg.tool_calls) {
            return {
              ...msg,
              tool_calls: msg.tool_calls.map(tc =>
                tc.id === approvalId ? { ...tc, status: 'rejected' as const } : tc
              ),
            };
          }
          return msg;
        });
        set({
          currentSession: {
            ...currentSession,
            messages: updatedMessages,
            status: 'active',
          },
        });
      }
    } catch (error: any) {
      console.error('Failed to reject action:', error);
      throw error;
    }
  },

  // Fetch available tools
  fetchTools: async () => {
    set({ toolsLoading: true });
    try {
      const response = await api.get('/agent/tools');
      const tools = response.data.data || response.data || [];
      set({ availableTools: tools, toolsLoading: false });
    } catch (error: any) {
      console.error('Failed to fetch tools:', error);
      set({ toolsLoading: false });
    }
  },

  // Execute an approved tool
  executeApprovedTool: async (approvalId: string) => {
    try {
      const response = await api.post('/agent/execute', { approval_id: approvalId });
      const result = response.data.data || response.data;

      // Update tool call with result
      const currentSession = get().currentSession;
      if (currentSession) {
        const updatedMessages = currentSession.messages.map(msg => {
          if (msg.tool_calls) {
            return {
              ...msg,
              tool_calls: msg.tool_calls.map(tc =>
                tc.id === approvalId ? { ...tc, status: result.success ? 'executed' as const : 'failed' as const } : tc
              ),
              tool_results: [...(msg.tool_results || []), {
                tool_call_id: approvalId,
                success: result.success,
                result: result.result,
                error: result.error,
              }],
            };
          }
          return msg;
        });
        set({
          currentSession: { ...currentSession, messages: updatedMessages },
        });
      }
    } catch (error: any) {
      console.error('Failed to execute tool:', error);
      throw error;
    }
  },

  // Fetch session history
  fetchSessionHistory: async () => {
    set({ sessionsLoading: true, sessionsError: null });
    try {
      const response = await api.get('/agent/sessions');
      const sessions = response.data.data || response.data || [];
      set({ sessions, sessionsLoading: false });
    } catch (error: any) {
      console.error('Failed to fetch session history:', error);
      set({ sessionsError: error.message, sessionsLoading: false });
    }
  },

  // Fetch a specific session
  fetchSession: async (sessionId: string) => {
    try {
      const response = await api.get(`/agent/sessions/${sessionId}`);
      const session = response.data.data || response.data;
      set({ currentSession: session });
    } catch (error: any) {
      console.error('Failed to fetch session:', error);
    }
  },

  // Create a new session
  createNewSession: () => {
    set({ currentSession: null });
  },

  // Set current session
  setCurrentSession: (session: AgentSession | null) => {
    set({ currentSession: session });
  },

  // Real-time: Handle tool approved
  handleToolApproved: (approvalId: string) => {
    set({
      pendingApprovals: get().pendingApprovals.filter(a => a.id !== approvalId),
    });
  },

  // Real-time: Handle tool executed
  handleToolExecuted: (toolCallId: string, result: ToolResult) => {
    const currentSession = get().currentSession;
    if (currentSession) {
      const updatedMessages = currentSession.messages.map(msg => {
        if (msg.tool_calls) {
          return {
            ...msg,
            tool_calls: msg.tool_calls.map(tc =>
              tc.id === toolCallId ? { ...tc, status: result.success ? 'executed' as const : 'failed' as const } : tc
            ),
            tool_results: [...(msg.tool_results || []), result],
          };
        }
        return msg;
      });
      set({
        currentSession: { ...currentSession, messages: updatedMessages },
      });
    }
  },
}));
