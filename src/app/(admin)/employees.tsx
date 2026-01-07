import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../lib/api';

interface Employee {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  status: string;
  last_clock_in?: string;
  is_clocked_in: boolean;
}

export default function EmployeesScreen() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = employees.filter(
        (emp) =>
          emp.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          emp.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          emp.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredEmployees(filtered);
    } else {
      setFilteredEmployees(employees);
    }
  }, [searchQuery, employees]);

  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/time-clock/organization');
      const entries = response.data.entries || [];

      // Group by user
      const userMap = new Map<number, Employee>();
      entries.forEach((entry: any) => {
        if (!userMap.has(entry.user.id)) {
          userMap.set(entry.user.id, {
            id: entry.user.id,
            first_name: entry.user.first_name,
            last_name: entry.user.last_name,
            email: entry.user.email,
            role: entry.user.role || 'employee',
            status: entry.status === 'clocked_in' ? 'active' : 'inactive',
            last_clock_in: entry.clock_in_at,
            is_clocked_in: entry.status === 'clocked_in',
          });
        }
      });

      setEmployees(Array.from(userMap.values()));
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return '#8B5CF6';
      case 'manager':
        return '#3B82F6';
      default:
        return '#10B981';
    }
  };

  const renderEmployee = ({ item }: { item: Employee }) => (
    <TouchableOpacity style={styles.employeeCard}>
      <View style={styles.employeeRow}>
        <View style={styles.avatar}>
          {item.is_clocked_in && <View style={styles.onlineIndicator} />}
          <Text style={styles.avatarText}>
            {item.first_name[0]}
            {item.last_name[0]}
          </Text>
        </View>
        <View style={styles.employeeInfo}>
          <Text style={styles.employeeName}>
            {item.first_name} {item.last_name}
          </Text>
          <Text style={styles.employeeEmail}>{item.email}</Text>
        </View>
        <View style={[styles.roleBadge, { backgroundColor: getRoleBadgeColor(item.role) + '20' }]}>
          <Text style={[styles.roleText, { color: getRoleBadgeColor(item.role) }]}>
            {item.role}
          </Text>
        </View>
      </View>
      <View style={styles.employeeStats}>
        <View style={styles.statItem}>
          <Ionicons
            name={item.is_clocked_in ? 'radio-button-on' : 'radio-button-off'}
            size={14}
            color={item.is_clocked_in ? '#10B981' : '#64748B'}
          />
          <Text style={[styles.statText, { color: item.is_clocked_in ? '#10B981' : '#64748B' }]}>
            {item.is_clocked_in ? 'Clocked In' : 'Clocked Out'}
          </Text>
        </View>
        {item.last_clock_in && (
          <Text style={styles.lastSeen}>
            Last: {new Date(item.last_clock_in).toLocaleDateString()}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Employees</Text>
        <Text style={styles.subtitle}>{employees.length} team members</Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#64748B" style={styles.searchIcon} />
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

      {/* Add Employee Button */}
      <TouchableOpacity style={styles.addButton}>
        <Ionicons name="person-add" size={20} color="#fff" />
        <Text style={styles.addButtonText}>Add Employee</Text>
      </TouchableOpacity>

      {isLoading ? (
        <ActivityIndicator size="large" color="#8B5CF6" style={styles.loader} />
      ) : filteredEmployees.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="people-outline" size={64} color="#64748B" />
          <Text style={styles.emptyTitle}>No Employees Found</Text>
          <Text style={styles.emptyText}>
            {searchQuery ? 'Try a different search term' : 'Add employees to get started'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredEmployees}
          renderItem={renderEmployee}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    height: 48,
    color: '#F8FAFC',
    fontSize: 16,
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
  },
  list: {
    paddingBottom: 20,
  },
  employeeCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  employeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  onlineIndicator: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#1E293B',
  },
  avatarText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  employeeInfo: {
    flex: 1,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  employeeEmail: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  employeeStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 12,
    fontWeight: '500',
  },
  lastSeen: {
    fontSize: 12,
    color: '#64748B',
  },
});
