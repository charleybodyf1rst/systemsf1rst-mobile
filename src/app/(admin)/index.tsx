import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../lib/api';

interface OrgStats {
  total_employees: number;
  clocked_in_count: number;
  pending_approvals: number;
  total_hours_today: number;
  total_hours_week: number;
  geofence_locations: number;
}

interface RecentActivity {
  id: number;
  type: string;
  user_name: string;
  description: string;
  created_at: string;
}

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<OrgStats | null>(null);
  const [activity, setActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [orgResponse] = await Promise.all([
        api.get('/time-clock/organization'),
      ]);

      const entries = orgResponse.data.entries || [];
      const clockedIn = entries.filter((e: any) => e.status === 'clocked_in').length;
      const pending = entries.filter((e: any) => e.status === 'clocked_out').length;
      const todayHours = entries.reduce((sum: number, e: any) => sum + (e.total_hours || 0), 0);

      setStats({
        total_employees: new Set(entries.map((e: any) => e.user_id)).size,
        clocked_in_count: clockedIn,
        pending_approvals: pending,
        total_hours_today: todayHours,
        total_hours_week: orgResponse.data.weekly_hours || 0,
        geofence_locations: orgResponse.data.geofence_count || 0,
      });

      // Mock recent activity for now
      setActivity([
        { id: 1, type: 'clock_in', user_name: 'John D.', description: 'Clocked in', created_at: new Date().toISOString() },
        { id: 2, type: 'approval', user_name: 'Sarah M.', description: 'Timesheet approved', created_at: new Date().toISOString() },
        { id: 3, type: 'clock_out', user_name: 'Mike T.', description: 'Clocked out', created_at: new Date().toISOString() },
      ]);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'clock_in':
        return 'arrow-forward-circle';
      case 'clock_out':
        return 'arrow-back-circle';
      case 'approval':
        return 'checkmark-circle';
      default:
        return 'ellipse';
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'clock_in':
        return '#10B981';
      case 'clock_out':
        return '#EF4444';
      case 'approval':
        return '#3B82F6';
      default:
        return '#8B5CF6';
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#8B5CF6" style={styles.loader} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8B5CF6" />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}, {user?.first_name}!</Text>
            <Text style={styles.role}>Admin Dashboard</Text>
          </View>
          <View style={styles.adminBadge}>
            <Ionicons name="shield-checkmark" size={20} color="#8B5CF6" />
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <TouchableOpacity style={styles.statCard} onPress={() => router.push('/(admin)/employees')}>
            <View style={[styles.statIcon, { backgroundColor: '#8B5CF620' }]}>
              <Ionicons name="people" size={24} color="#8B5CF6" />
            </View>
            <Text style={styles.statValue}>{stats?.total_employees || 0}</Text>
            <Text style={styles.statLabel}>Total Employees</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#10B98120' }]}>
              <Ionicons name="radio-button-on" size={24} color="#10B981" />
            </View>
            <Text style={styles.statValue}>{stats?.clocked_in_count || 0}</Text>
            <Text style={styles.statLabel}>Clocked In</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#F59E0B20' }]}>
              <Ionicons name="time" size={24} color="#F59E0B" />
            </View>
            <Text style={styles.statValue}>{stats?.pending_approvals || 0}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.statCard} onPress={() => router.push('/(admin)/geofence')}>
            <View style={[styles.statIcon, { backgroundColor: '#06B6D420' }]}>
              <Ionicons name="location" size={24} color="#06B6D4" />
            </View>
            <Text style={styles.statValue}>{stats?.geofence_locations || 0}</Text>
            <Text style={styles.statLabel}>Locations</Text>
          </TouchableOpacity>
        </View>

        {/* Hours Summary */}
        <View style={styles.hoursCard}>
          <Text style={styles.cardTitle}>Hours Summary</Text>
          <View style={styles.hoursRow}>
            <View style={styles.hoursItem}>
              <Text style={styles.hoursValue}>{stats?.total_hours_today?.toFixed(1) || '0'}h</Text>
              <Text style={styles.hoursLabel}>Today</Text>
            </View>
            <View style={styles.hoursDivider} />
            <View style={styles.hoursItem}>
              <Text style={styles.hoursValue}>{stats?.total_hours_week?.toFixed(1) || '0'}h</Text>
              <Text style={styles.hoursLabel}>This Week</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsCard}>
          <Text style={styles.cardTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/(admin)/employees')}>
              <Ionicons name="person-add" size={24} color="#8B5CF6" />
              <Text style={styles.actionText}>Add Employee</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/(admin)/geofence')}>
              <Ionicons name="add-circle" size={24} color="#10B981" />
              <Text style={styles.actionText}>Add Location</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/(admin)/reports')}>
              <Ionicons name="download" size={24} color="#3B82F6" />
              <Text style={styles.actionText}>Export Report</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.activityCard}>
          <Text style={styles.cardTitle}>Recent Activity</Text>
          {activity.map((item) => (
            <View key={item.id} style={styles.activityItem}>
              <View style={[styles.activityIcon, { backgroundColor: getActivityColor(item.type) + '20' }]}>
                <Ionicons name={getActivityIcon(item.type)} size={20} color={getActivityColor(item.type)} />
              </View>
              <View style={styles.activityInfo}>
                <Text style={styles.activityName}>{item.user_name}</Text>
                <Text style={styles.activityDesc}>{item.description}</Text>
              </View>
              <Text style={styles.activityTime}>Just now</Text>
            </View>
          ))}
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
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },
  role: {
    fontSize: 14,
    color: '#8B5CF6',
    marginTop: 4,
  },
  adminBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#8B5CF620',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },
  statLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
  },
  hoursCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 16,
  },
  hoursRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  hoursItem: {
    alignItems: 'center',
    flex: 1,
  },
  hoursValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#8B5CF6',
  },
  hoursLabel: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 4,
  },
  hoursDivider: {
    width: 1,
    height: 48,
    backgroundColor: '#334155',
  },
  actionsCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    alignItems: 'center',
    padding: 12,
  },
  actionText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 8,
  },
  activityCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
  },
  activityName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  activityDesc: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  activityTime: {
    fontSize: 12,
    color: '#64748B',
  },
});
