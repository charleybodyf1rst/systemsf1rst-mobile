import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useAuthStore } from '../../stores/authStore';
import { useTimeClockStore } from '../../stores/timeClockStore';
import { api } from '../../lib/api';

interface TeamMember {
  id: number;
  user: {
    first_name: string;
    last_name: string;
  };
  clock_in_at: string;
  current_duration: number;
  duration_formatted: string;
  status: string;
}

export default function ManagerDashboard() {
  const { user } = useAuthStore();
  const { isClockedIn, currentClock, weeklySummary, fetchStatus, clockIn, clockOut, isLoading } = useTimeClockStore();
  const [teamData, setTeamData] = useState<{ clocked_in: TeamMember[]; overview: any }>({ clocked_in: [], overview: {} });
  const [location, setLocation] = useState<Location.LocationObject | null>(null);

  useEffect(() => {
    fetchStatus();
    fetchTeamData();
    getLocation();
  }, []);

  const fetchTeamData = async () => {
    try {
      const response = await api.get('/time-clock/team');
      setTeamData({
        clocked_in: response.data.clocked_in || [],
        overview: response.data.overview || {},
      });
    } catch (error) {
      console.error('Failed to fetch team data:', error);
    }
  };

  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setLocation(loc);
      }
    } catch (error) {
      console.error('Location error:', error);
    }
  };

  const handleClockToggle = async () => {
    if (!location) return;

    if (isClockedIn) {
      await clockOut({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    } else {
      await clockIn({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}, {user?.first_name}!</Text>
            <Text style={styles.role}>Manager Dashboard</Text>
          </View>
          <TouchableOpacity
            style={[styles.clockButton, isClockedIn ? styles.clockOutBtn : styles.clockInBtn]}
            onPress={handleClockToggle}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Ionicons name={isClockedIn ? 'stop' : 'play'} size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>

        {/* Team Overview */}
        <View style={styles.overviewCard}>
          <Text style={styles.cardTitle}>Team Overview - Today</Text>
          <View style={styles.overviewGrid}>
            <View style={styles.overviewItem}>
              <Text style={styles.overviewValue}>{teamData.overview.clocked_in_count || 0}</Text>
              <Text style={styles.overviewLabel}>Clocked In</Text>
            </View>
            <View style={styles.overviewItem}>
              <Text style={styles.overviewValue}>{teamData.overview.clocked_out_count || 0}</Text>
              <Text style={styles.overviewLabel}>Clocked Out</Text>
            </View>
            <View style={styles.overviewItem}>
              <Text style={styles.overviewValue}>{teamData.overview.total_hours_today?.toFixed(1) || '0'}h</Text>
              <Text style={styles.overviewLabel}>Total Hours</Text>
            </View>
          </View>
        </View>

        {/* Currently Working */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Currently Working</Text>
          {teamData.clocked_in.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No team members clocked in</Text>
            </View>
          ) : (
            teamData.clocked_in.map((member) => (
              <View key={member.id} style={styles.memberCard}>
                <View style={styles.memberAvatar}>
                  <View style={styles.onlineIndicator} />
                  <Text style={styles.avatarText}>
                    {member.user.first_name[0]}{member.user.last_name[0]}
                  </Text>
                </View>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>
                    {member.user.first_name} {member.user.last_name}
                  </Text>
                  <Text style={styles.memberTime}>
                    Since {new Date(member.clock_in_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </Text>
                </View>
                <Text style={styles.memberDuration}>{member.duration_formatted}</Text>
              </View>
            ))
          )}
        </View>

        {/* Your Stats */}
        <View style={styles.statsCard}>
          <Text style={styles.cardTitle}>Your Week</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{weeklySummary?.total_hours?.toFixed(1) || '0'}h</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{weeklySummary?.regular_hours?.toFixed(1) || '0'}h</Text>
              <Text style={styles.statLabel}>Regular</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{weeklySummary?.overtime_hours?.toFixed(1) || '0'}h</Text>
              <Text style={styles.statLabel}>Overtime</Text>
            </View>
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
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
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
  clockButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clockInBtn: {
    backgroundColor: '#10B981',
  },
  clockOutBtn: {
    backgroundColor: '#EF4444',
  },
  overviewCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 16,
  },
  overviewGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  overviewItem: {
    alignItems: 'center',
  },
  overviewValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#8B5CF6',
  },
  overviewLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 12,
  },
  emptyState: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748B',
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  onlineIndicator: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#1E293B',
  },
  avatarText: {
    color: '#fff',
    fontWeight: '600',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#F8FAFC',
  },
  memberTime: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  memberDuration: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
  },
  statsCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },
  statLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
  },
});
