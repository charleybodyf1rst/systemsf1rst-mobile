import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../lib/api';

interface ReportData {
  total_hours: number;
  regular_hours: number;
  overtime_hours: number;
  total_entries: number;
  approved_entries: number;
  pending_entries: number;
  employees_worked: number;
}

type DateRange = 'today' | 'week' | 'month';

export default function ReportsScreen() {
  const [dateRange, setDateRange] = useState<DateRange>('week');
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchReportData();
  }, [dateRange]);

  const fetchReportData = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/time-clock/reports', {
        params: { range: dateRange },
      });

      setReportData(response.data);
    } catch (error) {
      console.error('Failed to fetch report data:', error);
      // Set mock data for demo
      setReportData({
        total_hours: dateRange === 'today' ? 32.5 : dateRange === 'week' ? 245.8 : 980.2,
        regular_hours: dateRange === 'today' ? 30.0 : dateRange === 'week' ? 220.5 : 880.0,
        overtime_hours: dateRange === 'today' ? 2.5 : dateRange === 'week' ? 25.3 : 100.2,
        total_entries: dateRange === 'today' ? 8 : dateRange === 'week' ? 45 : 180,
        approved_entries: dateRange === 'today' ? 5 : dateRange === 'week' ? 38 : 165,
        pending_entries: dateRange === 'today' ? 3 : dateRange === 'week' ? 7 : 15,
        employees_worked: dateRange === 'today' ? 6 : dateRange === 'week' ? 12 : 15,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getRangeLabel = () => {
    switch (dateRange) {
      case 'today':
        return 'Today';
      case 'week':
        return 'This Week';
      case 'month':
        return 'This Month';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Reports</Text>
        <Text style={styles.subtitle}>Time tracking analytics</Text>
      </View>

      {/* Date Range Selector */}
      <View style={styles.rangeSelector}>
        {(['today', 'week', 'month'] as DateRange[]).map((range) => (
          <TouchableOpacity
            key={range}
            style={[styles.rangeButton, dateRange === range && styles.rangeButtonActive]}
            onPress={() => setDateRange(range)}
          >
            <Text
              style={[styles.rangeButtonText, dateRange === range && styles.rangeButtonTextActive]}
            >
              {range === 'today' ? 'Today' : range === 'week' ? 'Week' : 'Month'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color="#8B5CF6" style={styles.loader} />
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Hours Summary */}
          <View style={styles.summaryCard}>
            <Text style={styles.cardTitle}>Hours Summary - {getRangeLabel()}</Text>
            <View style={styles.hoursGrid}>
              <View style={styles.hoursItem}>
                <Text style={styles.hoursValue}>{reportData?.total_hours?.toFixed(1)}h</Text>
                <Text style={styles.hoursLabel}>Total Hours</Text>
              </View>
              <View style={styles.hoursItem}>
                <Text style={[styles.hoursValue, { color: '#10B981' }]}>
                  {reportData?.regular_hours?.toFixed(1)}h
                </Text>
                <Text style={styles.hoursLabel}>Regular</Text>
              </View>
              <View style={styles.hoursItem}>
                <Text style={[styles.hoursValue, { color: '#F59E0B' }]}>
                  {reportData?.overtime_hours?.toFixed(1)}h
                </Text>
                <Text style={styles.hoursLabel}>Overtime</Text>
              </View>
            </View>
          </View>

          {/* Entries Summary */}
          <View style={styles.entriesCard}>
            <Text style={styles.cardTitle}>Time Entries</Text>
            <View style={styles.entriesRow}>
              <View style={styles.entryItem}>
                <View style={[styles.entryIcon, { backgroundColor: '#8B5CF620' }]}>
                  <Ionicons name="list" size={24} color="#8B5CF6" />
                </View>
                <Text style={styles.entryValue}>{reportData?.total_entries}</Text>
                <Text style={styles.entryLabel}>Total</Text>
              </View>
              <View style={styles.entryItem}>
                <View style={[styles.entryIcon, { backgroundColor: '#10B98120' }]}>
                  <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                </View>
                <Text style={styles.entryValue}>{reportData?.approved_entries}</Text>
                <Text style={styles.entryLabel}>Approved</Text>
              </View>
              <View style={styles.entryItem}>
                <View style={[styles.entryIcon, { backgroundColor: '#F59E0B20' }]}>
                  <Ionicons name="time" size={24} color="#F59E0B" />
                </View>
                <Text style={styles.entryValue}>{reportData?.pending_entries}</Text>
                <Text style={styles.entryLabel}>Pending</Text>
              </View>
            </View>
          </View>

          {/* Workforce */}
          <View style={styles.workforceCard}>
            <Text style={styles.cardTitle}>Workforce</Text>
            <View style={styles.workforceRow}>
              <View style={styles.workforceIcon}>
                <Ionicons name="people" size={32} color="#8B5CF6" />
              </View>
              <View style={styles.workforceInfo}>
                <Text style={styles.workforceValue}>{reportData?.employees_worked}</Text>
                <Text style={styles.workforceLabel}>Employees worked {getRangeLabel().toLowerCase()}</Text>
              </View>
            </View>
          </View>

          {/* Export Options */}
          <View style={styles.exportCard}>
            <Text style={styles.cardTitle}>Export Report</Text>
            <View style={styles.exportButtons}>
              <TouchableOpacity style={styles.exportButton}>
                <Ionicons name="document-text" size={24} color="#3B82F6" />
                <Text style={styles.exportButtonText}>PDF</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.exportButton}>
                <Ionicons name="grid" size={24} color="#10B981" />
                <Text style={styles.exportButtonText}>Excel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.exportButton}>
                <Ionicons name="mail" size={24} color="#8B5CF6" />
                <Text style={styles.exportButtonText}>Email</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.actionsCard}>
            <Text style={styles.cardTitle}>Quick Actions</Text>
            <TouchableOpacity style={styles.actionItem}>
              <View style={styles.actionIcon}>
                <Ionicons name="calendar" size={20} color="#8B5CF6" />
              </View>
              <Text style={styles.actionText}>View Detailed Breakdown</Text>
              <Ionicons name="chevron-forward" size={20} color="#64748B" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionItem}>
              <View style={styles.actionIcon}>
                <Ionicons name="person" size={20} color="#10B981" />
              </View>
              <Text style={styles.actionText}>Employee Hours Report</Text>
              <Ionicons name="chevron-forward" size={20} color="#64748B" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionItem}>
              <View style={styles.actionIcon}>
                <Ionicons name="location" size={20} color="#F59E0B" />
              </View>
              <Text style={styles.actionText}>Location Activity Report</Text>
              <Ionicons name="chevron-forward" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>
        </ScrollView>
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
  rangeSelector: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  rangeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  rangeButtonActive: {
    backgroundColor: '#8B5CF6',
  },
  rangeButtonText: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
  },
  rangeButtonTextActive: {
    color: '#fff',
  },
  loader: {
    marginTop: 48,
  },
  content: {
    flex: 1,
  },
  summaryCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 16,
  },
  hoursGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  hoursItem: {
    alignItems: 'center',
  },
  hoursValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#8B5CF6',
  },
  hoursLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
  },
  entriesCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  entriesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  entryItem: {
    alignItems: 'center',
  },
  entryIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  entryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },
  entryLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
  },
  workforceCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  workforceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  workforceIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#8B5CF620',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  workforceInfo: {
    flex: 1,
  },
  workforceValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },
  workforceLabel: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 4,
  },
  exportCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  exportButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  exportButton: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#0F172A',
    borderRadius: 12,
    minWidth: 80,
  },
  exportButtonText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 8,
  },
  actionsCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    marginBottom: 40,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionText: {
    flex: 1,
    fontSize: 14,
    color: '#F8FAFC',
  },
});
