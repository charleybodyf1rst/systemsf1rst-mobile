import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useHRStore, EmployeeStatus } from '../../stores';

const statusColors: Record<EmployeeStatus, { bg: string; text: string }> = {
  active: { bg: '#10B98120', text: '#10B981' },
  inactive: { bg: '#6B728020', text: '#6B7280' },
  on_leave: { bg: '#F59E0B20', text: '#F59E0B' },
  terminated: { bg: '#EF444420', text: '#EF4444' },
};

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon as any} size={20} color="#64748B" />
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

export default function EmployeeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { selectedEmployee, fetchEmployee, setSelectedEmployee } = useHRStore();

  useEffect(() => {
    if (id) {
      fetchEmployee(id);
    }
    return () => setSelectedEmployee(null);
  }, [id]);

  const employee = selectedEmployee;

  if (!employee) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
        </View>
      </SafeAreaView>
    );
  }

  const statusStyle = statusColors[employee.status];
  const initials = `${employee.firstName[0]}${employee.lastName[0]}`.toUpperCase();

  const handleCall = () => {
    if (employee.phone) {
      Linking.openURL(`tel:${employee.phone}`);
    }
  };

  const handleEmail = () => {
    Linking.openURL(`mailto:${employee.email}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Employee Details</Text>
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-horizontal" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            {employee.avatar ? (
              <Image source={{ uri: employee.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
            )}
            <View style={[styles.statusIndicator, { backgroundColor: statusStyle.text }]} />
          </View>
          <Text style={styles.employeeName}>
            {employee.firstName} {employee.lastName}
          </Text>
          <Text style={styles.employeePosition}>{employee.position}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.statusText, { color: statusStyle.text }]}>
              {employee.status.replace('_', ' ')}
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {employee.phone && (
              <TouchableOpacity style={styles.actionButton} onPress={handleCall}>
                <Ionicons name="call" size={20} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>Call</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.actionButton} onPress={handleEmail}>
              <Ionicons name="mail" size={20} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Email</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.actionButtonOutline]}>
              <Ionicons name="chatbubble" size={20} color="#8B5CF6" />
              <Text style={[styles.actionButtonText, { color: '#8B5CF6' }]}>Message</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Work Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Work Information</Text>
          <View style={styles.sectionContent}>
            <InfoRow icon="business" label="Department" value={employee.department} />
            <InfoRow icon="briefcase" label="Position" value={employee.position} />
            <InfoRow
              icon="document-text"
              label="Employment Type"
              value={employee.employmentType.replace('_', ' ')}
            />
            <InfoRow
              icon="calendar"
              label="Hire Date"
              value={new Date(employee.hireDate).toLocaleDateString()}
            />
            {employee.managerName && (
              <InfoRow icon="person" label="Manager" value={employee.managerName} />
            )}
          </View>
        </View>

        {/* Contact Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <View style={styles.sectionContent}>
            <InfoRow icon="mail" label="Email" value={employee.email} />
            {employee.phone && <InfoRow icon="call" label="Phone" value={employee.phone} />}
            {employee.address && (
              <InfoRow icon="location" label="Address" value={employee.address} />
            )}
          </View>
        </View>

        {/* Skills */}
        {employee.skills && employee.skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Skills</Text>
            <View style={styles.tagsContainer}>
              {employee.skills.map((skill, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{skill}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Certifications */}
        {employee.certifications && employee.certifications.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Certifications</Text>
            <View style={styles.tagsContainer}>
              {employee.certifications.map((cert, index) => (
                <View key={index} style={[styles.tag, styles.certTag]}>
                  <Ionicons name="ribbon" size={14} color="#F59E0B" />
                  <Text style={[styles.tagText, { color: '#F59E0B' }]}>{cert}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Emergency Contact */}
        {employee.emergencyContact && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Emergency Contact</Text>
            <View style={styles.sectionContent}>
              <InfoRow icon="person" label="Name" value={employee.emergencyContact.name} />
              <InfoRow icon="call" label="Phone" value={employee.emergencyContact.phone} />
              <InfoRow
                icon="heart"
                label="Relationship"
                value={employee.emergencyContact.relationship}
              />
            </View>
          </View>
        )}

        {/* Notes */}
        {employee.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <View style={styles.notesContainer}>
              <Text style={styles.notesText}>{employee.notes}</Text>
            </View>
          </View>
        )}
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
  profileCard: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    backgroundColor: '#1E293B',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 16,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '700',
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: '#1E293B',
  },
  employeeName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 16,
  },
  employeePosition: {
    fontSize: 16,
    color: '#94A3B8',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 12,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  actionButtonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#8B5CF6',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginTop: 20,
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  sectionContent: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  infoValue: {
    fontSize: 15,
    color: '#FFFFFF',
    marginTop: 2,
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
  certTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F59E0B20',
  },
  tagText: {
    fontSize: 13,
    color: '#94A3B8',
  },
  notesContainer: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
  },
  notesText: {
    fontSize: 14,
    color: '#94A3B8',
    lineHeight: 22,
  },
});
