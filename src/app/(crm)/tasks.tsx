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
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useProjectsStore, Task, TaskStatus, TaskPriority } from '../../stores';

const statusConfig: Record<TaskStatus, { label: string; color: string; bg: string; icon: string }> = {
  todo: { label: 'To Do', color: '#64748B', bg: '#64748B20', icon: 'ellipse-outline' },
  in_progress: { label: 'In Progress', color: '#3B82F6', bg: '#3B82F620', icon: 'play-circle' },
  review: { label: 'Review', color: '#F59E0B', bg: '#F59E0B20', icon: 'eye' },
  done: { label: 'Done', color: '#10B981', bg: '#10B98120', icon: 'checkmark-circle' },
};

const priorityConfig: Record<TaskPriority, { label: string; color: string }> = {
  low: { label: 'Low', color: '#64748B' },
  medium: { label: 'Medium', color: '#3B82F6' },
  high: { label: 'High', color: '#F59E0B' },
  urgent: { label: 'Urgent', color: '#EF4444' },
};

function TaskCard({
  task,
  onPress,
  onStatusChange,
}: {
  task: Task;
  onPress: () => void;
  onStatusChange: (newStatus: TaskStatus) => void;
}) {
  const status = statusConfig[task.status];
  const priority = priorityConfig[task.priority];
  const isOverdue =
    task.dueDate && task.status !== 'done' && new Date(task.dueDate) < new Date();

  return (
    <TouchableOpacity style={styles.taskCard} onPress={onPress} activeOpacity={0.7}>
      <TouchableOpacity
        style={[styles.statusIcon, { backgroundColor: status.bg }]}
        onPress={() => {
          const statuses: TaskStatus[] = ['todo', 'in_progress', 'review', 'done'];
          const currentIndex = statuses.indexOf(task.status);
          const nextStatus = statuses[(currentIndex + 1) % statuses.length];
          onStatusChange(nextStatus);
        }}
      >
        <Ionicons name={status.icon as any} size={20} color={status.color} />
      </TouchableOpacity>

      <View style={styles.taskContent}>
        <View style={styles.taskHeader}>
          <Text
            style={[styles.taskTitle, task.status === 'done' && styles.taskTitleDone]}
            numberOfLines={2}
          >
            {task.title}
          </Text>
          <View style={[styles.priorityBadge, { backgroundColor: `${priority.color}20` }]}>
            <Text style={[styles.priorityText, { color: priority.color }]}>{priority.label}</Text>
          </View>
        </View>

        {task.description && (
          <Text style={styles.taskDescription} numberOfLines={1}>
            {task.description}
          </Text>
        )}

        <View style={styles.taskMeta}>
          {task.projectName && (
            <View style={styles.metaItem}>
              <Ionicons name="folder" size={12} color="#64748B" />
              <Text style={styles.metaText}>{task.projectName}</Text>
            </View>
          )}
          {task.assigneeName && (
            <View style={styles.metaItem}>
              <Ionicons name="person" size={12} color="#64748B" />
              <Text style={styles.metaText}>{task.assigneeName}</Text>
            </View>
          )}
          {task.dueDate && (
            <View style={styles.metaItem}>
              <Ionicons
                name="calendar"
                size={12}
                color={isOverdue ? '#EF4444' : '#64748B'}
              />
              <Text style={[styles.metaText, isOverdue && styles.overdueText]}>
                {new Date(task.dueDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
            </View>
          )}
        </View>

        {/* Subtasks progress */}
        {task.subtasks && task.subtasks.length > 0 && (
          <View style={styles.subtasksProgress}>
            <View style={styles.subtasksBar}>
              <View
                style={[
                  styles.subtasksFill,
                  {
                    width: `${(task.subtasks.filter((s) => s.completed).length / task.subtasks.length) * 100}%`,
                  },
                ]}
              />
            </View>
            <Text style={styles.subtasksText}>
              {task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length} subtasks
            </Text>
          </View>
        )}

        {/* Tags */}
        {task.tags && task.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {task.tags.slice(0, 3).map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function TasksScreen() {
  const { projectId } = useLocalSearchParams<{ projectId?: string }>();
  const { tasks, projects, tasksLoading, fetchTasks, fetchProjects, moveTask } = useProjectsStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus | 'all'>('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchTasks(projectId ? { projectId } : undefined);
    fetchProjects();
  }, [projectId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTasks(projectId ? { projectId } : undefined);
    setRefreshing(false);
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    await moveTask(taskId, newStatus);
  };

  const filteredTasks = tasks.filter((task) => {
    // Project filter (if projectId is provided)
    if (projectId && task.projectId !== projectId) {
      return false;
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        task.title.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query) ||
        task.tags?.some((t) => t.toLowerCase().includes(query));
      if (!matchesSearch) return false;
    }

    // Status filter
    if (selectedStatus !== 'all' && task.status !== selectedStatus) {
      return false;
    }

    return true;
  });

  const project = projectId ? projects.find((p) => p.id === projectId) : null;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Tasks</Text>
          {project && <Text style={styles.headerSubtitle}>{project.name}</Text>}
        </View>
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
            placeholder="Search tasks..."
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
            All ({tasks.length})
          </Text>
        </TouchableOpacity>
        {(Object.keys(statusConfig) as TaskStatus[]).map((status) => {
          const count = tasks.filter((t) => t.status === status).length;
          return (
            <TouchableOpacity
              key={status}
              style={[styles.filterChip, selectedStatus === status && styles.filterChipActive]}
              onPress={() => setSelectedStatus(status)}
            >
              <Ionicons
                name={statusConfig[status].icon as any}
                size={14}
                color={selectedStatus === status ? '#FFFFFF' : statusConfig[status].color}
              />
              <Text
                style={[
                  styles.filterChipText,
                  selectedStatus === status && styles.filterChipTextActive,
                ]}
              >
                {statusConfig[status].label} ({count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Task List */}
      {tasksLoading ? (
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
          {filteredTasks.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="checkbox-outline" size={48} color="#64748B" />
              <Text style={styles.emptyText}>No tasks found</Text>
              <TouchableOpacity style={styles.emptyButton}>
                <Ionicons name="add" size={20} color="#FFFFFF" />
                <Text style={styles.emptyButtonText}>Create Task</Text>
              </TouchableOpacity>
            </View>
          ) : (
            filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onPress={() => console.log('Open task', task.id)}
                onStatusChange={(newStatus) => handleStatusChange(task.id, newStatus)}
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
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#1E293B',
    borderRadius: 20,
    marginRight: 8,
    gap: 6,
  },
  filterChipActive: {
    backgroundColor: '#8B5CF6',
  },
  filterChipText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  listContainer: {
    flex: 1,
    marginTop: 12,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  taskCard: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    gap: 12,
  },
  statusIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskContent: {
    flex: 1,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  taskTitle: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  taskTitleDone: {
    color: '#64748B',
    textDecorationLine: 'line-through',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
  },
  taskDescription: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 4,
  },
  taskMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    color: '#64748B',
    fontSize: 12,
  },
  overdueText: {
    color: '#EF4444',
  },
  subtasksProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  subtasksBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#0F172A',
    borderRadius: 2,
    overflow: 'hidden',
  },
  subtasksFill: {
    height: '100%',
    backgroundColor: '#8B5CF6',
    borderRadius: 2,
  },
  subtasksText: {
    color: '#64748B',
    fontSize: 11,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  tag: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  tagText: {
    color: '#94A3B8',
    fontSize: 10,
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
    gap: 12,
  },
  emptyText: {
    color: '#64748B',
    fontSize: 16,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
    marginTop: 8,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
