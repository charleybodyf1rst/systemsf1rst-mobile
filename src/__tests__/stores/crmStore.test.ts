import { act } from '@testing-library/react-native';
import { useCrmStore } from '../../stores/crmStore';
import type { Lead, Contact, Deal, Communication } from '../../stores/crmStore';

// Mock the api module
jest.mock('../../lib/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

import api from '../../lib/api';

const mockLead: Lead = {
  id: 1,
  name: 'John Smith',
  email: 'john@example.com',
  phone: '(555) 123-4567',
  company: 'Acme Corp',
  status: 'new',
  source: 'website',
  notes: 'Interested in our services',
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-15T10:00:00Z',
};

const mockContact: Contact = {
  id: 1,
  name: 'Jane Doe',
  email: 'jane@example.com',
  phone: '(555) 987-6543',
  company: 'Tech Inc',
  title: 'CEO',
  notes: 'Key decision maker',
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-15T10:00:00Z',
};

const mockDeal: Deal = {
  id: 1,
  name: 'Enterprise Contract',
  value: 50000,
  stage: 'proposal',
  probability: 60,
  expected_close_date: '2024-03-15',
  contact_id: 1,
  notes: 'High priority deal',
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-15T10:00:00Z',
};

const mockCommunication: Communication = {
  id: 1,
  type: 'email',
  subject: 'Follow-up on proposal',
  body: 'Hi, just following up on our conversation...',
  contact_id: 1,
  deal_id: 1,
  created_at: '2024-01-15T10:00:00Z',
};

describe('CRM Store', () => {
  beforeEach(() => {
    // Reset the store state before each test
    useCrmStore.setState({
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
    });
    jest.clearAllMocks();
  });

  describe('Leads Operations', () => {
    it('should fetch leads successfully', async () => {
      (api.get as jest.Mock).mockResolvedValueOnce({ data: { data: [mockLead] } });

      const store = useCrmStore.getState();
      await act(async () => {
        await store.fetchLeads();
      });

      const updatedStore = useCrmStore.getState();
      expect(updatedStore.leads).toHaveLength(1);
      expect(updatedStore.leads[0].name).toBe('John Smith');
      expect(updatedStore.leadsLoading).toBe(false);
      expect(api.get).toHaveBeenCalledWith('/crm/leads');
    });

    it('should handle fetch leads error', async () => {
      (api.get as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const store = useCrmStore.getState();
      await act(async () => {
        await store.fetchLeads();
      });

      const updatedStore = useCrmStore.getState();
      expect(updatedStore.leadsError).toBe('Network error');
      expect(updatedStore.leadsLoading).toBe(false);
    });

    it('should create a lead', async () => {
      (api.post as jest.Mock).mockResolvedValueOnce({ data: { data: mockLead } });

      const store = useCrmStore.getState();
      let createdLead: Lead | undefined;

      await act(async () => {
        createdLead = await store.createLead({
          name: 'John Smith',
          email: 'john@example.com',
          status: 'new',
        });
      });

      expect(createdLead).toBeDefined();
      expect(createdLead?.name).toBe('John Smith');
      expect(useCrmStore.getState().leads).toHaveLength(1);
    });

    it('should update a lead', async () => {
      useCrmStore.setState({ leads: [mockLead] });
      const updatedLead = { ...mockLead, status: 'qualified' as const };
      (api.put as jest.Mock).mockResolvedValueOnce({ data: { data: updatedLead } });

      const store = useCrmStore.getState();
      await act(async () => {
        await store.updateLead(1, { status: 'qualified' });
      });

      const storeState = useCrmStore.getState();
      expect(storeState.leads[0].status).toBe('qualified');
    });

    it('should delete a lead', async () => {
      useCrmStore.setState({ leads: [mockLead] });
      (api.delete as jest.Mock).mockResolvedValueOnce({});

      const store = useCrmStore.getState();
      await act(async () => {
        await store.deleteLead(1);
      });

      expect(useCrmStore.getState().leads).toHaveLength(0);
    });

    it('should support all lead statuses', () => {
      const statuses: Lead['status'][] = ['new', 'contacted', 'qualified', 'converted', 'lost'];
      statuses.forEach((status) => {
        useCrmStore.setState({ leads: [{ ...mockLead, status }] });
        expect(useCrmStore.getState().leads[0].status).toBe(status);
      });
    });
  });

  describe('Contacts Operations', () => {
    it('should fetch contacts successfully', async () => {
      (api.get as jest.Mock).mockResolvedValueOnce({ data: { data: [mockContact] } });

      const store = useCrmStore.getState();
      await act(async () => {
        await store.fetchContacts();
      });

      const updatedStore = useCrmStore.getState();
      expect(updatedStore.contacts).toHaveLength(1);
      expect(updatedStore.contacts[0].name).toBe('Jane Doe');
      expect(updatedStore.contactsLoading).toBe(false);
    });

    it('should handle fetch contacts error', async () => {
      (api.get as jest.Mock).mockRejectedValueOnce(new Error('Server error'));

      const store = useCrmStore.getState();
      await act(async () => {
        await store.fetchContacts();
      });

      expect(useCrmStore.getState().contactsError).toBe('Server error');
    });

    it('should create a contact', async () => {
      (api.post as jest.Mock).mockResolvedValueOnce({ data: { data: mockContact } });

      const store = useCrmStore.getState();
      let createdContact: Contact | undefined;

      await act(async () => {
        createdContact = await store.createContact({
          name: 'Jane Doe',
          email: 'jane@example.com',
        });
      });

      expect(createdContact).toBeDefined();
      expect(createdContact?.name).toBe('Jane Doe');
    });

    it('should update a contact', async () => {
      useCrmStore.setState({ contacts: [mockContact] });
      const updatedContact = { ...mockContact, title: 'CTO' };
      (api.put as jest.Mock).mockResolvedValueOnce({ data: { data: updatedContact } });

      const store = useCrmStore.getState();
      await act(async () => {
        await store.updateContact(1, { title: 'CTO' });
      });

      expect(useCrmStore.getState().contacts[0].title).toBe('CTO');
    });

    it('should delete a contact', async () => {
      useCrmStore.setState({ contacts: [mockContact] });
      (api.delete as jest.Mock).mockResolvedValueOnce({});

      const store = useCrmStore.getState();
      await act(async () => {
        await store.deleteContact(1);
      });

      expect(useCrmStore.getState().contacts).toHaveLength(0);
    });
  });

  describe('Deals Operations', () => {
    it('should fetch deals successfully', async () => {
      (api.get as jest.Mock).mockResolvedValueOnce({ data: { data: [mockDeal] } });

      const store = useCrmStore.getState();
      await act(async () => {
        await store.fetchDeals();
      });

      const updatedStore = useCrmStore.getState();
      expect(updatedStore.deals).toHaveLength(1);
      expect(updatedStore.deals[0].name).toBe('Enterprise Contract');
      expect(updatedStore.dealsLoading).toBe(false);
    });

    it('should handle fetch deals error', async () => {
      (api.get as jest.Mock).mockRejectedValueOnce(new Error('Database error'));

      const store = useCrmStore.getState();
      await act(async () => {
        await store.fetchDeals();
      });

      expect(useCrmStore.getState().dealsError).toBe('Database error');
    });

    it('should create a deal', async () => {
      (api.post as jest.Mock).mockResolvedValueOnce({ data: { data: mockDeal } });

      const store = useCrmStore.getState();
      let createdDeal: Deal | undefined;

      await act(async () => {
        createdDeal = await store.createDeal({
          name: 'Enterprise Contract',
          value: 50000,
          stage: 'proposal',
        });
      });

      expect(createdDeal).toBeDefined();
      expect(createdDeal?.value).toBe(50000);
    });

    it('should update a deal', async () => {
      useCrmStore.setState({ deals: [mockDeal] });
      const updatedDeal = { ...mockDeal, value: 75000 };
      (api.put as jest.Mock).mockResolvedValueOnce({ data: { data: updatedDeal } });

      const store = useCrmStore.getState();
      await act(async () => {
        await store.updateDeal(1, { value: 75000 });
      });

      expect(useCrmStore.getState().deals[0].value).toBe(75000);
    });

    it('should delete a deal', async () => {
      useCrmStore.setState({ deals: [mockDeal] });
      (api.delete as jest.Mock).mockResolvedValueOnce({});

      const store = useCrmStore.getState();
      await act(async () => {
        await store.deleteDeal(1);
      });

      expect(useCrmStore.getState().deals).toHaveLength(0);
    });

    it('should move deal stage', async () => {
      useCrmStore.setState({ deals: [mockDeal] });
      const movedDeal = { ...mockDeal, stage: 'won' };
      (api.post as jest.Mock).mockResolvedValueOnce({ data: { data: movedDeal } });

      const store = useCrmStore.getState();
      await act(async () => {
        await store.moveDealStage(1, 'won');
      });

      expect(useCrmStore.getState().deals[0].stage).toBe('won');
      expect(api.post).toHaveBeenCalledWith('/crm/deals/1/move-stage', { stage: 'won' });
    });
  });

  describe('Communications Operations', () => {
    it('should fetch communications successfully', async () => {
      (api.get as jest.Mock).mockResolvedValueOnce({ data: { data: [mockCommunication] } });

      const store = useCrmStore.getState();
      await act(async () => {
        await store.fetchCommunications();
      });

      const updatedStore = useCrmStore.getState();
      expect(updatedStore.communications).toHaveLength(1);
      expect(updatedStore.communications[0].subject).toBe('Follow-up on proposal');
    });

    it('should fetch communications with filters', async () => {
      (api.get as jest.Mock).mockResolvedValueOnce({ data: { data: [mockCommunication] } });

      const store = useCrmStore.getState();
      await act(async () => {
        await store.fetchCommunications({ contact_id: 1 });
      });

      expect(api.get).toHaveBeenCalledWith('/crm/communications', { params: { contact_id: 1 } });
    });

    it('should handle fetch communications error', async () => {
      (api.get as jest.Mock).mockRejectedValueOnce(new Error('Timeout'));

      const store = useCrmStore.getState();
      await act(async () => {
        await store.fetchCommunications();
      });

      expect(useCrmStore.getState().communicationsError).toBe('Timeout');
    });

    it('should create a communication', async () => {
      (api.post as jest.Mock).mockResolvedValueOnce({ data: { data: mockCommunication } });

      const store = useCrmStore.getState();
      let createdComm: Communication | undefined;

      await act(async () => {
        createdComm = await store.createCommunication({
          type: 'email',
          subject: 'Follow-up on proposal',
          body: 'Hi, just following up...',
          contact_id: 1,
        });
      });

      expect(createdComm).toBeDefined();
      expect(createdComm?.type).toBe('email');
      // New communications are added at the beginning
      expect(useCrmStore.getState().communications[0].subject).toBe('Follow-up on proposal');
    });

    it('should support all communication types', () => {
      const types: Communication['type'][] = ['email', 'call', 'meeting', 'note'];
      types.forEach((type) => {
        useCrmStore.setState({ communications: [{ ...mockCommunication, type }] });
        expect(useCrmStore.getState().communications[0].type).toBe(type);
      });
    });
  });

  describe('Real-time Updates', () => {
    it('should handle lead created update', () => {
      const store = useCrmStore.getState();

      act(() => {
        store.handleRealtimeUpdate({
          entity: 'lead',
          action: 'created',
          data: mockLead,
        });
      });

      expect(useCrmStore.getState().leads).toHaveLength(1);
    });

    it('should handle lead updated', () => {
      useCrmStore.setState({ leads: [mockLead] });
      const updatedLead = { ...mockLead, status: 'qualified' as const };

      const store = useCrmStore.getState();
      act(() => {
        store.handleRealtimeUpdate({
          entity: 'lead',
          action: 'updated',
          data: updatedLead,
        });
      });

      expect(useCrmStore.getState().leads[0].status).toBe('qualified');
    });

    it('should handle lead deleted', () => {
      useCrmStore.setState({ leads: [mockLead] });

      const store = useCrmStore.getState();
      act(() => {
        store.handleRealtimeUpdate({
          entity: 'lead',
          action: 'deleted',
          data: { id: 1 },
        });
      });

      expect(useCrmStore.getState().leads).toHaveLength(0);
    });

    it('should handle contact created update', () => {
      const store = useCrmStore.getState();

      act(() => {
        store.handleRealtimeUpdate({
          entity: 'contact',
          action: 'created',
          data: mockContact,
        });
      });

      expect(useCrmStore.getState().contacts).toHaveLength(1);
    });

    it('should handle contact updated', () => {
      useCrmStore.setState({ contacts: [mockContact] });
      const updatedContact = { ...mockContact, title: 'President' };

      const store = useCrmStore.getState();
      act(() => {
        store.handleRealtimeUpdate({
          entity: 'contact',
          action: 'updated',
          data: updatedContact,
        });
      });

      expect(useCrmStore.getState().contacts[0].title).toBe('President');
    });

    it('should handle contact deleted', () => {
      useCrmStore.setState({ contacts: [mockContact] });

      const store = useCrmStore.getState();
      act(() => {
        store.handleRealtimeUpdate({
          entity: 'contact',
          action: 'deleted',
          data: { id: 1 },
        });
      });

      expect(useCrmStore.getState().contacts).toHaveLength(0);
    });

    it('should handle deal created update', () => {
      const store = useCrmStore.getState();

      act(() => {
        store.handleRealtimeUpdate({
          entity: 'deal',
          action: 'created',
          data: mockDeal,
        });
      });

      expect(useCrmStore.getState().deals).toHaveLength(1);
    });

    it('should handle deal updated', () => {
      useCrmStore.setState({ deals: [mockDeal] });
      const updatedDeal = { ...mockDeal, stage: 'negotiation' };

      const store = useCrmStore.getState();
      act(() => {
        store.handleRealtimeUpdate({
          entity: 'deal',
          action: 'updated',
          data: updatedDeal,
        });
      });

      expect(useCrmStore.getState().deals[0].stage).toBe('negotiation');
    });

    it('should handle deal deleted', () => {
      useCrmStore.setState({ deals: [mockDeal] });

      const store = useCrmStore.getState();
      act(() => {
        store.handleRealtimeUpdate({
          entity: 'deal',
          action: 'deleted',
          data: { id: 1 },
        });
      });

      expect(useCrmStore.getState().deals).toHaveLength(0);
    });

    it('should handle communication created update', () => {
      const store = useCrmStore.getState();

      act(() => {
        store.handleRealtimeUpdate({
          entity: 'communication',
          action: 'created',
          data: mockCommunication,
        });
      });

      expect(useCrmStore.getState().communications).toHaveLength(1);
    });
  });

  describe('API Response Handling', () => {
    it('should handle response.data.data format', async () => {
      (api.get as jest.Mock).mockResolvedValueOnce({ data: { data: [mockLead] } });

      const store = useCrmStore.getState();
      await act(async () => {
        await store.fetchLeads();
      });

      expect(useCrmStore.getState().leads).toHaveLength(1);
    });

    it('should handle response.data format (fallback)', async () => {
      (api.get as jest.Mock).mockResolvedValueOnce({ data: [mockLead] });

      const store = useCrmStore.getState();
      await act(async () => {
        await store.fetchLeads();
      });

      expect(useCrmStore.getState().leads).toHaveLength(1);
    });
  });
});
