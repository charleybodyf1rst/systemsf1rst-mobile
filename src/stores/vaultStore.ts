import { create } from 'zustand';
import { api } from '../lib/api';

// Types
export type VaultItemType = 'password' | 'secure_note' | 'credit_card' | 'bank_account' | 'document' | 'api_key' | 'ssh_key' | 'license';
export type VaultCategory = 'personal' | 'work' | 'finance' | 'social' | 'development' | 'other';

export interface VaultItem {
  id: string;
  name: string;
  type: VaultItemType;
  category: VaultCategory;
  favorite: boolean;
  // Password fields
  username?: string;
  password?: string;
  url?: string;
  // Secure note fields
  content?: string;
  // Credit card fields
  cardNumber?: string;
  cardHolder?: string;
  expiryDate?: string;
  cvv?: string;
  // Bank account fields
  bankName?: string;
  accountNumber?: string;
  routingNumber?: string;
  accountType?: string;
  // Document fields
  fileName?: string;
  fileUrl?: string;
  fileSize?: number;
  // API key fields
  apiKey?: string;
  apiSecret?: string;
  environment?: string;
  // SSH key fields
  publicKey?: string;
  privateKey?: string;
  passphrase?: string;
  // License fields
  licenseKey?: string;
  licensedTo?: string;
  expirationDate?: string;
  // Common fields
  notes?: string;
  tags?: string[];
  customFields?: CustomField[];
  lastAccessed?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomField {
  id: string;
  name: string;
  value: string;
  hidden: boolean;
}

export interface VaultFolder {
  id: string;
  name: string;
  parentId?: string;
  itemCount: number;
  color?: string;
}

export interface VaultMetrics {
  totalItems: number;
  passwordItems: number;
  secureNotes: number;
  weakPasswords: number;
  reusedPasswords: number;
  expiringSoon: number;
}

interface VaultState {
  // State
  items: VaultItem[];
  folders: VaultFolder[];
  selectedItem: VaultItem | null;
  selectedFolder: VaultFolder | null;
  searchQuery: string;
  filterCategory: VaultCategory | 'all';
  filterType: VaultItemType | 'all';
  metrics: VaultMetrics | null;
  isLocked: boolean;

  // Loading states
  itemsLoading: boolean;

  // Error states
  error: string | null;

  // Vault actions
  unlock: (masterPassword: string) => Promise<boolean>;
  lock: () => void;

  // Item actions
  fetchItems: (params?: { folderId?: string; category?: VaultCategory; type?: VaultItemType; search?: string }) => Promise<void>;
  fetchItem: (id: string) => Promise<VaultItem | null>;
  createItem: (data: Partial<VaultItem>) => Promise<VaultItem>;
  updateItem: (id: string, data: Partial<VaultItem>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;

  // Folder actions
  fetchFolders: () => Promise<void>;
  createFolder: (data: Partial<VaultFolder>) => Promise<VaultFolder>;
  updateFolder: (id: string, data: Partial<VaultFolder>) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;

  // Copy/reveal actions
  copyToClipboard: (itemId: string, field: string) => Promise<void>;
  recordAccess: (itemId: string) => void;

  // Metrics
  fetchMetrics: () => Promise<void>;

  // Filter/search actions
  setSearchQuery: (query: string) => void;
  setFilterCategory: (category: VaultCategory | 'all') => void;
  setFilterType: (type: VaultItemType | 'all') => void;

  // Utility actions
  setSelectedItem: (item: VaultItem | null) => void;
  setSelectedFolder: (folder: VaultFolder | null) => void;
  clearError: () => void;

  // Computed getters
  getFilteredItems: () => VaultItem[];
  getFavoriteItems: () => VaultItem[];
  getRecentItems: () => VaultItem[];
}

// Mock data
const mockItems: VaultItem[] = [
  {
    id: '1',
    name: 'Gmail Account',
    type: 'password',
    category: 'personal',
    favorite: true,
    username: 'user@gmail.com',
    password: '••••••••••••',
    url: 'https://mail.google.com',
    notes: 'Personal email account',
    tags: ['email', 'google'],
    lastAccessed: new Date(Date.now() - 3600000).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'GitHub',
    type: 'password',
    category: 'development',
    favorite: true,
    username: 'devuser',
    password: '••••••••••••',
    url: 'https://github.com',
    tags: ['development', 'git'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'AWS Production Keys',
    type: 'api_key',
    category: 'development',
    favorite: false,
    apiKey: 'AKIA••••••••••••',
    apiSecret: '••••••••••••••••••••',
    environment: 'production',
    notes: 'Main AWS account credentials',
    tags: ['aws', 'cloud', 'production'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '4',
    name: 'Bank of America',
    type: 'bank_account',
    category: 'finance',
    favorite: false,
    bankName: 'Bank of America',
    accountNumber: '••••••7890',
    routingNumber: '••••••1234',
    accountType: 'checking',
    notes: 'Primary checking account',
    tags: ['banking', 'primary'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '5',
    name: 'Visa Credit Card',
    type: 'credit_card',
    category: 'finance',
    favorite: false,
    cardNumber: '••••••••••••4242',
    cardHolder: 'John Doe',
    expiryDate: '12/25',
    cvv: '•••',
    notes: 'Primary credit card',
    tags: ['credit', 'visa'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '6',
    name: 'Server SSH Key',
    type: 'ssh_key',
    category: 'development',
    favorite: false,
    publicKey: 'ssh-rsa AAAA...',
    privateKey: '-----BEGIN RSA PRIVATE KEY-----\n...',
    passphrase: '••••••••',
    notes: 'Production server access',
    tags: ['ssh', 'server', 'production'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '7',
    name: 'Important Meeting Notes',
    type: 'secure_note',
    category: 'work',
    favorite: false,
    content: 'Confidential meeting notes from Q1 planning session...',
    tags: ['notes', 'meeting', 'confidential'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '8',
    name: 'Adobe Creative Cloud',
    type: 'license',
    category: 'work',
    favorite: false,
    licenseKey: 'XXXX-XXXX-XXXX-XXXX',
    licensedTo: 'Company Name',
    expirationDate: '2025-06-30',
    notes: 'Team license for design department',
    tags: ['adobe', 'license', 'design'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const mockFolders: VaultFolder[] = [
  { id: '1', name: 'Personal', itemCount: 5, color: '#3B82F6' },
  { id: '2', name: 'Work', itemCount: 12, color: '#10B981' },
  { id: '3', name: 'Finance', itemCount: 8, color: '#F59E0B' },
  { id: '4', name: 'Development', itemCount: 15, color: '#8B5CF6' },
];

export const useVaultStore = create<VaultState>((set, get) => ({
  // Initial state
  items: [],
  folders: [],
  selectedItem: null,
  selectedFolder: null,
  searchQuery: '',
  filterCategory: 'all',
  filterType: 'all',
  metrics: null,
  isLocked: true,
  itemsLoading: false,
  error: null,

  // Vault actions
  unlock: async (masterPassword) => {
    try {
      // TODO: Replace with real API call for vault unlock
      // const response = await api.post('/vault/unlock', { masterPassword });
      await new Promise(resolve => setTimeout(resolve, 500));

      // Simulate password verification
      if (masterPassword.length < 4) {
        throw new Error('Invalid master password');
      }

      set({ isLocked: false });
      await get().fetchItems();
      await get().fetchFolders();
      return true;
    } catch (error: any) {
      console.error('Failed to unlock vault:', error);
      set({ error: error.message || 'Failed to unlock vault' });
      return false;
    }
  },

  lock: () => {
    set({
      isLocked: true,
      items: [],
      selectedItem: null,
      searchQuery: '',
    });
  },

  // Item actions
  fetchItems: async (params) => {
    if (get().isLocked) return;

    set({ itemsLoading: true, error: null });
    try {
      // TODO: Replace with real API call
      // const response = await api.get('/vault/items', { params });
      await new Promise(resolve => setTimeout(resolve, 500));

      let filtered = [...mockItems];

      if (params?.category) {
        filtered = filtered.filter(i => i.category === params.category);
      }
      if (params?.type) {
        filtered = filtered.filter(i => i.type === params.type);
      }
      if (params?.search) {
        const search = params.search.toLowerCase();
        filtered = filtered.filter(i =>
          i.name.toLowerCase().includes(search) ||
          i.tags?.some(t => t.toLowerCase().includes(search))
        );
      }

      set({ items: filtered, itemsLoading: false });
    } catch (error: any) {
      console.error('Failed to fetch vault items:', error);
      set({ error: error.message || 'Failed to fetch items', itemsLoading: false });
    }
  },

  fetchItem: async (id) => {
    if (get().isLocked) return null;

    try {
      // TODO: Replace with real API call
      await new Promise(resolve => setTimeout(resolve, 300));

      const item = mockItems.find(i => i.id === id) || null;
      if (item) {
        set({ selectedItem: item });
        get().recordAccess(id);
      }
      return item;
    } catch (error: any) {
      console.error('Failed to fetch vault item:', error);
      set({ error: error.message || 'Failed to fetch item' });
      return null;
    }
  },

  createItem: async (data) => {
    try {
      // TODO: Replace with real API call
      await new Promise(resolve => setTimeout(resolve, 300));

      const newItem: VaultItem = {
        id: Date.now().toString(),
        name: data.name || 'New Item',
        type: data.type || 'password',
        category: data.category || 'personal',
        favorite: false,
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      set({ items: [...get().items, newItem] });
      return newItem;
    } catch (error: any) {
      console.error('Failed to create vault item:', error);
      throw error;
    }
  },

  updateItem: async (id, data) => {
    try {
      // TODO: Replace with real API call
      await new Promise(resolve => setTimeout(resolve, 300));

      set({
        items: get().items.map(i =>
          i.id === id ? { ...i, ...data, updatedAt: new Date().toISOString() } : i
        ),
        selectedItem: get().selectedItem?.id === id
          ? { ...get().selectedItem!, ...data, updatedAt: new Date().toISOString() }
          : get().selectedItem,
      });
    } catch (error: any) {
      console.error('Failed to update vault item:', error);
      throw error;
    }
  },

  deleteItem: async (id) => {
    try {
      // TODO: Replace with real API call
      await new Promise(resolve => setTimeout(resolve, 300));

      set({
        items: get().items.filter(i => i.id !== id),
        selectedItem: get().selectedItem?.id === id ? null : get().selectedItem,
      });
    } catch (error: any) {
      console.error('Failed to delete vault item:', error);
      throw error;
    }
  },

  toggleFavorite: async (id) => {
    try {
      // TODO: Replace with real API call
      await new Promise(resolve => setTimeout(resolve, 200));

      const item = get().items.find(i => i.id === id);
      if (item) {
        set({
          items: get().items.map(i =>
            i.id === id ? { ...i, favorite: !i.favorite } : i
          ),
        });
      }
    } catch (error: any) {
      console.error('Failed to toggle favorite:', error);
      throw error;
    }
  },

  // Folder actions
  fetchFolders: async () => {
    if (get().isLocked) return;

    try {
      // TODO: Replace with real API call
      await new Promise(resolve => setTimeout(resolve, 300));
      set({ folders: mockFolders });
    } catch (error: any) {
      console.error('Failed to fetch folders:', error);
      set({ error: error.message || 'Failed to fetch folders' });
    }
  },

  createFolder: async (data) => {
    try {
      // TODO: Replace with real API call
      await new Promise(resolve => setTimeout(resolve, 300));

      const newFolder: VaultFolder = {
        id: Date.now().toString(),
        name: data.name || 'New Folder',
        itemCount: 0,
        ...data,
      };

      set({ folders: [...get().folders, newFolder] });
      return newFolder;
    } catch (error: any) {
      console.error('Failed to create folder:', error);
      throw error;
    }
  },

  updateFolder: async (id, data) => {
    try {
      // TODO: Replace with real API call
      await new Promise(resolve => setTimeout(resolve, 300));

      set({
        folders: get().folders.map(f =>
          f.id === id ? { ...f, ...data } : f
        ),
      });
    } catch (error: any) {
      console.error('Failed to update folder:', error);
      throw error;
    }
  },

  deleteFolder: async (id) => {
    try {
      // TODO: Replace with real API call
      await new Promise(resolve => setTimeout(resolve, 300));

      set({
        folders: get().folders.filter(f => f.id !== id),
        selectedFolder: get().selectedFolder?.id === id ? null : get().selectedFolder,
      });
    } catch (error: any) {
      console.error('Failed to delete folder:', error);
      throw error;
    }
  },

  // Copy/reveal actions
  copyToClipboard: async (itemId, field) => {
    try {
      // In React Native, we'd use Clipboard.setString()
      // For now just log
      console.log(`Copied ${field} from item ${itemId} to clipboard`);
      get().recordAccess(itemId);
    } catch (error: any) {
      console.error('Failed to copy to clipboard:', error);
      throw error;
    }
  },

  recordAccess: (itemId) => {
    set({
      items: get().items.map(i =>
        i.id === itemId ? { ...i, lastAccessed: new Date().toISOString() } : i
      ),
    });
  },

  // Metrics
  fetchMetrics: async () => {
    if (get().isLocked) return;

    try {
      // TODO: Replace with real API call
      await new Promise(resolve => setTimeout(resolve, 300));

      const items = get().items;
      const metrics: VaultMetrics = {
        totalItems: items.length,
        passwordItems: items.filter(i => i.type === 'password').length,
        secureNotes: items.filter(i => i.type === 'secure_note').length,
        weakPasswords: 2, // Would be calculated on backend
        reusedPasswords: 1, // Would be calculated on backend
        expiringSoon: items.filter(i => {
          if (i.type === 'license' && i.expirationDate) {
            const expiry = new Date(i.expirationDate);
            const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            return expiry <= thirtyDaysFromNow;
          }
          return false;
        }).length,
      };

      set({ metrics });
    } catch (error: any) {
      console.error('Failed to fetch metrics:', error);
      set({ error: error.message || 'Failed to fetch metrics' });
    }
  },

  // Filter/search actions
  setSearchQuery: (query) => set({ searchQuery: query }),
  setFilterCategory: (category) => set({ filterCategory: category }),
  setFilterType: (type) => set({ filterType: type }),

  // Utility actions
  setSelectedItem: (item) => set({ selectedItem: item }),
  setSelectedFolder: (folder) => set({ selectedFolder: folder }),
  clearError: () => set({ error: null }),

  // Computed getters
  getFilteredItems: () => {
    const { items, searchQuery, filterCategory, filterType } = get();

    return items.filter(item => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesTags = item.tags?.some(t => t.toLowerCase().includes(query));
        const matchesUsername = item.username?.toLowerCase().includes(query);
        if (!matchesName && !matchesTags && !matchesUsername) {
          return false;
        }
      }

      // Category filter
      if (filterCategory !== 'all' && item.category !== filterCategory) {
        return false;
      }

      // Type filter
      if (filterType !== 'all' && item.type !== filterType) {
        return false;
      }

      return true;
    });
  },

  getFavoriteItems: () => {
    return get().items.filter(i => i.favorite);
  },

  getRecentItems: () => {
    return [...get().items]
      .filter(i => i.lastAccessed)
      .sort((a, b) => {
        const dateA = new Date(a.lastAccessed!).getTime();
        const dateB = new Date(b.lastAccessed!).getTime();
        return dateB - dateA;
      })
      .slice(0, 5);
  },
}));
