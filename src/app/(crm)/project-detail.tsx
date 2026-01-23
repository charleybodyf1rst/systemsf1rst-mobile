import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useProjectsStore, ProjectStatus, TaskStatus } from '../../stores';

const statusConfig: Record<ProjectStatus, { label: string; color: string; bg: string }> = {
  planning: { label: 'Planning', color: '#8B5CF6', bg: '#8B5CF620' },
  active: { label: 'Active', color: '#10B981', bg: '#10B98120' },
  on_hold: { label: 'On Hold', color: '#F59E0B', bg: '#F59E0B20' },
  completed: { label: 'Completed', color: '#3B82F6', bg: '#3B82F620' },
  cancelled: { label: 'Cancelled', color: '#EF4444', bg: '#EF444420' },
};

const taskStatusConfig: Record<TaskStatus, { label: string; color: string }> = {
  todo: { label: 'To Do', color: '#64748B' },
  in_progress: { label: 'In Progress', color: '#3B82F6' },
  review: { label: 'Review', color: '#F59E0B' },
  done: { label: 'Done', color: '#10B981' },
};

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { selectedProject, tasks, fetchProject, fetchTasks, setSelectedProject } =
    useProjectsStore();

  useEffect(() => {
    if (id) {
      fetchProject(id);
      fetchTasks({ projectId: id });
    }
    return () => setSelectedProject(null);
  }, [id]);

  const project = selectedProject;

  if (!project) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
        </View>
      </SafeAreaView>
    );
  }

  const status = statusConfig[project.status];
  const projectTasks = tasks.filter((t) => t.projectId === id);

  // Group tasks by status
  const tasksByStatus = projectTasks.reduce(
    (acc, task) => {
      acc[task.status] = [...(acc[task.status] || []), task];
      return acc;
    },
    {} as Record<TaskStatus, typeof tasks>
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Project Details</Text>
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-horizontal" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Project Header Card */}
        <View style={styles.projectCard}>
          <View style={styles.projectHeader}>
            <View style={[styles.colorDot, { backgroundColor: project.color || '#8B5CF6' }]} />
            <View style={styles.projectTitleContainer}>
              <Text style={styles.projectName}>{project.name}</Text>
              <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
              </View>
            </View>
          </View>

          {project.description && (
            <Text style={styles.projectDescription}>{project.description}</Text>
          )}

          {/* Progress */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Overall Progress</Text>
              <Text style={styles.progressValue}>{project.progress}%</Text>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${project.progress}%`,
                    backgroundColor: project.color || '#8B5CF6',
                  },
                ]}
              />
            </View>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="calendar" size={20} color="#8B5CF6" />
            <Text style={styles.statValue}>
              {new Date(project.startDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </Text>
            <Text style={styles.statLabel}>Start Date</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="flag" size={20} color="#EF4444" />
            <Text style={styles.statValue}>
              {project.endDate
                ? new Date(project.endDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })
                : 'TBD'}
            </Text>
            <Text style={styles.statLabel}>Due Date</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="checkmark-done" size={20} color="#10B981" />
            <Text style={styles.statValue}>
              {project.completedTaskCount}/{project.taskCount}
            </Text>
            <Text style={styles.statLabel}>Tasks</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="people" size={20} color="#3B82F6" />
            <Text style={styles.statValue}>{project.teamMembers.length}</Text>
            <Text style={styles.statLabel}>Members</Text>
          </View>
        </View>

        {/* Budget Section */}
        {(project.budget || project.spent) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Budget</Text>
            <View style={styles.budgetCard}>
              <View style={styles.budgetRow}>
                <Text style={styles.budgetLabel}>Total Budget</Text>
                <Text style={styles.budgetValue}>{formatCurrency(project.budget || 0)}</Text>
              </View>
              <View style={styles.budgetRow}>
                <Text style={styles.budgetLabel}>Spent</Text>
                <Text style={[styles.budgetValue, { color: '#F59E0B' }]}>
                  {formatCurrency(project.spent || 0)}
                </Text>
              </View>
              <View style={styles.budgetRow}>
                <Text style={styles.budgetLabel}>Remaining</Text>
                <Text style={[styles.budgetValue, { color: '#10B981' }]}>
                  {formatCurrency((project.budget || 0) - (project.spent || 0))}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Team Members */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Team Members</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.teamContainer}>
              {project.teamMembers.map((member) => {
                const initials = member.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase();
                return (
                  <View key={member.id} style={styles.memberCard}>
                    {member.avatar ? (
                      <Image source={{ uri: member.avatar }} style={styles.memberAvatar} />
                    ) : (
                      <View style={styles.memberAvatarPlaceholder}>
                        <Text style={styles.memberInitials}>{initials}</Text>
                      </View>
                    )}
                    <Text style={styles.memberName} numberOfLines={1}>
                      {member.name}
                    </Text>
                    <Text style={styles.memberRole}>{member.role}</Text>
                  </View>
                );
              })}
              <TouchableOpacity style={styles.addMemberCard}>
                <Ionicons name="add" size={24} color="#64748B" />
                <Text style={styles.addMemberText}>Add</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>

        {/* Tasks by Status */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Tasks</Text>
            <TouchableOpacity onPress={() => router.push(`/(crm)/tasks?projectId=${id}`)}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {(Object.keys(taskStatusConfig) as TaskStatus[]).map((taskStatus) => {
            const statusTasks = tasksByStatus[taskStatus] || [];
            if (statusTasks.length === 0) return null;

            return (
              <View key={taskStatus} style={styles.taskStatusGroup}>
                <View style={styles.taskStatusHeader}>
                  <View
                    style={[
                      styles.taskStatusDot,
                      { backgroundColor: taskStatusConfig[taskStatus].color },
                    ]}
                  />
                  <Text style={styles.taskStatusLabel}>{taskStatusConfig[taskStatus].label}</Text>
                  <Text style={styles.taskCount}>{statusTasks.length}</Text>
                </View>
                {statusTasks.slice(0, 3).map((task) => (
                  <TouchableOpacity key={task.id} style={styles.taskItem}>
                    <Text style={styles.taskTitle}>{task.title}</Text>
                    {task.assigneeName && (
                      <Text style={styles.taskAssignee}>{task.assigneeName}</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            );
          })}
        </View>

        {/* Tags */}
        {project.tags && project.tags.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tags</Text>
            <View style={styles.tagsContainer}>
              {project.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push(`/(crm)/tasks?projectId=${id}`)}
      >
        <Ionicons name="list" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  moreButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 100,
  },
  projectCard: {
    backgroundColor: '#1E293B',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 16,
    padding: 16,
  },
  projectHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 6,
  },
  projectTitleContainer: {
    flex: 1,
  },
  projectName: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  projectDescription: {
    color: '#94A3B8',
    fontSize: 14,
    marginTop: 16,
    lineHeight: 22,
  },
  progressSection: {
    marginTop: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    color: '#64748B',
    fontSize: 13,
  },
  progressValue: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#0F172A',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 6,
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  statLabel: {
    color: '#64748B',
    fontSize: 11,
  },
  section: {
    marginTop: 24,
    marginHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  viewAllText: {
    color: '#8B5CF6',
    fontSize: 14,
    fontWeight: '500',
  },
  budgetCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  budgetLabel: {
    color: '#64748B',
    fontSize: 14,
  },
  budgetValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  teamContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  memberCard: {
    alignItems: 'center',
    width: 80,
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  memberAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberInitials: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  memberName: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  },
  memberRole: {
    color: '#64748B',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 2,
  },
  addMemberCard: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
    height: 80,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    borderStyle: 'dashed',
  },
  addMemberText: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 4,
  },
  taskStatusGroup: {
    marginBottom: 16,
  },
  taskStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  taskStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  taskStatusLabel: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  taskCount: {
    color: '#64748B',
    fontSize: 12,
  },
  taskItem: {
    backgroundColor: '#1E293B',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  taskTitle: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  taskAssignee: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 4,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    color: '#94A3B8',
    fontSize: 13,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
