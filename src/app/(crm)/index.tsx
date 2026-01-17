// CRM Dashboard Screen
import { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCrmStore } from '../../stores/crmStore';
import { ConnectionStatus } from '../../components/ConnectionStatus';

export default function CrmDashboard() {
  const { leads, contacts, deals, fetchLeads, fetchContacts, fetchDeals, leadsLoading, contactsLoading, dealsLoading } = useCrmStore();

  useEffect(() => {
    fetchLeads();
    fetchContacts();
    fetchDeals();
  }, []);

  const isLoading = leadsLoading || contactsLoading || dealsLoading;

  // Calculate metrics
  const newLeads = leads.filter(l => l.status === 'new').length;
  const totalValue = deals.reduce((sum, d) => sum + (d.value || 0), 0);
  const openDeals = deals.filter(d => d.stage !== 'won' && d.stage !== 'lost').length;

  const stats = [
    { label: 'Total Leads', value: leads.length, icon: 'flash', color: '#8B5CF6' },
    { label: 'New Leads', value: newLeads, icon: 'flash-outline', color: '#F59E0B' },
    { label: 'Contacts', value: contacts.length, icon: 'people', color: '#10B981' },
    { label: 'Open Deals', value: openDeals, icon: 'briefcase', color: '#3B82F6' },
  ];

  const quickActions = [
    { label: 'Add Lead', icon: 'add-circle', route: '/(crm)/leads', color: '#8B5CF6' },
    { label: 'Add Contact', icon: 'person-add', route: '/(crm)/contacts', color: '#10B981' },
    { label: 'New Deal', icon: 'cash', route: '/(crm)/deals', color: '#3B82F6' },
    { label: 'AI Assistant', icon: 'sparkles', route: '/(crm)/ai', color: '#F59E0B' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.title}>CRM Dashboard</Text>
            <ConnectionStatus />
          </View>
          <Text style={styles.subtitle}>Manage your sales pipeline</Text>
        </View>

        {/* Loading */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#8B5CF6" />
          </View>
        )}

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {stats.map((stat, index) => (
            <View key={index} style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: stat.color + '20' }]}>
                <Ionicons name={stat.icon as any} size={24} color={stat.color} />
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Pipeline Value */}
        <View style={styles.pipelineCard}>
          <Text style={styles.pipelineLabel}>Pipeline Value</Text>
          <Text style={styles.pipelineValue}>
            ${totalValue.toLocaleString()}
          </Text>
          <View style={styles.pipelineBar}>
            <View style={[styles.pipelineProgress, { width: '65%' }]} />
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={styles.actionCard}
              onPress={() => router.push(action.route as any)}
            >
              <View style={[styles.actionIcon, { backgroundColor: action.color + '20' }]}>
                <Ionicons name={action.icon as any} size={28} color={action.color} />
              </View>
              <Text style={styles.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Leads */}
        <Text style={styles.sectionTitle}>Recent Leads</Text>
        <View style={styles.recentList}>
          {leads.slice(0, 5).map((lead) => (
            <TouchableOpacity key={lead.id} style={styles.recentItem}>
              <View style={styles.recentAvatar}>
                <Text style={styles.recentAvatarText}>
                  {lead.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.recentInfo}>
                <Text style={styles.recentName}>{lead.name}</Text>
                <Text style={styles.recentDetail}>{lead.email}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(lead.status) + '20' }]}>
                <Text style={[styles.statusText, { color: getStatusColor(lead.status) }]}>
                  {lead.status}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
          {leads.length === 0 && !isLoading && (
            <Text style={styles.emptyText}>No leads yet</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'new': return '#8B5CF6';
    case 'contacted': return '#3B82F6';
    case 'qualified': return '#10B981';
    case 'converted': return '#22C55E';
    case 'lost': return '#EF4444';
    default: return '#64748B';
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 16,
    color: '#94A3B8',
    marginTop: 4,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 15,
    marginTop: 10,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    margin: '1%',
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 4,
  },
  pipelineCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginTop: 15,
  },
  pipelineLabel: {
    fontSize: 14,
    color: '#94A3B8',
  },
  pipelineValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 8,
  },
  pipelineBar: {
    height: 8,
    backgroundColor: '#334155',
    borderRadius: 4,
    marginTop: 16,
  },
  pipelineProgress: {
    height: '100%',
    backgroundColor: '#8B5CF6',
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 12,
  },
  actionsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 15,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    margin: 5,
    alignItems: 'center',
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
    textAlign: 'center',
  },
  recentList: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  recentAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentAvatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  recentInfo: {
    flex: 1,
    marginLeft: 12,
  },
  recentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  recentDetail: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  emptyText: {
    color: '#64748B',
    textAlign: 'center',
    paddingVertical: 20,
  },
});
