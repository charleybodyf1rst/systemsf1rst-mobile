import { create } from 'zustand';
import { api } from '../lib/api';

// Types
export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  startDate: string;
  endDate?: string;
  budget?: number;
  spent?: number;
  progress: number; // 0-100
  managerId?: string;
  managerName?: string;
  teamMembers: TeamMember[];
  taskCount: number;
  completedTaskCount: number;
  tags?: string[];
  color?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
}

export interface Task {
  id: string;
  projectId: string;
  projectName?: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: string;
  assigneeName?: string;
  assigneeAvatar?: string;
  dueDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  tags?: string[];
  subtasks?: SubTask[];
  comments?: TaskComment[];
  attachments?: Attachment[];
  createdAt: string;
  updatedAt: string;
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface TaskComment {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: string;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
}

export interface ProjectMetrics {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
}

interface ProjectsState {
  // State
  projects: Project[];
  tasks: Task[];
  selectedProject: Project | null;
  selectedTask: Task | null;
  metrics: ProjectMetrics | null;

  // Loading states
  projectsLoading: boolean;
  tasksLoading: boolean;

  // Error states
  error: string | null;

  // Project actions
  fetchProjects: (params?: { status?: ProjectStatus }) => Promise<void>;
  fetchProject: (id: string) => Promise<Project | null>;
  createProject: (data: Partial<Project>) => Promise<Project>;
  updateProject: (id: string, data: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;

  // Task actions
  fetchTasks: (params?: { projectId?: string; assigneeId?: string; status?: TaskStatus }) => Promise<void>;
  fetchTask: (id: string) => Promise<Task | null>;
  createTask: (data: Partial<Task>) => Promise<Task>;
  updateTask: (id: string, data: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  moveTask: (taskId: string, newStatus: TaskStatus) => Promise<void>;

  // Subtask actions
  toggleSubtask: (taskId: string, subtaskId: string) => Promise<void>;
  addSubtask: (taskId: string, title: string) => Promise<void>;

  // Comment actions
  addComment: (taskId: string, content: string) => Promise<void>;

  // Metrics
  fetchMetrics: () => Promise<void>;

  // Utility actions
  setSelectedProject: (project: Project | null) => void;
  setSelectedTask: (task: Task | null) => void;
  clearError: () => void;
}

// Mock data
const mockProjects: Project[] = [
  {
    id: '1',
    name: 'Website Redesign',
    description: 'Complete overhaul of the company website with modern design',
    status: 'active',
    startDate: '2024-01-15',
    endDate: '2024-03-30',
    budget: 50000,
    spent: 25000,
    progress: 65,
    managerName: 'John Smith',
    teamMembers: [
      { id: '1', name: 'John Smith', email: 'john@example.com', role: 'Project Manager' },
      { id: '2', name: 'Sarah Johnson', email: 'sarah@example.com', role: 'Designer' },
      { id: '3', name: 'Mike Williams', email: 'mike@example.com', role: 'Developer' },
    ],
    taskCount: 24,
    completedTaskCount: 16,
    tags: ['web', 'design', 'urgent'],
    color: '#3B82F6',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Mobile App Development',
    description: 'Build native mobile application for iOS and Android',
    status: 'active',
    startDate: '2024-02-01',
    endDate: '2024-06-30',
    budget: 100000,
    spent: 30000,
    progress: 30,
    managerName: 'Sarah Johnson',
    teamMembers: [
      { id: '2', name: 'Sarah Johnson', email: 'sarah@example.com', role: 'Project Manager' },
      { id: '4', name: 'Alex Brown', email: 'alex@example.com', role: 'Mobile Developer' },
    ],
    taskCount: 45,
    completedTaskCount: 14,
    tags: ['mobile', 'ios', 'android'],
    color: '#10B981',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'CRM Integration',
    description: 'Integrate new CRM system with existing infrastructure',
    status: 'planning',
    startDate: '2024-03-01',
    budget: 25000,
    progress: 10,
    managerName: 'Mike Williams',
    teamMembers: [
      { id: '3', name: 'Mike Williams', email: 'mike@example.com', role: 'Tech Lead' },
    ],
    taskCount: 12,
    completedTaskCount: 1,
    tags: ['crm', 'integration'],
    color: '#8B5CF6',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const mockTasks: Task[] = [
  {
    id: '1',
    projectId: '1',
    projectName: 'Website Redesign',
    title: 'Design homepage wireframes',
    description: 'Create wireframes for the new homepage layout',
    status: 'done',
    priority: 'high',
    assigneeName: 'Sarah Johnson',
    dueDate: '2024-02-01',
    estimatedHours: 8,
    actualHours: 10,
    tags: ['design'],
    subtasks: [
      { id: '1', title: 'Research competitors', completed: true },
      { id: '2', title: 'Create low-fidelity wireframes', completed: true },
      { id: '3', title: 'Get feedback', completed: true },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    projectId: '1',
    projectName: 'Website Redesign',
    title: 'Implement responsive navigation',
    description: 'Build mobile-first responsive navigation component',
    status: 'in_progress',
    priority: 'high',
    assigneeName: 'Mike Williams',
    dueDate: '2024-02-15',
    estimatedHours: 16,
    tags: ['development', 'frontend'],
    subtasks: [
      { id: '1', title: 'Create component structure', completed: true },
      { id: '2', title: 'Add animations', completed: false },
      { id: '3', title: 'Test on all devices', completed: false },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    projectId: '1',
    projectName: 'Website Redesign',
    title: 'Setup CI/CD pipeline',
    description: 'Configure automated deployment pipeline',
    status: 'todo',
    priority: 'medium',
    dueDate: '2024-02-20',
    estimatedHours: 4,
    tags: ['devops'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '4',
    projectId: '2',
    projectName: 'Mobile App Development',
    title: 'Design app icons',
    status: 'review',
    priority: 'medium',
    assigneeName: 'Sarah Johnson',
    dueDate: '2024-02-10',
    tags: ['design', 'mobile'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '5',
    projectId: '2',
    projectName: 'Mobile App Development',
    title: 'Implement authentication',
    status: 'in_progress',
    priority: 'urgent',
    assigneeName: 'Alex Brown',
    dueDate: '2024-02-18',
    estimatedHours: 24,
    tags: ['development', 'security'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const useProjectsStore = create<ProjectsState>((set, get) => ({
  // Initial state
  projects: [],
  tasks: [],
  selectedProject: null,
  selectedTask: null,
  metrics: null,
  projectsLoading: false,
  tasksLoading: false,
  error: null,

  // Project actions
  fetchProjects: async (params) => {
    set({ projectsLoading: true, error: null });
    try {
      // TODO: Replace with real API call
      // const response = await api.get('/projects', { params });
      await new Promise(resolve => setTimeout(resolve, 500));

      let filtered = [...mockProjects];
      if (params?.status) {
        filtered = filtered.filter(p => p.status === params.status);
      }

      set({ projects: filtered, projectsLoading: false });
    } catch (error: any) {
      console.error('Failed to fetch projects:', error);
      set({ error: error.message || 'Failed to fetch projects', projectsLoading: false });
    }
  },

  fetchProject: async (id) => {
    try {
      // TODO: Replace with real API call
      await new Promise(resolve => setTimeout(resolve, 300));

      const project = mockProjects.find(p => p.id === id) || null;
      if (project) {
        set({ selectedProject: project });
      }
      return project;
    } catch (error: any) {
      console.error('Failed to fetch project:', error);
      set({ error: error.message || 'Failed to fetch project' });
      return null;
    }
  },

  createProject: async (data) => {
    try {
      // TODO: Replace with real API call
      await new Promise(resolve => setTimeout(resolve, 300));

      const newProject: Project = {
        id: Date.now().toString(),
        name: data.name || 'New Project',
        status: 'planning',
        startDate: data.startDate || new Date().toISOString().split('T')[0],
        progress: 0,
        teamMembers: data.teamMembers || [],
        taskCount: 0,
        completedTaskCount: 0,
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      set({ projects: [...get().projects, newProject] });
      return newProject;
    } catch (error: any) {
      console.error('Failed to create project:', error);
      throw error;
    }
  },

  updateProject: async (id, data) => {
    try {
      // TODO: Replace with real API call
      await new Promise(resolve => setTimeout(resolve, 300));

      set({
        projects: get().projects.map(p =>
          p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p
        ),
        selectedProject: get().selectedProject?.id === id
          ? { ...get().selectedProject!, ...data, updatedAt: new Date().toISOString() }
          : get().selectedProject,
      });
    } catch (error: any) {
      console.error('Failed to update project:', error);
      throw error;
    }
  },

  deleteProject: async (id) => {
    try {
      // TODO: Replace with real API call
      await new Promise(resolve => setTimeout(resolve, 300));

      set({
        projects: get().projects.filter(p => p.id !== id),
        tasks: get().tasks.filter(t => t.projectId !== id),
        selectedProject: get().selectedProject?.id === id ? null : get().selectedProject,
      });
    } catch (error: any) {
      console.error('Failed to delete project:', error);
      throw error;
    }
  },

  // Task actions
  fetchTasks: async (params) => {
    set({ tasksLoading: true, error: null });
    try {
      // TODO: Replace with real API call
      await new Promise(resolve => setTimeout(resolve, 500));

      let filtered = [...mockTasks];
      if (params?.projectId) {
        filtered = filtered.filter(t => t.projectId === params.projectId);
      }
      if (params?.status) {
        filtered = filtered.filter(t => t.status === params.status);
      }
      if (params?.assigneeId) {
        filtered = filtered.filter(t => t.assigneeId === params.assigneeId);
      }

      set({ tasks: filtered, tasksLoading: false });
    } catch (error: any) {
      console.error('Failed to fetch tasks:', error);
      set({ error: error.message || 'Failed to fetch tasks', tasksLoading: false });
    }
  },

  fetchTask: async (id) => {
    try {
      // TODO: Replace with real API call
      await new Promise(resolve => setTimeout(resolve, 300));

      const task = mockTasks.find(t => t.id === id) || null;
      if (task) {
        set({ selectedTask: task });
      }
      return task;
    } catch (error: any) {
      console.error('Failed to fetch task:', error);
      set({ error: error.message || 'Failed to fetch task' });
      return null;
    }
  },

  createTask: async (data) => {
    try {
      // TODO: Replace with real API call
      await new Promise(resolve => setTimeout(resolve, 300));

      const newTask: Task = {
        id: Date.now().toString(),
        projectId: data.projectId || '',
        title: data.title || 'New Task',
        status: 'todo',
        priority: data.priority || 'medium',
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      set({ tasks: [...get().tasks, newTask] });

      // Update project task count
      if (data.projectId) {
        const project = get().projects.find(p => p.id === data.projectId);
        if (project) {
          set({
            projects: get().projects.map(p =>
              p.id === data.projectId
                ? { ...p, taskCount: p.taskCount + 1 }
                : p
            ),
          });
        }
      }

      return newTask;
    } catch (error: any) {
      console.error('Failed to create task:', error);
      throw error;
    }
  },

  updateTask: async (id, data) => {
    try {
      // TODO: Replace with real API call
      await new Promise(resolve => setTimeout(resolve, 300));

      set({
        tasks: get().tasks.map(t =>
          t.id === id ? { ...t, ...data, updatedAt: new Date().toISOString() } : t
        ),
        selectedTask: get().selectedTask?.id === id
          ? { ...get().selectedTask!, ...data, updatedAt: new Date().toISOString() }
          : get().selectedTask,
      });
    } catch (error: any) {
      console.error('Failed to update task:', error);
      throw error;
    }
  },

  deleteTask: async (id) => {
    try {
      // TODO: Replace with real API call
      await new Promise(resolve => setTimeout(resolve, 300));

      const task = get().tasks.find(t => t.id === id);

      set({
        tasks: get().tasks.filter(t => t.id !== id),
        selectedTask: get().selectedTask?.id === id ? null : get().selectedTask,
      });

      // Update project task count
      if (task?.projectId) {
        set({
          projects: get().projects.map(p =>
            p.id === task.projectId
              ? {
                  ...p,
                  taskCount: p.taskCount - 1,
                  completedTaskCount: task.status === 'done'
                    ? p.completedTaskCount - 1
                    : p.completedTaskCount,
                }
              : p
          ),
        });
      }
    } catch (error: any) {
      console.error('Failed to delete task:', error);
      throw error;
    }
  },

  moveTask: async (taskId, newStatus) => {
    try {
      // TODO: Replace with real API call
      await new Promise(resolve => setTimeout(resolve, 200));

      const task = get().tasks.find(t => t.id === taskId);
      const wasComplete = task?.status === 'done';
      const isNowComplete = newStatus === 'done';

      set({
        tasks: get().tasks.map(t =>
          t.id === taskId ? { ...t, status: newStatus, updatedAt: new Date().toISOString() } : t
        ),
      });

      // Update project completed count if status changed to/from done
      if (task?.projectId && wasComplete !== isNowComplete) {
        set({
          projects: get().projects.map(p =>
            p.id === task.projectId
              ? {
                  ...p,
                  completedTaskCount: isNowComplete
                    ? p.completedTaskCount + 1
                    : p.completedTaskCount - 1,
                  progress: Math.round(
                    ((isNowComplete ? p.completedTaskCount + 1 : p.completedTaskCount - 1) / p.taskCount) * 100
                  ),
                }
              : p
          ),
        });
      }
    } catch (error: any) {
      console.error('Failed to move task:', error);
      throw error;
    }
  },

  // Subtask actions
  toggleSubtask: async (taskId, subtaskId) => {
    try {
      // TODO: Replace with real API call
      await new Promise(resolve => setTimeout(resolve, 200));

      set({
        tasks: get().tasks.map(t =>
          t.id === taskId
            ? {
                ...t,
                subtasks: t.subtasks?.map(s =>
                  s.id === subtaskId ? { ...s, completed: !s.completed } : s
                ),
              }
            : t
        ),
      });
    } catch (error: any) {
      console.error('Failed to toggle subtask:', error);
      throw error;
    }
  },

  addSubtask: async (taskId, title) => {
    try {
      // TODO: Replace with real API call
      await new Promise(resolve => setTimeout(resolve, 200));

      const newSubtask: SubTask = {
        id: Date.now().toString(),
        title,
        completed: false,
      };

      set({
        tasks: get().tasks.map(t =>
          t.id === taskId
            ? { ...t, subtasks: [...(t.subtasks || []), newSubtask] }
            : t
        ),
      });
    } catch (error: any) {
      console.error('Failed to add subtask:', error);
      throw error;
    }
  },

  // Comment actions
  addComment: async (taskId, content) => {
    try {
      // TODO: Replace with real API call
      await new Promise(resolve => setTimeout(resolve, 200));

      const newComment: TaskComment = {
        id: Date.now().toString(),
        userId: 'current-user',
        userName: 'Current User',
        content,
        createdAt: new Date().toISOString(),
      };

      set({
        tasks: get().tasks.map(t =>
          t.id === taskId
            ? { ...t, comments: [...(t.comments || []), newComment] }
            : t
        ),
      });
    } catch (error: any) {
      console.error('Failed to add comment:', error);
      throw error;
    }
  },

  // Metrics
  fetchMetrics: async () => {
    try {
      // TODO: Replace with real API call
      await new Promise(resolve => setTimeout(resolve, 300));

      const projects = get().projects;
      const tasks = get().tasks;

      const metrics: ProjectMetrics = {
        totalProjects: projects.length,
        activeProjects: projects.filter(p => p.status === 'active').length,
        completedProjects: projects.filter(p => p.status === 'completed').length,
        totalTasks: tasks.length,
        completedTasks: tasks.filter(t => t.status === 'done').length,
        overdueTasks: tasks.filter(t => {
          if (!t.dueDate || t.status === 'done') return false;
          return new Date(t.dueDate) < new Date();
        }).length,
      };

      set({ metrics });
    } catch (error: any) {
      console.error('Failed to fetch metrics:', error);
      set({ error: error.message || 'Failed to fetch metrics' });
    }
  },

  // Utility actions
  setSelectedProject: (project) => set({ selectedProject: project }),
  setSelectedTask: (task) => set({ selectedTask: task }),
  clearError: () => set({ error: null }),
}));
