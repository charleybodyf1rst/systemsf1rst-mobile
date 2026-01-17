// Leads Management Screen
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCrmStore, Lead } from '../../stores/crmStore';

export default function LeadsScreen() {
  const { leads, leadsLoading, fetchLeads, createLead, updateLead, deleteLead } = useCrmStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    status: 'new' as Lead['status'],
    notes: '',
  });

  useEffect(() => {
    fetchLeads();
  }, []);

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = !filterStatus || lead.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const openAddModal = () => {
    setEditingLead(null);
    setFormData({ name: '', email: '', phone: '', company: '', status: 'new', notes: '' });
    setModalVisible(true);
  };

  const openEditModal = (lead: Lead) => {
    setEditingLead(lead);
    setFormData({
      name: lead.name,
      email: lead.email,
      phone: lead.phone || '',
      company: lead.company || '',
      status: lead.status,
      notes: lead.notes || '',
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.email) {
      Alert.alert('Error', 'Name and email are required');
      return;
    }
    try {
      if (editingLead) {
        await updateLead(editingLead.id, formData);
      } else {
        await createLead(formData);
      }
      setModalVisible(false);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleDelete = (lead: Lead) => {
    Alert.alert(
      'Delete Lead',
      `Are you sure you want to delete ${lead.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteLead(lead.id) },
      ]
    );
  };

  const statuses = ['new', 'contacted', 'qualified', 'converted', 'lost'];

  const renderLead = ({ item }: { item: Lead }) => (
    <TouchableOpacity style={styles.leadCard} onPress={() => openEditModal(item)}>
      <View style={styles.leadAvatar}>
        <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.leadInfo}>
        <Text style={styles.leadName}>{item.name}</Text>
        <Text style={styles.leadEmail}>{item.email}</Text>
        {item.company && <Text style={styles.leadCompany}>{item.company}</Text>}
      </View>
      <View style={styles.leadActions}>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
        </View>
        <TouchableOpacity onPress={() => handleDelete(item)} style={styles.deleteBtn}>
          <Ionicons name="trash-outline" size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Leads</Text>
        <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#64748B" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search leads..."
          placeholderTextColor="#64748B"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filters */}
      <FlatList
        horizontal
        data={statuses}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersContainer}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.filterChip, filterStatus === item && styles.filterChipActive]}
            onPress={() => setFilterStatus(filterStatus === item ? null : item)}
          >
            <Text style={[styles.filterText, filterStatus === item && styles.filterTextActive]}>
              {item}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* List */}
      {leadsLoading ? (
        <ActivityIndicator size="large" color="#8B5CF6" style={styles.loader} />
      ) : (
        <FlatList
          data={filteredLeads}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderLead}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No leads found</Text>
          }
        />
      )}

      {/* Add/Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingLead ? 'Edit Lead' : 'Add Lead'}</Text>
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

            {/* Status Picker */}
            <Text style={styles.label}>Status</Text>
            <View style={styles.statusPicker}>
              {statuses.map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[styles.statusOption, formData.status === status && styles.statusOptionActive]}
                  onPress={() => setFormData({ ...formData, status: status as Lead['status'] })}
                >
                  <Text style={[styles.statusOptionText, formData.status === status && styles.statusOptionTextActive]}>
                    {status}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

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
              <Text style={styles.saveButtonText}>{editingLead ? 'Update' : 'Create'} Lead</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'new': return '#8B5CF6';
    case 'contacted': return '#3B82F6';
    case 'qualified': return '#10B981';
    case 'converted': return '#22C55E';
    case 'lost': return '#EF4444';
    default: return '#64748B';
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
  title: { fontSize: 28, fontWeight: '700', color: '#FFFFFF' },
  addButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#8B5CF6', alignItems: 'center', justifyContent: 'center' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E293B', borderRadius: 12, marginHorizontal: 20, paddingHorizontal: 16, marginBottom: 12 },
  searchInput: { flex: 1, height: 48, color: '#FFFFFF', marginLeft: 8, fontSize: 16 },
  filtersContainer: { paddingHorizontal: 20, paddingBottom: 12 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#1E293B', marginRight: 8 },
  filterChipActive: { backgroundColor: '#8B5CF6' },
  filterText: { color: '#94A3B8', fontSize: 14, fontWeight: '500', textTransform: 'capitalize' },
  filterTextActive: { color: '#FFFFFF' },
  loader: { flex: 1, justifyContent: 'center' },
  listContainer: { paddingHorizontal: 20, paddingBottom: 20 },
  leadCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E293B', borderRadius: 12, padding: 12, marginBottom: 8 },
  leadAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#8B5CF6', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 20, fontWeight: '600', color: '#FFFFFF' },
  leadInfo: { flex: 1, marginLeft: 12 },
  leadName: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  leadEmail: { fontSize: 14, color: '#94A3B8', marginTop: 2 },
  leadCompany: { fontSize: 12, color: '#64748B', marginTop: 2 },
  leadActions: { alignItems: 'flex-end' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, marginBottom: 8 },
  statusText: { fontSize: 12, fontWeight: '500', textTransform: 'capitalize' },
  deleteBtn: { padding: 4 },
  emptyText: { color: '#64748B', textAlign: 'center', paddingVertical: 40 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#1E293B', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '600', color: '#FFFFFF' },
  input: { backgroundColor: '#0F172A', borderRadius: 12, padding: 16, color: '#FFFFFF', fontSize: 16, marginBottom: 12 },
  textArea: { height: 100, textAlignVertical: 'top' },
  label: { color: '#94A3B8', fontSize: 14, marginBottom: 8 },
  statusPicker: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  statusOption: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: '#0F172A', marginRight: 8, marginBottom: 8 },
  statusOptionActive: { backgroundColor: '#8B5CF6' },
  statusOptionText: { color: '#94A3B8', fontSize: 14, textTransform: 'capitalize' },
  statusOptionTextActive: { color: '#FFFFFF' },
  saveButton: { backgroundColor: '#8B5CF6', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  saveButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
