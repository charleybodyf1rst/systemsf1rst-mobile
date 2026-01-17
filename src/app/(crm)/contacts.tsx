// Contacts Management Screen
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, Alert, ActivityIndicator, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCrmStore, Contact } from '../../stores/crmStore';

export default function ContactsScreen() {
  const { contacts, contactsLoading, fetchContacts, createContact, updateContact, deleteContact } = useCrmStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    title: '',
    notes: '',
  });

  useEffect(() => {
    fetchContacts();
  }, []);

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (contact.company?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const openAddModal = () => {
    setEditingContact(null);
    setFormData({ name: '', email: '', phone: '', company: '', title: '', notes: '' });
    setModalVisible(true);
  };

  const openEditModal = (contact: Contact) => {
    setEditingContact(contact);
    setFormData({
      name: contact.name,
      email: contact.email,
      phone: contact.phone || '',
      company: contact.company || '',
      title: contact.title || '',
      notes: contact.notes || '',
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.email) {
      Alert.alert('Error', 'Name and email are required');
      return;
    }
    try {
      if (editingContact) {
        await updateContact(editingContact.id, formData);
      } else {
        await createContact(formData);
      }
      setModalVisible(false);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleDelete = (contact: Contact) => {
    Alert.alert(
      'Delete Contact',
      `Are you sure you want to delete ${contact.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteContact(contact.id) },
      ]
    );
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleEmail = (email: string) => {
    Linking.openURL(`mailto:${email}`);
  };

  const renderContact = ({ item }: { item: Contact }) => (
    <TouchableOpacity style={styles.contactCard} onPress={() => openEditModal(item)}>
      <View style={styles.contactAvatar}>
        <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{item.name}</Text>
        {item.title && <Text style={styles.contactTitle}>{item.title}</Text>}
        <Text style={styles.contactEmail}>{item.email}</Text>
        {item.company && <Text style={styles.contactCompany}>{item.company}</Text>}
      </View>
      <View style={styles.contactActions}>
        {item.phone && (
          <TouchableOpacity style={styles.actionBtn} onPress={() => handleCall(item.phone!)}>
            <Ionicons name="call" size={20} color="#10B981" />
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleEmail(item.email)}>
          <Ionicons name="mail" size={20} color="#3B82F6" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item)}>
          <Ionicons name="trash-outline" size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  // Group contacts by first letter
  const groupedContacts = filteredContacts.reduce((acc, contact) => {
    const letter = contact.name.charAt(0).toUpperCase();
    if (!acc[letter]) acc[letter] = [];
    acc[letter].push(contact);
    return acc;
  }, {} as Record<string, Contact[]>);

  const sections = Object.keys(groupedContacts).sort().map(letter => ({
    letter,
    data: groupedContacts[letter],
  }));

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Contacts</Text>
        <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#64748B" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search contacts..."
          placeholderTextColor="#64748B"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Ionicons name="people" size={20} color="#8B5CF6" />
          <Text style={styles.statValue}>{contacts.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="business" size={20} color="#10B981" />
          <Text style={styles.statValue}>
            {new Set(contacts.filter(c => c.company).map(c => c.company)).size}
          </Text>
          <Text style={styles.statLabel}>Companies</Text>
        </View>
      </View>

      {/* List */}
      {contactsLoading ? (
        <ActivityIndicator size="large" color="#8B5CF6" style={styles.loader} />
      ) : (
        <FlatList
          data={sections}
          keyExtractor={(item) => item.letter}
          renderItem={({ item: section }) => (
            <View>
              <Text style={styles.sectionHeader}>{section.letter}</Text>
              {section.data.map(contact => renderContact({ item: contact }))}
            </View>
          )}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No contacts found</Text>
          }
        />
      )}

      {/* Add/Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingContact ? 'Edit Contact' : 'Add Contact'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Name *"
              placeholderTextColor="#64748B"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Email *"
              placeholderTextColor="#64748B"
              keyboardType="email-address"
              autoCapitalize="none"
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Phone"
              placeholderTextColor="#64748B"
              keyboardType="phone-pad"
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Company"
              placeholderTextColor="#64748B"
              value={formData.company}
              onChangeText={(text) => setFormData({ ...formData, company: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Title"
              placeholderTextColor="#64748B"
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Notes"
              placeholderTextColor="#64748B"
              multiline
              numberOfLines={3}
              value={formData.notes}
              onChangeText={(text) => setFormData({ ...formData, notes: text })}
            />

            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>{editingContact ? 'Update' : 'Create'} Contact</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
  title: { fontSize: 28, fontWeight: '700', color: '#FFFFFF' },
  addButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E293B', borderRadius: 12, marginHorizontal: 20, paddingHorizontal: 16, marginBottom: 12 },
  searchInput: { flex: 1, height: 48, color: '#FFFFFF', marginLeft: 8, fontSize: 16 },
  statsRow: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 16 },
  statItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E293B', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, marginRight: 12 },
  statValue: { color: '#FFFFFF', fontSize: 18, fontWeight: '600', marginHorizontal: 8 },
  statLabel: { color: '#94A3B8', fontSize: 14 },
  loader: { flex: 1, justifyContent: 'center' },
  listContainer: { paddingHorizontal: 20, paddingBottom: 20 },
  sectionHeader: { fontSize: 14, fontWeight: '600', color: '#8B5CF6', marginTop: 16, marginBottom: 8 },
  contactCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E293B', borderRadius: 12, padding: 12, marginBottom: 8 },
  contactAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 20, fontWeight: '600', color: '#FFFFFF' },
  contactInfo: { flex: 1, marginLeft: 12 },
  contactName: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  contactTitle: { fontSize: 14, color: '#8B5CF6', marginTop: 2 },
  contactEmail: { fontSize: 14, color: '#94A3B8', marginTop: 2 },
  contactCompany: { fontSize: 12, color: '#64748B', marginTop: 2 },
  contactActions: { flexDirection: 'row', alignItems: 'center' },
  actionBtn: { padding: 8 },
  emptyText: { color: '#64748B', textAlign: 'center', paddingVertical: 40 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#1E293B', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '600', color: '#FFFFFF' },
  input: { backgroundColor: '#0F172A', borderRadius: 12, padding: 16, color: '#FFFFFF', fontSize: 16, marginBottom: 12 },
  textArea: { height: 100, textAlignVertical: 'top' },
  saveButton: { backgroundColor: '#10B981', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  saveButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
