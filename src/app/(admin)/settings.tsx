import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';

export default function SettingsScreen() {
  const { user, logout } = useAuthStore();
  const [geofenceRequired, setGeofenceRequired] = useState(true);
  const [autoApprove, setAutoApprove] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [overtimeAlerts, setOvertimeAlerts] = useState(true);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Section */}
      <View style={styles.profileSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.first_name?.[0]}
            {user?.last_name?.[0]}
          </Text>
        </View>
        <Text style={styles.profileName}>
          {user?.first_name} {user?.last_name}
        </Text>
        <Text style={styles.profileEmail}>{user?.email}</Text>
        <View style={styles.roleBadge}>
          <Ionicons name="shield-checkmark" size={16} color="#8B5CF6" />
          <Text style={styles.roleText}>Administrator</Text>
        </View>
      </View>

      {/* Time Clock Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Time Clock Settings</Text>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Require Geofence</Text>
            <Text style={styles.settingDescription}>
              Employees must be within approved locations to clock in
            </Text>
          </View>
          <Switch
            value={geofenceRequired}
            onValueChange={setGeofenceRequired}
            trackColor={{ false: '#334155', true: '#8B5CF6' }}
            thumbColor="#F8FAFC"
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Auto-Approve Entries</Text>
            <Text style={styles.settingDescription}>
              Automatically approve time entries under 8 hours
            </Text>
          </View>
          <Switch
            value={autoApprove}
            onValueChange={setAutoApprove}
            trackColor={{ false: '#334155', true: '#8B5CF6' }}
            thumbColor="#F8FAFC"
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Overtime Alerts</Text>
            <Text style={styles.settingDescription}>
              Notify when employees exceed 40 hours/week
            </Text>
          </View>
          <Switch
            value={overtimeAlerts}
            onValueChange={setOvertimeAlerts}
            trackColor={{ false: '#334155', true: '#8B5CF6' }}
            thumbColor="#F8FAFC"
          />
        </View>
      </View>

      {/* Notifications */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Push Notifications</Text>
            <Text style={styles.settingDescription}>
              Receive alerts for clock events and approvals
            </Text>
          </View>
          <Switch
            value={notifications}
            onValueChange={setNotifications}
            trackColor={{ false: '#334155', true: '#8B5CF6' }}
            thumbColor="#F8FAFC"
          />
        </View>
      </View>

      {/* Organization */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Organization</Text>

        <TouchableOpacity style={styles.linkItem}>
          <View style={styles.linkIcon}>
            <Ionicons name="business" size={20} color="#8B5CF6" />
          </View>
          <Text style={styles.linkText}>Company Profile</Text>
          <Ionicons name="chevron-forward" size={20} color="#64748B" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkItem}>
          <View style={styles.linkIcon}>
            <Ionicons name="card" size={20} color="#10B981" />
          </View>
          <Text style={styles.linkText}>Billing & Subscription</Text>
          <Ionicons name="chevron-forward" size={20} color="#64748B" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkItem}>
          <View style={styles.linkIcon}>
            <Ionicons name="key" size={20} color="#F59E0B" />
          </View>
          <Text style={styles.linkText}>API Keys</Text>
          <Ionicons name="chevron-forward" size={20} color="#64748B" />
        </TouchableOpacity>
      </View>

      {/* Support */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>

        <TouchableOpacity style={styles.linkItem}>
          <View style={styles.linkIcon}>
            <Ionicons name="help-circle" size={20} color="#8B5CF6" />
          </View>
          <Text style={styles.linkText}>Help Center</Text>
          <Ionicons name="chevron-forward" size={20} color="#64748B" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkItem}>
          <View style={styles.linkIcon}>
            <Ionicons name="chatbubble" size={20} color="#3B82F6" />
          </View>
          <Text style={styles.linkText}>Contact Support</Text>
          <Ionicons name="chevron-forward" size={20} color="#64748B" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkItem}>
          <View style={styles.linkIcon}>
            <Ionicons name="document-text" size={20} color="#10B981" />
          </View>
          <Text style={styles.linkText}>Terms & Privacy</Text>
          <Ionicons name="chevron-forward" size={20} color="#64748B" />
        </TouchableOpacity>
      </View>

      {/* Account Actions */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out" size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* App Info */}
      <View style={styles.appInfo}>
        <Text style={styles.appVersion}>SystemsF1RST Mobile v1.0.0</Text>
        <Text style={styles.appCopyright}>© 2026 SystemsF1RST Marketplace</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 32,
    paddingTop: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  profileName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },
  profileEmail: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 4,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B5CF620',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 12,
    gap: 6,
  },
  roleText: {
    fontSize: 14,
    color: '#8B5CF6',
    fontWeight: '500',
  },
  section: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    color: '#F8FAFC',
    fontWeight: '500',
  },
  settingDescription: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  linkIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  linkText: {
    flex: 1,
    fontSize: 16,
    color: '#F8FAFC',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    color: '#EF4444',
    fontWeight: '600',
  },
  appInfo: {
    alignItems: 'center',
    marginTop: 24,
  },
  appVersion: {
    fontSize: 14,
    color: '#64748B',
  },
  appCopyright: {
    fontSize: 12,
    color: '#475569',
    marginTop: 4,
  },
});
