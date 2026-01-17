// Calendar Sync Screen - Connect and manage external calendars
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Linking, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCalendarStore, ExternalCalendar } from '../../stores/calendarStore';

const PROVIDERS = [
  {
    id: 'google' as const,
    name: 'Google Calendar',
    icon: 'logo-google',
    color: '#4285F4',
    description: 'Sync events from your Google account',
  },
  {
    id: 'apple' as const,
    name: 'Apple Calendar',
    icon: 'logo-apple',
    color: '#000000',
    description: 'Sync events from iCloud Calendar',
  },
  {
    id: 'outlook' as const,
    name: 'Outlook Calendar',
    icon: 'mail',
    color: '#0078D4',
    description: 'Sync events from Microsoft Outlook',
  },
];

export default function CalendarSyncScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [connectingProvider, setConnectingProvider] = useState<string | null>(null);
  const [syncingCalendarId, setSyncingCalendarId] = useState<string | null>(null);

  const {
    connectedCalendars,
    calendarsLoading,
    fetchConnectedCalendars,
    connectExternalCalendar,
    disconnectExternalCalendar,
    syncExternalCalendar,
  } = useCalendarStore();

  useEffect(() => {
    fetchConnectedCalendars();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchConnectedCalendars();
    setRefreshing(false);
  };

  const handleConnect = async (provider: 'google' | 'apple' | 'outlook') => {
    setConnectingProvider(provider);
    try {
      const authUrl = await connectExternalCalendar(provider);
      if (authUrl) {
        // Open OAuth URL in browser
        const supported = await Linking.canOpenURL(authUrl);
        if (supported) {
          await Linking.openURL(authUrl);
        } else {
          Alert.alert('Error', 'Cannot open authorization URL');
        }
      }
    } catch (error: any) {
      Alert.alert('Connection Failed', error.message || 'Failed to connect calendar');
    }
    setConnectingProvider(null);
  };

  const handleDisconnect = (calendar: ExternalCalendar) => {
    Alert.alert(
      'Disconnect Calendar',
      `Are you sure you want to disconnect "${calendar.name}"?\n\nEvents from this calendar will no longer sync.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            try {
              await disconnectExternalCalendar(calendar.id);
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to disconnect calendar');
            }
          },
        },
      ]
    );
  };

  const handleSync = async (calendar: ExternalCalendar) => {
    setSyncingCalendarId(calendar.id);
    try {
      await syncExternalCalendar(calendar.id);
      Alert.alert('Sync Complete', `"${calendar.name}" has been synced successfully.`);
    } catch (error: any) {
      Alert.alert('Sync Failed', error.message || 'Failed to sync calendar');
    }
    setSyncingCalendarId(null);
  };

  const formatLastSynced = (dateString?: string) => {
    if (!dateString) return 'Never synced';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const getConnectedCalendarsForProvider = (provider: string) => {
    return connectedCalendars.filter(c => c.provider === provider);
  };

  const isProviderConnected = (provider: string) => {
    return connectedCalendars.some(c => c.provider === provider);
  };

  const renderConnectedCalendar = (calendar: ExternalCalendar) => {
    const isSyncing = syncingCalendarId === calendar.id;

    return (
      <View key={calendar.id} style={styles.connectedCalendarCard}>
        <View style={[styles.calendarColorDot, { backgroundColor: calendar.color }]} />
        <View style={styles.calendarInfo}>
          <Text style={styles.calendarName}>{calendar.name}</Text>
          <Text style={styles.calendarEmail}>{calendar.email}</Text>
          <Text style={styles.lastSynced}>
            {calendar.is_primary && <Text style={styles.primaryBadge}>Primary</Text>}
            {calendar.is_primary && ' • '}
            Last synced: {formatLastSynced(calendar.last_synced_at)}
          </Text>
        </View>
        <View style={styles.calendarActions}>
          {isSyncing ? (
            <ActivityIndicator size="small" color="#8B5CF6" />
          ) : (
            <>
              <TouchableOpacity
                style={styles.syncBtn}
                onPress={() => handleSync(calendar)}
              >
                <Ionicons name="sync" size={18} color="#8B5CF6" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.disconnectBtn}
                onPress={() => handleDisconnect(calendar)}
              >
                <Ionicons name="close" size={18} color="#EF4444" />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  };

  const renderProvider = (provider: typeof PROVIDERS[0]) => {
    const isConnecting = connectingProvider === provider.id;
    const connected = isProviderConnected(provider.id);
    const calendars = getConnectedCalendarsForProvider(provider.id);

    return (
      <View key={provider.id} style={styles.providerSection}>
        <View style={styles.providerHeader}>
          <View style={[styles.providerIcon, { backgroundColor: provider.color + '20' }]}>
            <Ionicons name={provider.icon as any} size={24} color={provider.color} />
          </View>
          <View style={styles.providerInfo}>
            <Text style={styles.providerName}>{provider.name}</Text>
            <Text style={styles.providerDescription}>{provider.description}</Text>
          </View>
          {connected ? (
            <View style={styles.connectedBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
              <Text style={styles.connectedText}>Connected</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.connectBtn, isConnecting && styles.connectBtnDisabled]}
              onPress={() => handleConnect(provider.id)}
              disabled={isConnecting}
            >
              {isConnecting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="add" size={18} color="#FFFFFF" />
                  <Text style={styles.connectBtnText}>Connect</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {calendars.length > 0 && (
          <View style={styles.connectedCalendars}>
            {calendars.map(renderConnectedCalendar)}
            <TouchableOpacity
              style={styles.addAnotherBtn}
              onPress={() => handleConnect(provider.id)}
            >
              <Ionicons name="add-circle-outline" size={18} color="#8B5CF6" />
              <Text style={styles.addAnotherText}>Add another account</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Calendar Sync</Text>
          <Text style={styles.headerSubtitle}>
            {connectedCalendars.length} calendar{connectedCalendars.length !== 1 ? 's' : ''} connected
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8B5CF6" />
        }
      >
        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle" size={20} color="#8B5CF6" />
          <Text style={styles.infoText}>
            Connect your external calendars to sync events and appointments. Changes sync both ways.
          </Text>
        </View>

        {/* Providers */}
        {calendarsLoading && connectedCalendars.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#8B5CF6" />
            <Text style={styles.loadingText}>Loading calendars...</Text>
          </View>
        ) : (
          <View style={styles.providersList}>
            {PROVIDERS.map(renderProvider)}
          </View>
        )}

        {/* Sync Settings */}
        <View style={styles.settingsSection}>
          <Text style={styles.settingsTitle}>Sync Settings</Text>

          <TouchableOpacity style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Auto-sync</Text>
              <Text style={styles.settingDescription}>
                Automatically sync every 15 minutes
              </Text>
            </View>
            <View style={[styles.toggle, styles.toggleActive]}>
              <View style={[styles.toggleDot, styles.toggleDotActive]} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Two-way sync</Text>
              <Text style={styles.settingDescription}>
                Push SystemsF1RST events to external calendars
              </Text>
            </View>
            <View style={[styles.toggle, styles.toggleActive]}>
              <View style={[styles.toggleDot, styles.toggleDotActive]} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Sync reminders</Text>
              <Text style={styles.settingDescription}>
                Include event reminders when syncing
              </Text>
            </View>
            <View style={styles.toggle}>
              <View style={styles.toggleDot} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Help Section */}
        <View style={styles.helpSection}>
          <Text style={styles.helpTitle}>Need help?</Text>
          <Text style={styles.helpText}>
            If you're having trouble connecting your calendar, make sure you:
          </Text>
          <View style={styles.helpList}>
            <Text style={styles.helpItem}>1. Allow access to your calendar when prompted</Text>
            <Text style={styles.helpItem}>2. Use the correct account credentials</Text>
            <Text style={styles.helpItem}>3. Have an active internet connection</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  backBtn: { padding: 8 },
  headerCenter: { flex: 1, marginLeft: 12 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#FFFFFF' },
  headerSubtitle: { fontSize: 14, color: '#94A3B8' },

  content: { flex: 1 },

  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#8B5CF620',
    margin: 16,
    padding: 14,
    borderRadius: 12,
  },
  infoText: { flex: 1, fontSize: 14, color: '#C4B5FD', marginLeft: 10, lineHeight: 20 },

  loadingContainer: { alignItems: 'center', paddingTop: 60 },
  loadingText: { color: '#94A3B8', marginTop: 12 },

  providersList: { paddingHorizontal: 16 },

  providerSection: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  providerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  providerIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerInfo: { flex: 1, marginLeft: 14 },
  providerName: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  providerDescription: { fontSize: 13, color: '#94A3B8', marginTop: 2 },

  connectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#22C55E20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  connectedText: { fontSize: 13, color: '#22C55E', fontWeight: '500', marginLeft: 4 },

  connectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  connectBtnDisabled: { opacity: 0.6 },
  connectBtnText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14, marginLeft: 4 },

  connectedCalendars: {
    borderTopWidth: 1,
    borderTopColor: '#334155',
    padding: 12,
  },
  connectedCalendarCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  calendarColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  calendarInfo: { flex: 1, marginLeft: 12 },
  calendarName: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
  calendarEmail: { fontSize: 12, color: '#64748B', marginTop: 2 },
  lastSynced: { fontSize: 11, color: '#64748B', marginTop: 4 },
  primaryBadge: { color: '#8B5CF6', fontWeight: '500' },

  calendarActions: { flexDirection: 'row', alignItems: 'center' },
  syncBtn: {
    padding: 8,
    marginRight: 4,
  },
  disconnectBtn: {
    padding: 8,
  },

  addAnotherBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  addAnotherText: { color: '#8B5CF6', fontSize: 14, fontWeight: '500', marginLeft: 6 },

  settingsSection: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
  },
  settingsTitle: { fontSize: 16, fontWeight: '600', color: '#FFFFFF', marginBottom: 16 },

  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  settingInfo: { flex: 1 },
  settingLabel: { fontSize: 15, fontWeight: '500', color: '#FFFFFF' },
  settingDescription: { fontSize: 13, color: '#64748B', marginTop: 2 },

  toggle: {
    width: 44,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#334155',
    padding: 2,
    justifyContent: 'center',
  },
  toggleActive: { backgroundColor: '#8B5CF6' },
  toggleDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#64748B',
  },
  toggleDotActive: {
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-end',
  },

  helpSection: {
    marginHorizontal: 16,
    marginBottom: 40,
    padding: 16,
  },
  helpTitle: { fontSize: 16, fontWeight: '600', color: '#FFFFFF', marginBottom: 8 },
  helpText: { fontSize: 14, color: '#94A3B8', lineHeight: 20 },
  helpList: { marginTop: 12 },
  helpItem: { fontSize: 13, color: '#64748B', lineHeight: 24 },
});
