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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useProjectsStore, Project, ProjectStatus } from '../../stores';

const statusConfig: Record<ProjectStatus, { label: string; color: string; bg: string }> = {
  planning: { label: 'Planning', color: '#8B5CF6', bg: '#8B5CF620' },
  active: { label: 'Active', color: '#10B981', bg: '#10B98120' },
  on_hold: { label: 'On Hold', color: '#F59E0B', bg: '#F59E0B20' },
  completed: { label: 'Completed', color: '#3B82F6', bg: '#3B82F620' },
  cancelled: { label: 'Cancelled', color: '#EF4444', bg: '#EF444420' },
};

function ProjectCard({ project, onPress }: { project: Project; onPress: () => void }) {
  const status = statusConfig[project.status];
  const progress = project.progress || 0;

  return (
    <TouchableOpacity style={styles.projectCard} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.projectHeader}>
        <View style={[styles.projectColorBar, { backgroundColor: project.color || '#8B5CF6' }]} />
        <View style={styles.projectTitleContainer}>
          <Text style={styles.projectName}>{project.name}</Text>
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>
      </View>

      {project.description && (
        <Text style={styles.projectDescription} numberOfLines={2}>
          {project.description}
        </Text>
      )}

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Progress</Text>
          <Text style={styles.progressValue}>{progress}%</Text>
        </View>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${progress}%`, backgroundColor: project.color || '#8B5CF6' },
            ]}
          />
        </View>
      </View>

      {/* Stats */}
      <View style={styles.projectStats}>
        <View style={styles.stat}>
          <Ionicons name="checkmark-circle" size={16} color="#10B981" />
          <Text style={styles.statText}>
            {project.completedTaskCount}/{project.taskCount} tasks
          </Text>
        </View>
        <View style={styles.stat}>
          <Ionicons name="people" size={16} color="#64748B" />
          <Text style={styles.statText}>{project.teamMembers.length} members</Text>
        </View>
        {project.endDate && (
          <View style={styles.stat}>
            <Ionicons name="calendar" size={16} color="#64748B" />
            <Text style={styles.statText}>
              {new Date(project.endDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </Text>
          </View>
        )}
      </View>

      {/* Tags */}
      {project.tags && project.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {project.tags.slice(0, 3).map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
          {project.tags.length > 3 && (
            <Text style={styles.moreTags}>+{project.tags.length - 3}</Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function ProjectsScreen() {
  const { projects, metrics, projectsLoading, fetchProjects, fetchMetrics } = useProjectsStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<ProjectStatus | 'all'>('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchProjects();
    fetchMetrics();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProjects();
    await fetchMetrics();
    setRefreshing(false);
  };

  const filteredProjects = projects.filter((project) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        project.name.toLowerCase().includes(query) ||
        project.description?.toLowerCase().includes(query) ||
        project.tags?.some((t) => t.toLowerCase().includes(query));
      if (!matchesSearch) return false;
    }

    // Status filter
    if (selectedStatus !== 'all' && project.status !== selectedStatus) {
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
        <Text style={styles.headerTitle}>Projects</Text>
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
            placeholder="Search projects..."
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

      {/* Status Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        <TouchableOpacity
          style={[styles.filterChip, selectedStatus === 'all' && styles.filterChipActive]}
          onPress={() => setSelectedStatus('all')}
        >
          <Text
            style={[styles.filterChipText, selectedStatus === 'all' && styles.filterChipTextActive]}
          >
            All
          </Text>
        </TouchableOpacity>
        {(Object.keys(statusConfig) as ProjectStatus[]).map((status) => (
          <TouchableOpacity
            key={status}
            style={[styles.filterChip, selectedStatus === status && styles.filterChipActive]}
            onPress={() => setSelectedStatus(status)}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedStatus === status && styles.filterChipTextActive,
              ]}
            >
              {statusConfig[status].label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Ionicons name="folder" size={20} color="#8B5CF6" />
          <Text style={styles.statValue}>{metrics?.totalProjects || projects.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="play-circle" size={20} color="#10B981" />
          <Text style={[styles.statValue, { color: '#10B981' }]}>
            {metrics?.activeProjects || 0}
          </Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="checkmark-done" size={20} color="#3B82F6" />
          <Text style={[styles.statValue, { color: '#3B82F6' }]}>
            {metrics?.completedTasks || 0}
          </Text>
          <Text style={styles.statLabel}>Tasks Done</Text>
        </View>
      </View>

      {/* Project List */}
      {projectsLoading ? (
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
          {filteredProjects.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="folder-open-outline" size={48} color="#64748B" />
              <Text style={styles.emptyText}>No projects found</Text>
            </View>
          ) : (
            filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onPress={() => router.push(`/(crm)/project-detail?id=${project.id}`)}
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
    gap: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  projectCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  projectHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  projectColorBar: {
    width: 4,
    height: 40,
    borderRadius: 2,
  },
  projectTitleContainer: {
    flex: 1,
  },
  projectName: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  projectDescription: {
    color: '#94A3B8',
    fontSize: 14,
    marginTop: 12,
    lineHeight: 20,
  },
  progressContainer: {
    marginTop: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    color: '#64748B',
    fontSize: 12,
  },
  progressValue: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#0F172A',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  projectStats: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 12,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    color: '#94A3B8',
    fontSize: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
  },
  tag: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    color: '#94A3B8',
    fontSize: 11,
  },
  moreTags: {
    color: '#64748B',
    fontSize: 11,
    alignSelf: 'center',
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
