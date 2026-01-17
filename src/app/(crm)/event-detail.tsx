// Event Detail Screen - View, create, and edit calendar events
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useCalendarStore, CalendarEvent, CreateEventParams } from '../../stores/calendarStore';
import { useCrmStore } from '../../stores/crmStore';

const REMINDER_OPTIONS = [
  { label: 'None', value: 0 },
  { label: '5 minutes', value: 5 },
  { label: '15 minutes', value: 15 },
  { label: '30 minutes', value: 30 },
  { label: '1 hour', value: 60 },
  { label: '1 day', value: 1440 },
];

const EVENT_COLORS = [
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Green', value: '#22C55E' },
  { name: 'Orange', value: '#F59E0B' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Pink', value: '#EC4899' },
];

export default function EventDetailScreen() {
  const router = useRouter();
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const isNewEvent = eventId === 'new';

  const { events, selectedDate, createEvent, updateEvent, deleteEvent, setSelectedEvent } = useCalendarStore();
  const { contacts, deals, fetchContacts, fetchDeals } = useCrmStore();

  const [loading, setLoading] = useState(!isNewEvent);
  const [saving, setSaving] = useState(false);
  const [event, setEvent] = useState<CalendarEvent | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [allDay, setAllDay] = useState(false);
  const [startDate, setStartDate] = useState(selectedDate);
  const [startTime, setStartTime] = useState('09:00');
  const [endDate, setEndDate] = useState(selectedDate);
  const [endTime, setEndTime] = useState('10:00');
  const [reminder, setReminder] = useState(15);
  const [color, setColor] = useState('#8B5CF6');
  const [selectedContactId, setSelectedContactId] = useState<number | null>(null);
  const [selectedDealId, setSelectedDealId] = useState<number | null>(null);

  const [showContactPicker, setShowContactPicker] = useState(false);
  const [showDealPicker, setShowDealPicker] = useState(false);
  const [showReminderPicker, setShowReminderPicker] = useState(false);

  useEffect(() => {
    if (!isNewEvent && eventId) {
      loadEvent();
    } else {
      setLoading(false);
    }
    fetchContacts();
    fetchDeals();
  }, [eventId]);

  const loadEvent = () => {
    const foundEvent = events.find(e => e.id === eventId);
    if (foundEvent) {
      setEvent(foundEvent);
      setTitle(foundEvent.title);
      setDescription(foundEvent.description || '');
      setLocation(foundEvent.location || '');
      setAllDay(foundEvent.all_day);
      setColor(foundEvent.color || '#8B5CF6');
      setSelectedContactId(foundEvent.contact_id || null);
      setSelectedDealId(foundEvent.deal_id || null);
      setReminder(foundEvent.reminder_minutes || 0);

      const start = new Date(foundEvent.start_time);
      const end = new Date(foundEvent.end_time);
      setStartDate(start);
      setEndDate(end);
      setStartTime(start.toTimeString().slice(0, 5));
      setEndTime(end.toTimeString().slice(0, 5));
    }
    setLoading(false);
  };

  const formatDateString = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title for the event');
      return;
    }

    setSaving(true);
    try {
      const startDateTime = new Date(startDate);
      const [startH, startM] = startTime.split(':').map(Number);
      startDateTime.setHours(startH, startM, 0, 0);

      const endDateTime = new Date(endDate);
      const [endH, endM] = endTime.split(':').map(Number);
      endDateTime.setHours(endH, endM, 0, 0);

      const params: CreateEventParams = {
        title: title.trim(),
        description: description.trim() || undefined,
        location: location.trim() || undefined,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        all_day: allDay,
        reminder_minutes: reminder,
        color,
        contact_id: selectedContactId || undefined,
        deal_id: selectedDealId || undefined,
      };

      if (isNewEvent) {
        await createEvent(params);
      } else if (eventId) {
        await updateEvent(eventId, params);
      }

      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save event');
    }
    setSaving(false);
  };

  const handleDelete = () => {
    if (!event) return;

    Alert.alert(
      'Delete Event',
      `Are you sure you want to delete "${event.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteEvent(event.id);
              router.back();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete event');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#8B5CF6" style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  const selectedContact = contacts.find(c => c.id === selectedContactId);
  const selectedDeal = deals.find(d => d.id === selectedDealId);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="close" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isNewEvent ? 'New Event' : 'Edit Event'}</Text>
        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.saveBtnText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Title */}
        <View style={styles.inputGroup}>
          <TextInput
            style={styles.titleInput}
            placeholder="Event title"
            placeholderTextColor="#64748B"
            value={title}
            onChangeText={setTitle}
          />
        </View>

        {/* All Day Toggle */}
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>All day</Text>
          <Switch
            value={allDay}
            onValueChange={setAllDay}
            trackColor={{ false: '#334155', true: '#8B5CF680' }}
            thumbColor={allDay ? '#8B5CF6' : '#64748B'}
          />
        </View>

        {/* Date/Time */}
        <View style={styles.section}>
          <View style={styles.dateTimeRow}>
            <View style={styles.dateTimeItem}>
              <Text style={styles.dateTimeLabel}>Starts</Text>
              <Text style={styles.dateTimeValue}>{formatDateString(startDate)}</Text>
              {!allDay && <Text style={styles.timeValue}>{startTime}</Text>}
            </View>
            <Ionicons name="arrow-forward" size={20} color="#64748B" />
            <View style={styles.dateTimeItem}>
              <Text style={styles.dateTimeLabel}>Ends</Text>
              <Text style={styles.dateTimeValue}>{formatDateString(endDate)}</Text>
              {!allDay && <Text style={styles.timeValue}>{endTime}</Text>}
            </View>
          </View>
        </View>

        {/* Location */}
        <View style={styles.inputGroup}>
          <View style={styles.inputRow}>
            <Ionicons name="location-outline" size={20} color="#64748B" />
            <TextInput
              style={styles.inputField}
              placeholder="Add location"
              placeholderTextColor="#64748B"
              value={location}
              onChangeText={setLocation}
            />
          </View>
        </View>

        {/* Description */}
        <View style={styles.inputGroup}>
          <View style={styles.inputRow}>
            <Ionicons name="document-text-outline" size={20} color="#64748B" />
            <TextInput
              style={[styles.inputField, styles.descriptionInput]}
              placeholder="Add description"
              placeholderTextColor="#64748B"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {/* Reminder */}
        <TouchableOpacity
          style={styles.inputGroup}
          onPress={() => setShowReminderPicker(!showReminderPicker)}
        >
          <View style={styles.inputRow}>
            <Ionicons name="notifications-outline" size={20} color="#64748B" />
            <Text style={styles.inputValue}>
              {REMINDER_OPTIONS.find(r => r.value === reminder)?.label || 'No reminder'}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#64748B" />
          </View>
        </TouchableOpacity>
        {showReminderPicker && (
          <View style={styles.pickerContainer}>
            {REMINDER_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[styles.pickerOption, reminder === option.value && styles.pickerOptionSelected]}
                onPress={() => {
                  setReminder(option.value);
                  setShowReminderPicker(false);
                }}
              >
                <Text style={[styles.pickerOptionText, reminder === option.value && styles.pickerOptionTextSelected]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Color */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Event Color</Text>
          <View style={styles.colorOptions}>
            {EVENT_COLORS.map((c) => (
              <TouchableOpacity
                key={c.value}
                style={[styles.colorOption, { backgroundColor: c.value }, color === c.value && styles.colorOptionSelected]}
                onPress={() => setColor(c.value)}
              >
                {color === c.value && <Ionicons name="checkmark" size={18} color="#FFFFFF" />}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* CRM Links */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Link to CRM</Text>

          {/* Contact Link */}
          <TouchableOpacity
            style={styles.linkOption}
            onPress={() => setShowContactPicker(!showContactPicker)}
          >
            <Ionicons name="person-outline" size={20} color="#8B5CF6" />
            <Text style={styles.linkOptionText}>
              {selectedContact ? selectedContact.name : 'Link to contact'}
            </Text>
            {selectedContact && (
              <TouchableOpacity onPress={() => setSelectedContactId(null)}>
                <Ionicons name="close-circle" size={20} color="#64748B" />
              </TouchableOpacity>
            )}
            <Ionicons name="chevron-forward" size={20} color="#64748B" />
          </TouchableOpacity>
          {showContactPicker && (
            <View style={styles.pickerContainer}>
              {contacts.slice(0, 10).map((contact) => (
                <TouchableOpacity
                  key={contact.id}
                  style={styles.pickerOption}
                  onPress={() => {
                    setSelectedContactId(contact.id);
                    setShowContactPicker(false);
                  }}
                >
                  <Text style={styles.pickerOptionText}>{contact.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Deal Link */}
          <TouchableOpacity
            style={styles.linkOption}
            onPress={() => setShowDealPicker(!showDealPicker)}
          >
            <Ionicons name="briefcase-outline" size={20} color="#22C55E" />
            <Text style={styles.linkOptionText}>
              {selectedDeal ? selectedDeal.name : 'Link to deal'}
            </Text>
            {selectedDeal && (
              <TouchableOpacity onPress={() => setSelectedDealId(null)}>
                <Ionicons name="close-circle" size={20} color="#64748B" />
              </TouchableOpacity>
            )}
            <Ionicons name="chevron-forward" size={20} color="#64748B" />
          </TouchableOpacity>
          {showDealPicker && (
            <View style={styles.pickerContainer}>
              {deals.slice(0, 10).map((deal) => (
                <TouchableOpacity
                  key={deal.id}
                  style={styles.pickerOption}
                  onPress={() => {
                    setSelectedDealId(deal.id);
                    setShowDealPicker(false);
                  }}
                >
                  <Text style={styles.pickerOptionText}>{deal.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Delete Button */}
        {!isNewEvent && event && (
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
            <Text style={styles.deleteBtnText}>Delete Event</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#FFFFFF' },
  saveBtn: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: { color: '#FFFFFF', fontWeight: '600' },

  content: { flex: 1, padding: 16 },

  inputGroup: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
  },
  titleInput: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputField: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#FFFFFF',
  },
  descriptionInput: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  inputValue: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#FFFFFF',
  },

  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
  },
  toggleLabel: { fontSize: 16, color: '#FFFFFF' },

  section: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#94A3B8', marginBottom: 12 },

  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateTimeItem: { alignItems: 'center' },
  dateTimeLabel: { fontSize: 12, color: '#64748B', marginBottom: 4 },
  dateTimeValue: { fontSize: 15, fontWeight: '500', color: '#FFFFFF' },
  timeValue: { fontSize: 14, color: '#8B5CF6', marginTop: 4 },

  colorOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },

  linkOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  linkOptionText: { flex: 1, marginLeft: 12, fontSize: 16, color: '#FFFFFF' },

  pickerContainer: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    marginTop: 8,
    padding: 8,
  },
  pickerOption: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  pickerOptionSelected: {
    backgroundColor: '#8B5CF620',
  },
  pickerOptionText: { fontSize: 15, color: '#FFFFFF' },
  pickerOptionTextSelected: { color: '#8B5CF6', fontWeight: '500' },

  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF444420',
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 20,
    marginBottom: 40,
  },
  deleteBtnText: { color: '#EF4444', fontWeight: '600', fontSize: 16, marginLeft: 8 },
});
