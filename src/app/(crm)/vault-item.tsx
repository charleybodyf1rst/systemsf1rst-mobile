import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useVaultStore, VaultItemType } from '../../stores';

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

function SecureField({
  label,
  value,
  icon,
  hidden = false,
  copyable = true,
}: {
  label: string;
  value: string;
  icon: string;
  hidden?: boolean;
  copyable?: boolean;
}) {
  const [isVisible, setIsVisible] = useState(!hidden);

  const handleCopy = async () => {
    // TODO: Implement clipboard functionality when expo-clipboard is installed
    // await Clipboard.setStringAsync(value);
    Alert.alert('Copied', `${label} copied to clipboard`);
  };

  return (
    <View style={styles.fieldContainer}>
      <View style={styles.fieldHeader}>
        <View style={styles.fieldLabelContainer}>
          <Ionicons name={icon as any} size={16} color="#64748B" />
          <Text style={styles.fieldLabel}>{label}</Text>
        </View>
        <View style={styles.fieldActions}>
          {hidden && (
            <TouchableOpacity onPress={() => setIsVisible(!isVisible)} style={styles.fieldAction}>
              <Ionicons
                name={isVisible ? 'eye-off' : 'eye'}
                size={18}
                color="#64748B"
              />
            </TouchableOpacity>
          )}
          {copyable && (
            <TouchableOpacity onPress={handleCopy} style={styles.fieldAction}>
              <Ionicons name="copy" size={18} color="#64748B" />
            </TouchableOpacity>
          )}
        </View>
      </View>
      <Text style={styles.fieldValue}>
        {hidden && !isVisible ? '••••••••••••' : value}
      </Text>
    </View>
  );
}

export default function VaultItemScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { selectedItem, fetchItem, toggleFavorite, setSelectedItem, deleteItem } = useVaultStore();

  useEffect(() => {
    if (id) {
      fetchItem(id);
    }
    return () => setSelectedItem(null);
  }, [id]);

  const item = selectedItem;

  if (!item) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
        </View>
      </SafeAreaView>
    );
  }

  const type = typeConfig[item.type];

  const handleDelete = () => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this item? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteItem(item.id);
            router.back();
          },
        },
      ]
    );
  };

  const renderTypeSpecificFields = () => {
    switch (item.type) {
      case 'password':
        return (
          <>
            {item.username && (
              <SecureField
                label="Username"
                value={item.username}
                icon="person"
              />
            )}
            {item.password && (
              <SecureField
                label="Password"
                value={item.password}
                icon="key"
                hidden
              />
            )}
            {item.url && (
              <SecureField
                label="Website"
                value={item.url}
                icon="globe"
              />
            )}
          </>
        );

      case 'credit_card':
        return (
          <>
            {item.cardNumber && (
              <SecureField
                label="Card Number"
                value={item.cardNumber}
                icon="card"
                hidden
              />
            )}
            {item.cardHolder && (
              <SecureField
                label="Card Holder"
                value={item.cardHolder}
                icon="person"
              />
            )}
            {item.expiryDate && (
              <SecureField
                label="Expiry Date"
                value={item.expiryDate}
                icon="calendar"
              />
            )}
            {item.cvv && (
              <SecureField
                label="CVV"
                value={item.cvv}
                icon="lock-closed"
                hidden
              />
            )}
          </>
        );

      case 'bank_account':
        return (
          <>
            {item.bankName && (
              <SecureField
                label="Bank Name"
                value={item.bankName}
                icon="business"
              />
            )}
            {item.accountNumber && (
              <SecureField
                label="Account Number"
                value={item.accountNumber}
                icon="document-text"
                hidden
              />
            )}
            {item.routingNumber && (
              <SecureField
                label="Routing Number"
                value={item.routingNumber}
                icon="git-branch"
                hidden
              />
            )}
            {item.accountType && (
              <SecureField
                label="Account Type"
                value={item.accountType}
                icon="wallet"
              />
            )}
          </>
        );

      case 'api_key':
        return (
          <>
            {item.apiKey && (
              <SecureField
                label="API Key"
                value={item.apiKey}
                icon="key"
                hidden
              />
            )}
            {item.apiSecret && (
              <SecureField
                label="API Secret"
                value={item.apiSecret}
                icon="lock-closed"
                hidden
              />
            )}
            {item.environment && (
              <SecureField
                label="Environment"
                value={item.environment}
                icon="server"
              />
            )}
          </>
        );

      case 'ssh_key':
        return (
          <>
            {item.publicKey && (
              <SecureField
                label="Public Key"
                value={item.publicKey}
                icon="key"
              />
            )}
            {item.privateKey && (
              <SecureField
                label="Private Key"
                value="[Private Key]"
                icon="lock-closed"
                hidden
              />
            )}
            {item.passphrase && (
              <SecureField
                label="Passphrase"
                value={item.passphrase}
                icon="shield"
                hidden
              />
            )}
          </>
        );

      case 'license':
        return (
          <>
            {item.licenseKey && (
              <SecureField
                label="License Key"
                value={item.licenseKey}
                icon="ribbon"
              />
            )}
            {item.licensedTo && (
              <SecureField
                label="Licensed To"
                value={item.licensedTo}
                icon="person"
              />
            )}
            {item.expirationDate && (
              <SecureField
                label="Expiration Date"
                value={new Date(item.expirationDate).toLocaleDateString()}
                icon="calendar"
              />
            )}
          </>
        );

      case 'secure_note':
        return item.content ? (
          <View style={styles.noteContainer}>
            <Text style={styles.noteContent}>{item.content}</Text>
          </View>
        ) : null;

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Item Details</Text>
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-horizontal" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Item Header Card */}
        <View style={styles.itemCard}>
          <View style={[styles.itemIcon, { backgroundColor: `${type.color}20` }]}>
            <Ionicons name={type.icon as any} size={32} color={type.color} />
          </View>

          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemType}>{type.label}</Text>

          {/* Actions */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, item.favorite && styles.actionButtonActive]}
              onPress={() => toggleFavorite(item.id)}
            >
              <Ionicons
                name={item.favorite ? 'star' : 'star-outline'}
                size={20}
                color={item.favorite ? '#F59E0B' : '#64748B'}
              />
              <Text
                style={[styles.actionButtonText, item.favorite && { color: '#F59E0B' }]}
              >
                Favorite
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="create" size={20} color="#64748B" />
              <Text style={styles.actionButtonText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleDelete}>
              <Ionicons name="trash" size={20} color="#EF4444" />
              <Text style={[styles.actionButtonText, { color: '#EF4444' }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Type-specific Fields */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          <View style={styles.fieldsContainer}>
            {renderTypeSpecificFields()}
          </View>
        </View>

        {/* Tags */}
        {item.tags && item.tags.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tags</Text>
            <View style={styles.tagsContainer}>
              {item.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Notes */}
        {item.notes && item.type !== 'secure_note' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <View style={styles.notesContainer}>
              <Text style={styles.notesText}>{item.notes}</Text>
            </View>
          </View>
        )}

        {/* Custom Fields */}
        {item.customFields && item.customFields.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Custom Fields</Text>
            <View style={styles.fieldsContainer}>
              {item.customFields.map((field) => (
                <SecureField
                  key={field.id}
                  label={field.name}
                  value={field.value}
                  icon="create"
                  hidden={field.hidden}
                />
              ))}
            </View>
          </View>
        )}

        {/* Metadata */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Metadata</Text>
          <View style={styles.metadataContainer}>
            <View style={styles.metadataRow}>
              <Text style={styles.metadataLabel}>Created</Text>
              <Text style={styles.metadataValue}>
                {new Date(item.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
            </View>
            <View style={styles.metadataRow}>
              <Text style={styles.metadataLabel}>Last Modified</Text>
              <Text style={styles.metadataValue}>
                {new Date(item.updatedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
            </View>
            {item.lastAccessed && (
              <View style={styles.metadataRow}>
                <Text style={styles.metadataLabel}>Last Accessed</Text>
                <Text style={styles.metadataValue}>
                  {new Date(item.lastAccessed).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  moreButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  itemCard: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    backgroundColor: '#1E293B',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 16,
  },
  itemIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 16,
    textAlign: 'center',
  },
  itemType: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 20,
  },
  actionButton: {
    alignItems: 'center',
    gap: 4,
  },
  actionButtonActive: {
    opacity: 1,
  },
  actionButtonText: {
    color: '#64748B',
    fontSize: 12,
  },
  section: {
    marginTop: 24,
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  fieldsContainer: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    overflow: 'hidden',
  },
  fieldContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#0F172A',
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fieldLabel: {
    color: '#64748B',
    fontSize: 13,
  },
  fieldActions: {
    flexDirection: 'row',
    gap: 12,
  },
  fieldAction: {
    padding: 4,
  },
  fieldValue: {
    color: '#FFFFFF',
    fontSize: 15,
    marginTop: 8,
    fontFamily: 'monospace',
  },
  noteContainer: {
    padding: 16,
  },
  noteContent: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 22,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 12,
  },
  tag: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    color: '#94A3B8',
    fontSize: 13,
  },
  notesContainer: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
  },
  notesText: {
    color: '#94A3B8',
    fontSize: 14,
    lineHeight: 22,
  },
  metadataContainer: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 4,
  },
  metadataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
  },
  metadataLabel: {
    color: '#64748B',
    fontSize: 13,
  },
  metadataValue: {
    color: '#94A3B8',
    fontSize: 13,
  },
});
