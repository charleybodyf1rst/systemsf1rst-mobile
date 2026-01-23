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
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useHRStore, Employee, EmployeeStatus } from '../../stores';

const statusColors: Record<EmployeeStatus, { bg: string; text: string }> = {
  active: { bg: '#10B98120', text: '#10B981' },
  inactive: { bg: '#6B728020', text: '#6B7280' },
  on_leave: { bg: '#F59E0B20', text: '#F59E0B' },
  terminated: { bg: '#EF444420', text: '#EF4444' },
};

function EmployeeCard({ employee, onPress }: { employee: Employee; onPress: () => void }) {
  const statusStyle = statusColors[employee.status];
  const initials = `${employee.firstName[0]}${employee.lastName[0]}`.toUpperCase();

  return (
    <TouchableOpacity style={styles.employeeCard} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.employeeAvatar}>
        {employee.avatar ? (
          <Image source={{ uri: employee.avatar }} style={styles.avatarImage} />
        ) : (
          <Text style={styles.avatarText}>{initials}</Text>
        )}
      </View>
      <View style={styles.employeeInfo}>
        <Text style={styles.employeeName}>
          {employee.firstName} {employee.lastName}
        </Text>
        <Text style={styles.employeePosition}>{employee.position}</Text>
        <Text style={styles.employeeDepartment}>{employee.department}</Text>
      </View>
      <View style={styles.employeeRight}>
        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
          <Text style={[styles.statusText, { color: statusStyle.text }]}>
            {employee.status.replace('_', ' ')}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#64748B" />
      </View>
    </TouchableOpacity>
  );
}

export default function EmployeesScreen() {
  const { employees, departments, employeesLoading, fetchEmployees, fetchDepartments } = useHRStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<EmployeeStatus | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchEmployees();
    fetchDepartments();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchEmployees();
    setRefreshing(false);
  };

  const filteredEmployees = employees.filter((employee) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const fullName = `${employee.firstName} ${employee.lastName}`.toLowerCase();
      const matchesSearch =
        fullName.includes(query) ||
        employee.email.toLowerCase().includes(query) ||
        employee.position.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    // Department filter
    if (selectedDepartment && employee.department !== selectedDepartment) {
      return false;
    }

    // Status filter
    if (selectedStatus && employee.status !== selectedStatus) {
      return false;
    }

    return true;
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Employees</Text>
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
            placeholder="Search employees..."
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

      {/* Department Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        <TouchableOpacity
          style={[styles.filterChip, !selectedDepartment && styles.filterChipActive]}
          onPress={() => setSelectedDepartment(null)}
        >
          <Text style={[styles.filterChipText, !selectedDepartment && styles.filterChipTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        {departments.map((dept) => (
          <TouchableOpacity
            key={dept.id}
            style={[styles.filterChip, selectedDepartment === dept.name && styles.filterChipActive]}
            onPress={() => setSelectedDepartment(dept.name === selectedDepartment ? null : dept.name)}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedDepartment === dept.name && styles.filterChipTextActive,
              ]}
            >
              {dept.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{employees.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#10B981' }]}>
            {employees.filter((e) => e.status === 'active').length}
          </Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#F59E0B' }]}>
            {employees.filter((e) => e.status === 'on_leave').length}
          </Text>
          <Text style={styles.statLabel}>On Leave</Text>
        </View>
      </View>

      {/* Employee List */}
      {employeesLoading ? (
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
          {filteredEmployees.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color="#64748B" />
              <Text style={styles.emptyText}>No employees found</Text>
            </View>
          ) : (
            filteredEmployees.map((employee) => (
              <EmployeeCard
                key={employee.id}
                employee={employee}
                onPress={() => router.push(`/(crm)/employee-detail?id=${employee.id}`)}
              />
            ))
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
  filterContainer: {
    maxHeight: 44,
  },
  filterContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#1E293B',
    borderRadius: 20,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#8B5CF6',
  },
  filterChipText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
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
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  employeeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  employeeAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  employeeInfo: {
    flex: 1,
    marginLeft: 12,
  },
  employeeName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  employeePosition: {
    color: '#94A3B8',
    fontSize: 14,
    marginTop: 2,
  },
  employeeDepartment: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 2,
  },
  employeeRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
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
});
