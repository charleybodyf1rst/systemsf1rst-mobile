// CRM Store for SystemsF1RST Mobile
// Manages leads, contacts, deals, and communications

import { create } from 'zustand';
import api from '../lib/api';

// Types
export interface Lead {
  id: number;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  source?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: number;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  title?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Deal {
  id: number;
  name: string;
  value: number;
  stage: string;
  probability?: number;
  expected_close_date?: string;
  contact_id?: number;
  contact?: Contact;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Communication {
  id: number;
  type: 'email' | 'call' | 'meeting' | 'note';
  subject: string;
  body?: string;
  contact_id?: number;
  deal_id?: number;
  created_at: string;
}

interface CrmState {
  // Leads
  leads: Lead[];
  leadsLoading: boolean;
  leadsError: string | null;

  // Contacts
  contacts: Contact[];
  contactsLoading: boolean;
  contactsError: string | null;

  // Deals
  deals: Deal[];
  dealsLoading: boolean;
  dealsError: string | null;

  // Communications
  communications: Communication[];
  communicationsLoading: boolean;
  communicationsError: string | null;

  // Actions - Leads
  fetchLeads: () => Promise<void>;
  createLead: (data: Partial<Lead>) => Promise<Lead>;
  updateLead: (id: number, data: Partial<Lead>) => Promise<Lead>;
  deleteLead: (id: number) => Promise<void>;

  // Actions - Contacts
  fetchContacts: () => Promise<void>;
  createContact: (data: Partial<Contact>) => Promise<Contact>;
  updateContact: (id: number, data: Partial<Contact>) => Promise<Contact>;
  deleteContact: (id: number) => Promise<void>;

  // Actions - Deals
  fetchDeals: () => Promise<void>;
  createDeal: (data: Partial<Deal>) => Promise<Deal>;
  updateDeal: (id: number, data: Partial<Deal>) => Promise<Deal>;
  deleteDeal: (id: number) => Promise<void>;
  moveDealStage: (id: number, stage: string) => Promise<Deal>;

  // Actions - Communications
  fetchCommunications: (params?: { contact_id?: number; deal_id?: number }) => Promise<void>;
  createCommunication: (data: Partial<Communication>) => Promise<Communication>;

  // Real-time update handler
  handleRealtimeUpdate: (update: { entity: string; action: string; data: any }) => void;
}

export const useCrmStore = create<CrmState>((set, get) => ({
  // Initial state
  leads: [],
  leadsLoading: false,
  leadsError: null,

  contacts: [],
  contactsLoading: false,
  contactsError: null,

  deals: [],
  dealsLoading: false,
  dealsError: null,

  communications: [],
  communicationsLoading: false,
  communicationsError: null,

  // Leads Actions
  fetchLeads: async () => {
    set({ leadsLoading: true, leadsError: null });
    try {
      const response = await api.get('/crm/leads');
      set({ leads: response.data.data || response.data, leadsLoading: false });
    } catch (error: any) {
      set({ leadsError: error.message, leadsLoading: false });
    }
  },

  createLead: async (data) => {
    const response = await api.post('/crm/leads', data);
    const lead = response.data.data || response.data;
    set({ leads: [...get().leads, lead] });
    return lead;
  },

  updateLead: async (id, data) => {
    const response = await api.put(`/crm/leads/${id}`, data);
    const lead = response.data.data || response.data;
    set({ leads: get().leads.map(l => l.id === id ? lead : l) });
    return lead;
  },

  deleteLead: async (id) => {
    await api.delete(`/crm/leads/${id}`);
    set({ leads: get().leads.filter(l => l.id !== id) });
  },

  // Contacts Actions
  fetchContacts: async () => {
    set({ contactsLoading: true, contactsError: null });
    try {
      const response = await api.get('/crm/contacts');
      set({ contacts: response.data.data || response.data, contactsLoading: false });
    } catch (error: any) {
      set({ contactsError: error.message, contactsLoading: false });
    }
  },

  createContact: async (data) => {
    const response = await api.post('/crm/contacts', data);
    const contact = response.data.data || response.data;
    set({ contacts: [...get().contacts, contact] });
    return contact;
  },

  updateContact: async (id, data) => {
    const response = await api.put(`/crm/contacts/${id}`, data);
    const contact = response.data.data || response.data;
    set({ contacts: get().contacts.map(c => c.id === id ? contact : c) });
    return contact;
  },

  deleteContact: async (id) => {
    await api.delete(`/crm/contacts/${id}`);
    set({ contacts: get().contacts.filter(c => c.id !== id) });
  },

  // Deals Actions
  fetchDeals: async () => {
    set({ dealsLoading: true, dealsError: null });
    try {
      const response = await api.get('/crm/deals');
      set({ deals: response.data.data || response.data, dealsLoading: false });
    } catch (error: any) {
      set({ dealsError: error.message, dealsLoading: false });
    }
  },

  createDeal: async (data) => {
    const response = await api.post('/crm/deals', data);
    const deal = response.data.data || response.data;
    set({ deals: [...get().deals, deal] });
    return deal;
  },

  updateDeal: async (id, data) => {
    const response = await api.put(`/crm/deals/${id}`, data);
    const deal = response.data.data || response.data;
    set({ deals: get().deals.map(d => d.id === id ? deal : d) });
    return deal;
  },

  deleteDeal: async (id) => {
    await api.delete(`/crm/deals/${id}`);
    set({ deals: get().deals.filter(d => d.id !== id) });
  },

  moveDealStage: async (id, stage) => {
    const response = await api.post(`/crm/deals/${id}/move-stage`, { stage });
    const deal = response.data.data || response.data;
    set({ deals: get().deals.map(d => d.id === id ? deal : d) });
    return deal;
  },

  // Communications Actions
  fetchCommunications: async (params) => {
    set({ communicationsLoading: true, communicationsError: null });
    try {
      const response = await api.get('/crm/communications', { params });
      set({ communications: response.data.data || response.data, communicationsLoading: false });
    } catch (error: any) {
      set({ communicationsError: error.message, communicationsLoading: false });
    }
  },

  createCommunication: async (data) => {
    const response = await api.post('/crm/communications', data);
    const comm = response.data.data || response.data;
    set({ communications: [comm, ...get().communications] });
    return comm;
  },

  // Real-time update handler
  handleRealtimeUpdate: (update) => {
    const { entity, action, data } = update;

    switch (entity) {
      case 'lead':
        if (action === 'created') {
          set({ leads: [...get().leads, data] });
        } else if (action === 'updated') {
          set({ leads: get().leads.map(l => l.id === data.id ? data : l) });
        } else if (action === 'deleted') {
          set({ leads: get().leads.filter(l => l.id !== data.id) });
        }
        break;

      case 'contact':
        if (action === 'created') {
          set({ contacts: [...get().contacts, data] });
        } else if (action === 'updated') {
          set({ contacts: get().contacts.map(c => c.id === data.id ? data : c) });
        } else if (action === 'deleted') {
          set({ contacts: get().contacts.filter(c => c.id !== data.id) });
        }
        break;

      case 'deal':
        if (action === 'created') {
          set({ deals: [...get().deals, data] });
        } else if (action === 'updated') {
          set({ deals: get().deals.map(d => d.id === data.id ? data : d) });
        } else if (action === 'deleted') {
          set({ deals: get().deals.filter(d => d.id !== data.id) });
        }
        break;

      case 'communication':
        if (action === 'created') {
          set({ communications: [data, ...get().communications] });
        }
        break;
    }
  },
}));
