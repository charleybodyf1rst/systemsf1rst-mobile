import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useAuthStore } from '../../stores/authStore';
import { useTimeClockStore } from '../../stores/timeClockStore';

export default function TimeClockScreen() {
  const { user } = useAuthStore();
  const {
    isClockedIn,
    currentClock,
    weeklySummary,
    isLoading,
    clockIn,
    clockOut,
    fetchStatus,
  } = useTimeClockStore();

  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [locationName, setLocationName] = useState<string>('Fetching location...');
  const [elapsedTime, setElapsedTime] = useState<string>('00:00:00');

  // Fetch status on mount
  useEffect(() => {
    fetchStatus();
    getLocation();
  }, []);

  // Update elapsed time every second if clocked in
  useEffect(() => {
    if (!isClockedIn || !currentClock?.clock_in_at) return;

    const interval = setInterval(() => {
      const clockInTime = new Date(currentClock.clock_in_at).getTime();
      const now = Date.now();
      const diff = now - clockInTime;

      const hours = Math.floor(diff / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);

      setElapsedTime(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [isClockedIn, currentClock]);

  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationName('Location permission denied');
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);

      // Reverse geocode to get address
      const [address] = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      if (address) {
        setLocationName(
          `${address.name || address.street || ''}, ${address.city || ''}`
        );
      } else {
        setLocationName('Location found');
      }
    } catch (error) {
      setLocationName('Could not get location');
    }
  };

  const handleClockIn = async () => {
    if (!location) {
      Alert.alert('Location Required', 'Please wait for your location to be determined.');
      return;
    }

    await clockIn({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      location_name: locationName,
    });
  };

  const handleClockOut = async () => {
    if (!location) {
      Alert.alert('Location Required', 'Please wait for your location to be determined.');
      return;
    }

    await clockOut({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      location_name: locationName,
    });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const formatDate = () => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>
            {getGreeting()}, {user?.first_name || 'User'}!
          </Text>
          <Text style={styles.date}>{formatDate()}</Text>
        </View>

        {/* Clock Button */}
        <View style={styles.clockSection}>
          {isClockedIn ? (
            <>
              <Text style={styles.clockStatus}>Currently Working</Text>
              <TouchableOpacity
                style={[styles.clockButton, styles.clockOutButton]}
                onPress={handleClockOut}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="large" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="stop-circle" size={48} color="#fff" />
                    <Text style={styles.clockButtonText}>CLOCK OUT</Text>
                    <Text style={styles.elapsedTime}>{elapsedTime}</Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.clockStatus}>Not Clocked In</Text>
              <TouchableOpacity
                style={[styles.clockButton, styles.clockInButton]}
                onPress={handleClockIn}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="large" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="play-circle" size={48} color="#fff" />
                    <Text style={styles.clockButtonText}>CLOCK IN</Text>
                    <Text style={styles.tapText}>Tap to start</Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Location */}
        <View style={styles.locationSection}>
          <Ionicons name="location" size={20} color="#8B5CF6" />
          <Text style={styles.locationText}>{locationName}</Text>
          <TouchableOpacity onPress={getLocation}>
            <Ionicons name="refresh" size={20} color="#64748B" />
          </TouchableOpacity>
        </View>

        {/* Weekly Summary */}
        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>This Week</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>
                {weeklySummary?.total_hours?.toFixed(1) || '0.0'}h
              </Text>
              <Text style={styles.summaryLabel}>Total</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>
                {weeklySummary?.regular_hours?.toFixed(1) || '0.0'}h
              </Text>
              <Text style={styles.summaryLabel}>Regular</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>
                {weeklySummary?.overtime_hours?.toFixed(1) || '0.0'}h
              </Text>
              <Text style={styles.summaryLabel}>Overtime</Text>
            </View>
          </View>
        </View>

        {/* Quick Stats by Day */}
        {weeklySummary?.by_day && Object.keys(weeklySummary.by_day).length > 0 && (
          <View style={styles.daysSection}>
            <Text style={styles.daysTitle}>Daily Breakdown</Text>
            {Object.entries(weeklySummary.by_day).map(([day, hours]) => (
              <View key={day} style={styles.dayRow}>
                <Text style={styles.dayName}>{day}</Text>
                <View style={styles.dayHoursBar}>
                  <View
                    style={[
                      styles.dayHoursFill,
                      { width: `${Math.min((Number(hours) / 8) * 100, 100)}%` },
                    ]}
                  />
                </View>
                <Text style={styles.dayHours}>{Number(hours).toFixed(1)}h</Text>
              </View>
            ))}
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
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  header: {
    marginBottom: 32,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },
  date: {
    fontSize: 16,
    color: '#94A3B8',
    marginTop: 4,
  },
  clockSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  clockStatus: {
    fontSize: 18,
    color: '#94A3B8',
    marginBottom: 16,
  },
  clockButton: {
    width: 200,
    height: 200,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  clockInButton: {
    backgroundColor: '#10B981',
  },
  clockOutButton: {
    backgroundColor: '#EF4444',
  },
  clockButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  elapsedTime: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 4,
  },
  tapText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  locationSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1E293B',
    padding: 12,
    borderRadius: 12,
    marginBottom: 24,
  },
  locationText: {
    flex: 1,
    color: '#E2E8F0',
    fontSize: 14,
  },
  summarySection: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#8B5CF6',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 4,
  },
  daysSection: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
  },
  daysTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 16,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dayName: {
    width: 40,
    fontSize: 14,
    color: '#94A3B8',
  },
  dayHoursBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#334155',
    borderRadius: 4,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  dayHoursFill: {
    height: '100%',
    backgroundColor: '#8B5CF6',
    borderRadius: 4,
  },
  dayHours: {
    width: 50,
    fontSize: 14,
    color: '#E2E8F0',
    textAlign: 'right',
  },
});
