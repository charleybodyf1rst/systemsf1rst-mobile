import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useVaultStore, VaultItem, VaultItemType, VaultCategory } from '../../stores';

const typeConfig: Record<VaultItemType, { icon: string; color: string; label: string }> = {
  password: { icon: 'key', color: '#3B82F6', label: 'Password' },
  secure_note: { icon: 'document-text', color: '#8B5CF6', label: 'Secure Note' },
  credit_card: { icon: 'card', color: '#F59E0B', label: 'Credit Card' },
  bank_account: { icon: 'business', color: '#10B981', label: 'Bank Account' },
  document: { icon: 'document', color: '#64748B', label: 'Document' },
  api_key: { icon: 'code', color: '#EF4444', label: 'API Key' },
  ssh_key: { icon: 'terminal', color: '#14B8A6', label: 'SSH Key' },
  license: { icon: 'ribbon', color: '#EC4899', label: 'License' },
};

const categoryConfig: Record<VaultCategory, { label: string; color: string }> = {
  personal: { label: 'Personal', color: '#3B82F6' },
  work: { label: 'Work', color: '#10B981' },
  finance: { label: 'Finance', color: '#F59E0B' },
  social: { label: 'Social', color: '#8B5CF6' },
  development: { label: 'Development', color: '#EF4444' },
  other: { label: 'Other', color: '#64748B' },
};

function VaultItemCard({
  item,
  onPress,
  onFavorite,
}: {
  item: VaultItem;
  onPress: () => void;
  onFavorite: () => void;
}) {
  const type = typeConfig[item.type];
  const category = categoryConfig[item.category];

  return (
    <TouchableOpacity style={styles.itemCard} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.itemIcon, { backgroundColor: `${type.color}20` }]}>
        <Ionicons name={type.icon as any} size={22} color={type.color} />
      </View>

      <View style={styles.itemContent}>
        <View style={styles.itemHeader}>
          <Text style={styles.itemName} numberOfLines={1}>
            {item.name}
          </Text>
          <TouchableOpacity onPress={onFavorite} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons
              name={item.favorite ? 'star' : 'star-outline'}
              size={18}
              color={item.favorite ? '#F59E0B' : '#64748B'}
            />
          </TouchableOpacity>
        </View>

        <Text style={styles.itemType}>{type.label}</Text>

        {item.username && (
          <Text style={styles.itemUsername} numberOfLines={1}>
            {item.username}
          </Text>
        )}

        <View style={styles.itemFooter}>
          <View style={[styles.categoryBadge, { backgroundColor: `${category.color}20` }]}>
            <Text style={[styles.categoryText, { color: category.color }]}>{category.label}</Text>
          </View>
          {item.lastAccessed && (
            <Text style={styles.lastAccessed}>
              {new Date(item.lastAccessed).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </Text>
          )}
        </View>
      </View>

      <Ionicons name="chevron-forward" size={20} color="#64748B" />
    </TouchableOpacity>
  );
}

function UnlockScreen({ onUnlock }: { onUnlock: (password: string) => void }) {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleUnlock = async () => {
    if (!password) {
      Alert.alert('Error', 'Please enter your master password');
      return;
    }

    setIsLoading(true);
    // Simulate unlock
    setTimeout(() => {
      onUnlock(password);
      setIsLoading(false);
    }, 500);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.unlockContainer}>
        <View style={styles.unlockIcon}>
          <Ionicons name="lock-closed" size={48} color="#8B5CF6" />
        </View>
        <Text style={styles.unlockTitle}>Vault Locked</Text>
        <Text style={styles.unlockSubtitle}>Enter your master password to unlock</Text>

        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Master Password"
            placeholderTextColor="#64748B"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            onSubmitEditing={handleUnlock}
          />
        </View>

        <TouchableOpacity
          style={[styles.unlockButton, isLoading && styles.unlockButtonDisabled]}
          onPress={handleUnlock}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="lock-open" size={20} color="#FFFFFF" />
              <Text style={styles.unlockButtonText}>Unlock Vault</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.forgotPassword}>
          <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

export default function VaultScreen() {
  const {
    isLocked,
    items,
    folders,
    metrics,
    itemsLoading,
    searchQuery,
    filterCategory,
    filterType,
    unlock,
    fetchItems,
    fetchFolders,
    fetchMetrics,
    toggleFavorite,
    setSearchQuery,
    setFilterCategory,
    setFilterType,
    getFilteredItems,
    getFavoriteItems,
  } = useVaultStore();

  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'favorites' | 'folders'>('all');

  useEffect(() => {
    if (!isLocked) {
      fetchItems();
      fetchFolders();
      fetchMetrics();
    }
  }, [isLocked]);

  const handleUnlock = async (password: string) => {
    const success = await unlock(password);
    if (!success) {
      Alert.alert('Error', 'Invalid master password');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchItems();
    setRefreshing(false);
  };

  if (isLocked) {
    return <UnlockScreen onUnlock={handleUnlock} />;
  }

  const filteredItems = getFilteredItems();
  const favoriteItems = getFavoriteItems();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Security Vault</Text>
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search vault..."
            placeholderTextColor="#64748B"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#64748B" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' && styles.tabActive]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>
            All Items
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'favorites' && styles.tabActive]}
          onPress={() => setActiveTab('favorites')}
        >
          <Ionicons
            name="star"
            size={14}
            color={activeTab === 'favorites' ? '#8B5CF6' : '#64748B'}
          />
          <Text style={[styles.tabText, activeTab === 'favorites' && styles.tabTextActive]}>
            Favorites
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'folders' && styles.tabActive]}
          onPress={() => setActiveTab('folders')}
        >
          <Ionicons
            name="folder"
            size={14}
            color={activeTab === 'folders' ? '#8B5CF6' : '#64748B'}
          />
          <Text style={[styles.tabText, activeTab === 'folders' && styles.tabTextActive]}>
            Folders
          </Text>
        </TouchableOpacity>
      </View>

      {/* Type Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        <TouchableOpacity
          style={[styles.filterChip, filterType === 'all' && styles.filterChipActive]}
          onPress={() => setFilterType('all')}
        >
          <Text
            style={[styles.filterChipText, filterType === 'all' && styles.filterChipTextActive]}
          >
            All
          </Text>
        </TouchableOpacity>
        {(Object.keys(typeConfig) as VaultItemType[]).map((type) => (
          <TouchableOpacity
            key={type}
            style={[styles.filterChip, filterType === type && styles.filterChipActive]}
            onPress={() => setFilterType(type)}
          >
            <Ionicons
              name={typeConfig[type].icon as any}
              size={14}
              color={filterType === type ? '#FFFFFF' : typeConfig[type].color}
            />
            <Text
              style={[styles.filterChipText, filterType === type && styles.filterChipTextActive]}
            >
              {typeConfig[type].label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Stats */}
      {metrics && (
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{metrics.totalItems}</Text>
            <Text style={styles.statLabel}>Items</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#3B82F6' }]}>{metrics.passwordItems}</Text>
            <Text style={styles.statLabel}>Passwords</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#EF4444' }]}>{metrics.weakPasswords}</Text>
            <Text style={styles.statLabel}>Weak</Text>
          </View>
        </View>
      )}

      {/* Content */}
      {itemsLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
        </View>
      ) : (
        <ScrollView
          style={styles.listContainer}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8B5CF6" />
          }
        >
          {activeTab === 'folders' ? (
            // Folders view
            <View style={styles.foldersGrid}>
              {folders.map((folder) => (
                <TouchableOpacity key={folder.id} style={styles.folderCard}>
                  <View
                    style={[styles.folderIcon, { backgroundColor: `${folder.color || '#8B5CF6'}20` }]}
                  >
                    <Ionicons name="folder" size={24} color={folder.color || '#8B5CF6'} />
                  </View>
                  <Text style={styles.folderName}>{folder.name}</Text>
                  <Text style={styles.folderCount}>{folder.itemCount} items</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={styles.addFolderCard}>
                <Ionicons name="add" size={24} color="#64748B" />
                <Text style={styles.addFolderText}>New Folder</Text>
              </TouchableOpacity>
            </View>
          ) : (
            // Items view
            <>
              {(activeTab === 'favorites' ? favoriteItems : filteredItems).length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="shield-outline" size={48} color="#64748B" />
                  <Text style={styles.emptyText}>
                    {activeTab === 'favorites' ? 'No favorite items' : 'No items found'}
                  </Text>
                </View>
              ) : (
                (activeTab === 'favorites' ? favoriteItems : filteredItems).map((item) => (
                  <VaultItemCard
                    key={item.id}
                    item={item}
                    onPress={() => router.push(`/(crm)/vault-item?id=${item.id}`)}
                    onFavorite={() => toggleFavorite(item.id)}
                  />
                ))
              )}
            </>
          )}
        </ScrollView>
      )}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  addButton: {
    padding: 8,
    backgroundColor: '#8B5CF6',
    borderRadius: 8,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#1E293B',
    borderRadius: 20,
    gap: 6,
  },
  tabActive: {
    backgroundColor: '#8B5CF620',
    borderWidth: 1,
    borderColor: '#8B5CF6',
  },
  tabText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#8B5CF6',
  },
  filterContainer: {
    maxHeight: 44,
  },
  filterContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#1E293B',
    borderRadius: 16,
    marginRight: 8,
    gap: 4,
  },
  filterChipActive: {
    backgroundColor: '#8B5CF6',
  },
  filterChipText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    gap: 12,
  },
  itemIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemContent: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemName: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  itemType: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 2,
  },
  itemUsername: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 4,
  },
  itemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '600',
  },
  lastAccessed: {
    color: '#64748B',
    fontSize: 11,
  },
  foldersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  folderCard: {
    width: '47%',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  folderIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  folderName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  folderCount: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 4,
  },
  addFolderCard: {
    width: '47%',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    borderStyle: 'dashed',
    minHeight: 120,
  },
  addFolderText: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 8,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: '#64748B',
    fontSize: 16,
    marginTop: 12,
  },
  // Unlock screen styles
  unlockContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  unlockIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#8B5CF620',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  unlockTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  unlockSubtitle: {
    color: '#64748B',
    fontSize: 14,
    textAlign: 'center',
  },
  passwordContainer: {
    width: '100%',
    marginTop: 32,
  },
  passwordInput: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#FFFFFF',
    fontSize: 16,
    width: '100%',
  },
  unlockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    paddingVertical: 14,
    width: '100%',
    marginTop: 16,
    gap: 8,
  },
  unlockButtonDisabled: {
    opacity: 0.7,
  },
  unlockButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  forgotPassword: {
    marginTop: 20,
  },
  forgotPasswordText: {
    color: '#8B5CF6',
    fontSize: 14,
  },
});
