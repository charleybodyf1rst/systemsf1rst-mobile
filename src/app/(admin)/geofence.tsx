import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { api } from '../../lib/api';

interface GeofenceLocation {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  is_active: boolean;
}

export default function GeofenceScreen() {
  const [locations, setLocations] = useState<GeofenceLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLocation, setNewLocation] = useState({
    name: '',
    address: '',
    radius_meters: '100',
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/geofence');
      setLocations(response.data.locations || []);
    } catch (error) {
      console.error('Failed to fetch locations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddLocation = async () => {
    if (!newLocation.name.trim()) {
      Alert.alert('Error', 'Please enter a location name');
      return;
    }

    setIsSaving(true);
    try {
      // Get current location as default
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Error', 'Location permission is required');
        setIsSaving(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});

      await api.post('/geofence', {
        name: newLocation.name,
        address: newLocation.address || 'Current Location',
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        radius_meters: parseInt(newLocation.radius_meters) || 100,
      });

      Alert.alert('Success', 'Location added successfully');
      setShowAddModal(false);
      setNewLocation({ name: '', address: '', radius_meters: '100' });
      fetchLocations();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to add location');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteLocation = async (id: number) => {
    Alert.alert('Delete Location', 'Are you sure you want to delete this location?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/geofence/${id}`);
            setLocations(locations.filter((l) => l.id !== id));
            Alert.alert('Success', 'Location deleted');
          } catch (error) {
            Alert.alert('Error', 'Failed to delete location');
          }
        },
      },
    ]);
  };

  const toggleLocationActive = async (location: GeofenceLocation) => {
    try {
      await api.put(`/geofence/${location.id}`, {
        is_active: !location.is_active,
      });
      setLocations(
        locations.map((l) => (l.id === location.id ? { ...l, is_active: !l.is_active } : l))
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to update location');
    }
  };

  const renderLocation = ({ item }: { item: GeofenceLocation }) => (
    <View style={styles.locationCard}>
      <View style={styles.locationHeader}>
        <View style={styles.locationIcon}>
          <Ionicons
            name="location"
            size={24}
            color={item.is_active ? '#10B981' : '#64748B'}
          />
        </View>
        <View style={styles.locationInfo}>
          <Text style={styles.locationName}>{item.name}</Text>
          <Text style={styles.locationAddress}>{item.address || 'No address'}</Text>
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteLocation(item.id)}
        >
          <Ionicons name="trash-outline" size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <View style={styles.locationDetails}>
        <View style={styles.detailItem}>
          <Ionicons name="resize" size={16} color="#64748B" />
          <Text style={styles.detailText}>{item.radius_meters}m radius</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="navigate" size={16} color="#64748B" />
          <Text style={styles.detailText}>
            {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.toggleButton, item.is_active && styles.toggleActive]}
        onPress={() => toggleLocationActive(item)}
      >
        <Ionicons
          name={item.is_active ? 'checkmark-circle' : 'close-circle'}
          size={20}
          color={item.is_active ? '#10B981' : '#64748B'}
        />
        <Text style={[styles.toggleText, item.is_active && styles.toggleTextActive]}>
          {item.is_active ? 'Active' : 'Inactive'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Geofence Locations</Text>
        <Text style={styles.subtitle}>Manage approved work locations</Text>
      </View>

      {/* Add Location Button */}
      <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
        <Ionicons name="add-circle" size={20} color="#fff" />
        <Text style={styles.addButtonText}>Add Location</Text>
      </TouchableOpacity>

      {isLoading ? (
        <ActivityIndicator size="large" color="#8B5CF6" style={styles.loader} />
      ) : locations.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="location-outline" size={64} color="#64748B" />
          <Text style={styles.emptyTitle}>No Locations</Text>
          <Text style={styles.emptyText}>Add geofence locations to restrict where employees can clock in</Text>
        </View>
      ) : (
        <FlatList
          data={locations}
          renderItem={renderLocation}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Add Location Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Location</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Location Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Main Office"
                placeholderTextColor="#64748B"
                value={newLocation.name}
                onChangeText={(text) => setNewLocation({ ...newLocation, name: text })}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Address</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 123 Main St"
                placeholderTextColor="#64748B"
                value={newLocation.address}
                onChangeText={(text) => setNewLocation({ ...newLocation, address: text })}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Radius (meters)</Text>
              <TextInput
                style={styles.input}
                placeholder="100"
                placeholderTextColor="#64748B"
                keyboardType="numeric"
                value={newLocation.radius_meters}
                onChangeText={(text) => setNewLocation({ ...newLocation, radius_meters: text })}
              />
            </View>

            <Text style={styles.helperText}>
              Current device location will be used as the center point
            </Text>

            <TouchableOpacity
              style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
              onPress={handleAddLocation}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={20} color="#fff" />
                  <Text style={styles.saveButtonText}>Add Location</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 4,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 20,
    gap: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loader: {
    marginTop: 48,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#F8FAFC',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 8,
    textAlign: 'center',
  },
  list: {
    paddingBottom: 20,
  },
  locationCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  locationAddress: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  deleteButton: {
    padding: 8,
  },
  locationDetails: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    gap: 24,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 12,
    color: '#64748B',
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 10,
    backgroundColor: '#0F172A',
    borderRadius: 8,
    gap: 6,
  },
  toggleActive: {
    backgroundColor: '#10B98120',
  },
  toggleText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  toggleTextActive: {
    color: '#10B981',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#F8FAFC',
    fontSize: 16,
  },
  helperText: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 20,
    textAlign: 'center',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
