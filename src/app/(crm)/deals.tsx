// Deals Pipeline Screen
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCrmStore, Deal, Contact } from '../../stores/crmStore';

const STAGES = [
  { id: 'lead', name: 'Lead', color: '#64748B' },
  { id: 'qualified', name: 'Qualified', color: '#8B5CF6' },
  { id: 'proposal', name: 'Proposal', color: '#3B82F6' },
  { id: 'negotiation', name: 'Negotiation', color: '#F59E0B' },
  { id: 'won', name: 'Won', color: '#22C55E' },
  { id: 'lost', name: 'Lost', color: '#EF4444' },
];

export default function DealsScreen() {
  const { deals, dealsLoading, contacts, fetchDeals, fetchContacts, createDeal, updateDeal, deleteDeal, moveDealStage } = useCrmStore();
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    value: '',
    stage: 'lead',
    probability: '50',
    expected_close_date: '',
    contact_id: '',
    notes: '',
  });

  useEffect(() => {
    fetchDeals();
    fetchContacts();
  }, []);

  const filteredDeals = selectedStage
    ? deals.filter(d => d.stage === selectedStage)
    : deals;

  // Calculate stage totals
  const stageTotals = STAGES.reduce((acc, stage) => {
    const stageDeals = deals.filter(d => d.stage === stage.id);
    acc[stage.id] = {
      count: stageDeals.length,
      value: stageDeals.reduce((sum, d) => sum + (d.value || 0), 0),
    };
    return acc;
  }, {} as Record<string, { count: number; value: number }>);

  const totalPipelineValue = deals
    .filter(d => d.stage !== 'lost')
    .reduce((sum, d) => sum + (d.value || 0), 0);

  const openAddModal = () => {
    setEditingDeal(null);
    setFormData({ name: '', value: '', stage: 'lead', probability: '50', expected_close_date: '', contact_id: '', notes: '' });
    setModalVisible(true);
  };

  const openEditModal = (deal: Deal) => {
    setEditingDeal(deal);
    setFormData({
      name: deal.name,
      value: deal.value?.toString() || '',
      stage: deal.stage,
      probability: deal.probability?.toString() || '50',
      expected_close_date: deal.expected_close_date || '',
      contact_id: deal.contact_id?.toString() || '',
      notes: deal.notes || '',
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.name) {
      Alert.alert('Error', 'Deal name is required');
      return;
    }
    try {
      const data = {
        ...formData,
        value: parseFloat(formData.value) || 0,
        probability: parseInt(formData.probability) || 50,
        contact_id: formData.contact_id ? parseInt(formData.contact_id) : null,
      };
      if (editingDeal) {
        await updateDeal(editingDeal.id, data);
      } else {
        await createDeal(data);
      }
      setModalVisible(false);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleDelete = (deal: Deal) => {
    Alert.alert(
      'Delete Deal',
      `Are you sure you want to delete "${deal.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteDeal(deal.id) },
      ]
    );
  };

  const handleMoveStage = (deal: Deal, newStage: string) => {
    Alert.alert(
      'Move Deal',
      `Move "${deal.name}" to ${newStage}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Move', onPress: () => moveDealStage(deal.id, newStage) },
      ]
    );
  };

  const getStageColor = (stageId: string) => STAGES.find(s => s.id === stageId)?.color || '#64748B';

  const renderDeal = ({ item }: { item: Deal }) => (
    <TouchableOpacity style={styles.dealCard} onPress={() => openEditModal(item)}>
      <View style={styles.dealHeader}>
        <View style={[styles.stageIndicator, { backgroundColor: getStageColor(item.stage) }]} />
        <Text style={styles.dealName} numberOfLines={1}>{item.name}</Text>
      </View>
      <Text style={styles.dealValue}>${(item.value || 0).toLocaleString()}</Text>
      {item.contact && (
        <Text style={styles.dealContact}>{item.contact.name}</Text>
      )}
      <View style={styles.dealFooter}>
        <View style={[styles.stageBadge, { backgroundColor: getStageColor(item.stage) + '20' }]}>
          <Text style={[styles.stageText, { color: getStageColor(item.stage) }]}>{item.stage}</Text>
        </View>
        <View style={styles.dealActions}>
          <TouchableOpacity onPress={() => handleDelete(item)}>
            <Ionicons name="trash-outline" size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Deals</Text>
        <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Pipeline Value */}
      <View style={styles.pipelineCard}>
        <Text style={styles.pipelineLabel}>Total Pipeline Value</Text>
        <Text style={styles.pipelineValue}>${totalPipelineValue.toLocaleString()}</Text>
      </View>

      {/* Stage Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stagesContainer}>
        <TouchableOpacity
          style={[styles.stageChip, !selectedStage && styles.stageChipActive]}
          onPress={() => setSelectedStage(null)}
        >
          <Text style={[styles.stageChipText, !selectedStage && styles.stageChipTextActive]}>
            All ({deals.length})
          </Text>
        </TouchableOpacity>
        {STAGES.map(stage => (
          <TouchableOpacity
            key={stage.id}
            style={[
              styles.stageChip,
              selectedStage === stage.id && styles.stageChipActive,
              { borderColor: stage.color }
            ]}
            onPress={() => setSelectedStage(selectedStage === stage.id ? null : stage.id)}
          >
            <View style={[styles.stageDot, { backgroundColor: stage.color }]} />
            <Text style={[styles.stageChipText, selectedStage === stage.id && styles.stageChipTextActive]}>
              {stage.name} ({stageTotals[stage.id]?.count || 0})
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Deals List */}
      {dealsLoading ? (
        <ActivityIndicator size="large" color="#8B5CF6" style={styles.loader} />
      ) : (
        <FlatList
          data={filteredDeals}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderDeal}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No deals found</Text>
          }
        />
      )}

      {/* Add/Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalScroll}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{editingDeal ? 'Edit Deal' : 'New Deal'}</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.input}
                placeholder="Deal Name *"
                placeholderTextColor="#64748B"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
              />

              <TextInput
                style={styles.input}
                placeholder="Value ($)"
                placeholderTextColor="#64748B"
                keyboardType="numeric"
                value={formData.value}
                onChangeText={(text) => setFormData({ ...formData, value: text })}
              />

              {/* Stage Picker */}
              <Text style={styles.label}>Stage</Text>
              <View style={styles.stagePicker}>
                {STAGES.map(stage => (
                  <TouchableOpacity
                    key={stage.id}
                    style={[
                      styles.stageOption,
                      formData.stage === stage.id && { backgroundColor: stage.color }
                    ]}
                    onPress={() => setFormData({ ...formData, stage: stage.id })}
                  >
                    <Text style={[
                      styles.stageOptionText,
                      formData.stage === stage.id && { color: '#FFFFFF' }
                    ]}>
                      {stage.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                style={styles.input}
                placeholder="Probability (%)"
                placeholderTextColor="#64748B"
                keyboardType="numeric"
                value={formData.probability}
                onChangeText={(text) => setFormData({ ...formData, probability: text })}
              />

              {/* Contact Picker */}
              <Text style={styles.label}>Associated Contact</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.contactPicker}>
                <TouchableOpacity
                  style={[styles.contactOption, !formData.contact_id && styles.contactOptionActive]}
                  onPress={() => setFormData({ ...formData, contact_id: '' })}
                >
                  <Text style={styles.contactOptionText}>None</Text>
                </TouchableOpacity>
                {contacts.map(contact => (
                  <TouchableOpacity
                    key={contact.id}
                    style={[
                      styles.contactOption,
                      formData.contact_id === contact.id.toString() && styles.contactOptionActive
                    ]}
                    onPress={() => setFormData({ ...formData, contact_id: contact.id.toString() })}
                  >
                    <Text style={styles.contactOptionText}>{contact.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

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
                <Text style={styles.saveButtonText}>{editingDeal ? 'Update' : 'Create'} Deal</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
  title: { fontSize: 28, fontWeight: '700', color: '#FFFFFF' },
  addButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#3B82F6', alignItems: 'center', justifyContent: 'center' },
  pipelineCard: { backgroundColor: '#1E293B', borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
  pipelineLabel: { color: '#94A3B8', fontSize: 14 },
  pipelineValue: { color: '#FFFFFF', fontSize: 32, fontWeight: '700', marginTop: 8 },
  stagesContainer: { paddingHorizontal: 20, paddingBottom: 12 },
  stageChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#1E293B', marginRight: 8, borderWidth: 1, borderColor: 'transparent' },
  stageChipActive: { backgroundColor: '#8B5CF6' },
  stageDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  stageChipText: { color: '#94A3B8', fontSize: 14, fontWeight: '500' },
  stageChipTextActive: { color: '#FFFFFF' },
  loader: { flex: 1, justifyContent: 'center' },
  listContainer: { paddingHorizontal: 15, paddingBottom: 20 },
  row: { justifyContent: 'space-between' },
  dealCard: { width: '48%', backgroundColor: '#1E293B', borderRadius: 12, padding: 14, marginBottom: 10, marginHorizontal: '1%' },
  dealHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  stageIndicator: { width: 4, height: 20, borderRadius: 2, marginRight: 8 },
  dealName: { flex: 1, fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
  dealValue: { fontSize: 22, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 },
  dealContact: { fontSize: 13, color: '#94A3B8', marginBottom: 8 },
  dealFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stageBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  stageText: { fontSize: 11, fontWeight: '500', textTransform: 'capitalize' },
  dealActions: { flexDirection: 'row' },
  emptyText: { color: '#64748B', textAlign: 'center', paddingVertical: 40, width: '100%' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)' },
  modalScroll: { flex: 1, marginTop: 60 },
  modalContent: { backgroundColor: '#1E293B', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, minHeight: 500 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '600', color: '#FFFFFF' },
  input: { backgroundColor: '#0F172A', borderRadius: 12, padding: 16, color: '#FFFFFF', fontSize: 16, marginBottom: 12 },
  textArea: { height: 100, textAlignVertical: 'top' },
  label: { color: '#94A3B8', fontSize: 14, marginBottom: 8, marginTop: 4 },
  stagePicker: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  stageOption: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: '#0F172A', marginRight: 8, marginBottom: 8 },
  stageOptionText: { color: '#94A3B8', fontSize: 13 },
  contactPicker: { marginBottom: 12 },
  contactOption: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#0F172A', marginRight: 8 },
  contactOptionActive: { backgroundColor: '#8B5CF6' },
  contactOptionText: { color: '#FFFFFF', fontSize: 14 },
  saveButton: { backgroundColor: '#3B82F6', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  saveButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
