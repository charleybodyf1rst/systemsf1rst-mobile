import { act } from '@testing-library/react-native';
import { useProjectsStore } from '../../stores/projectsStore';
import type { Project, Task, TaskStatus, TaskPriority, SubTask } from '../../stores/projectsStore';

const mockSubTask: SubTask = {
  id: 'st1',
  title: 'Subtask 1',
  completed: false,
};

const mockTask: Task = {
  id: 't1',
  projectId: '1',
  projectName: 'Test Project',
  title: 'Test Task',
  description: 'A test task description',
  status: 'todo',
  priority: 'medium',
  assigneeId: 'u1',
  assigneeName: 'John Smith',
  dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  subtasks: [mockSubTask],
  tags: ['frontend', 'bug'],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockProject: Project = {
  id: '1',
  name: 'Test Project',
  description: 'A test project',
  status: 'active',
  startDate: new Date().toISOString(),
  endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  progress: 45,
  budget: 50000,
  spent: 22500,
  managerId: 'u1',
  managerName: 'Jane Doe',
  teamMembers: [],
  taskCount: 1,
  completedTaskCount: 0,
  tags: ['web', 'client'],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('Projects Store', () => {
  beforeEach(() => {
    // Reset the store state before each test
    useProjectsStore.setState({
      projects: [],
      tasks: [],
      selectedProject: null,
      selectedTask: null,
      metrics: null,
      projectsLoading: false,
      tasksLoading: false,
      error: null,
    });
  });

  describe('Project Operations', () => {
    it('should fetch projects successfully', async () => {
      const store = useProjectsStore.getState();

      await act(async () => {
        await store.fetchProjects();
      });

      const updatedStore = useProjectsStore.getState();
      expect(updatedStore.projects.length).toBeGreaterThan(0);
      expect(updatedStore.projectsLoading).toBe(false);
    });

    it('should filter projects by status', async () => {
      const store = useProjectsStore.getState();

      await act(async () => {
        await store.fetchProjects({ status: 'in_progress' });
      });

      const updatedStore = useProjectsStore.getState();
      expect(updatedStore.projects.every((p) => p.status === 'in_progress')).toBe(true);
    });

    it('should filter projects by active status', async () => {
      const store = useProjectsStore.getState();

      await act(async () => {
        await store.fetchProjects({ status: 'active' });
      });

      const updatedStore = useProjectsStore.getState();
      expect(updatedStore.projects.every((p) => p.status === 'active')).toBe(true);
    });

    it('should fetch a single project', async () => {
      const store = useProjectsStore.getState();
      let project: Project | null = null;

      await act(async () => {
        project = await store.fetchProject('1');
      });

      expect(project).toBeDefined();
      expect(useProjectsStore.getState().selectedProject).not.toBeNull();
    });

    it('should return null for non-existent project', async () => {
      const store = useProjectsStore.getState();
      let project: Project | null = null;

      await act(async () => {
        project = await store.fetchProject('non-existent');
      });

      expect(project).toBeNull();
    });

    it('should create a project successfully', async () => {
      const store = useProjectsStore.getState();
      let createdProject: Project | undefined;

      await act(async () => {
        createdProject = await store.createProject({
          name: 'New Project',
          description: 'A brand new project',
          status: 'planning',
          priority: 'high',
        });
      });

      expect(createdProject).toBeDefined();
      expect(createdProject?.name).toBe('New Project');
      expect(createdProject?.progress).toBe(0);

      const updatedStore = useProjectsStore.getState();
      expect(updatedStore.projects).toHaveLength(1);
    });

    it('should create project with default values', async () => {
      const store = useProjectsStore.getState();
      let createdProject: Project | undefined;

      await act(async () => {
        createdProject = await store.createProject({});
      });

      expect(createdProject).toBeDefined();
      expect(createdProject?.status).toBe('planning');
      expect(createdProject?.progress).toBe(0);
      expect(createdProject?.teamMembers).toEqual([]);
      expect(createdProject?.taskCount).toBe(0);
    });

    it('should update a project successfully', async () => {
      useProjectsStore.setState({ projects: [mockProject] });

      const store = useProjectsStore.getState();
      await act(async () => {
        await store.updateProject('1', { name: 'Updated Project Name' });
      });

      const updatedStore = useProjectsStore.getState();
      expect(updatedStore.projects[0].name).toBe('Updated Project Name');
    });

    it('should update selected project when updated', async () => {
      useProjectsStore.setState({
        projects: [mockProject],
        selectedProject: mockProject,
      });

      const store = useProjectsStore.getState();
      await act(async () => {
        await store.updateProject('1', { status: 'completed' });
      });

      const updatedStore = useProjectsStore.getState();
      expect(updatedStore.selectedProject?.status).toBe('completed');
    });

    it('should delete a project successfully', async () => {
      useProjectsStore.setState({ projects: [mockProject] });

      const store = useProjectsStore.getState();
      await act(async () => {
        await store.deleteProject('1');
      });

      const updatedStore = useProjectsStore.getState();
      expect(updatedStore.projects).toHaveLength(0);
    });

    it('should clear selected project when deleted', async () => {
      useProjectsStore.setState({
        projects: [mockProject],
        selectedProject: mockProject,
      });

      const store = useProjectsStore.getState();
      await act(async () => {
        await store.deleteProject('1');
      });

      const updatedStore = useProjectsStore.getState();
      expect(updatedStore.selectedProject).toBeNull();
    });
  });

  describe('Task Operations', () => {
    it('should fetch tasks successfully', async () => {
      const store = useProjectsStore.getState();

      await act(async () => {
        await store.fetchTasks();
      });

      const updatedStore = useProjectsStore.getState();
      expect(updatedStore.tasks.length).toBeGreaterThan(0);
      expect(updatedStore.tasksLoading).toBe(false);
    });

    it('should filter tasks by project ID', async () => {
      const store = useProjectsStore.getState();

      await act(async () => {
        await store.fetchTasks({ projectId: '1' });
      });

      const updatedStore = useProjectsStore.getState();
      expect(updatedStore.tasks.every((t) => t.projectId === '1')).toBe(true);
    });

    it('should filter tasks by status', async () => {
      const store = useProjectsStore.getState();

      await act(async () => {
        await store.fetchTasks({ status: 'in_progress' });
      });

      const updatedStore = useProjectsStore.getState();
      expect(updatedStore.tasks.every((t) => t.status === 'in_progress')).toBe(true);
    });

    it('should create a task successfully', async () => {
      const store = useProjectsStore.getState();
      let createdTask: Task | undefined;

      await act(async () => {
        createdTask = await store.createTask({
          projectId: '1',
          title: 'New Task',
          description: 'Task description',
          priority: 'high',
        });
      });

      expect(createdTask).toBeDefined();
      expect(createdTask?.title).toBe('New Task');
      expect(createdTask?.status).toBe('todo');

      const updatedStore = useProjectsStore.getState();
      expect(updatedStore.tasks).toHaveLength(1);
    });

    it('should create task with default values', async () => {
      const store = useProjectsStore.getState();
      let createdTask: Task | undefined;

      await act(async () => {
        createdTask = await store.createTask({});
      });

      expect(createdTask?.status).toBe('todo');
      expect(createdTask?.priority).toBe('medium');
      // subtasks and tags are optional and undefined by default
      expect(createdTask?.title).toBe('New Task');
    });

    it('should update a task successfully', async () => {
      useProjectsStore.setState({ tasks: [mockTask] });

      const store = useProjectsStore.getState();
      await act(async () => {
        await store.updateTask('t1', { title: 'Updated Task Title' });
      });

      const updatedStore = useProjectsStore.getState();
      expect(updatedStore.tasks[0].title).toBe('Updated Task Title');
    });

    it('should delete a task successfully', async () => {
      useProjectsStore.setState({ tasks: [mockTask] });

      const store = useProjectsStore.getState();
      await act(async () => {
        await store.deleteTask('t1');
      });

      const updatedStore = useProjectsStore.getState();
      expect(updatedStore.tasks).toHaveLength(0);
    });

    it('should move task to different status', async () => {
      useProjectsStore.setState({ tasks: [mockTask] });

      const store = useProjectsStore.getState();
      await act(async () => {
        await store.moveTask('t1', 'in_progress');
      });

      const updatedStore = useProjectsStore.getState();
      expect(updatedStore.tasks[0].status).toBe('in_progress');
    });

    it('should move task through all statuses', async () => {
      useProjectsStore.setState({ tasks: [mockTask] });

      const statuses: TaskStatus[] = ['todo', 'in_progress', 'review', 'done'];
      const store = useProjectsStore.getState();

      for (const status of statuses) {
        await act(async () => {
          await store.moveTask('t1', status);
        });
        expect(useProjectsStore.getState().tasks[0].status).toBe(status);
      }
    });
  });

  describe('Subtask Operations', () => {
    it('should toggle subtask completion', async () => {
      useProjectsStore.setState({ tasks: [mockTask] });

      const store = useProjectsStore.getState();
      await act(async () => {
        await store.toggleSubtask('t1', 'st1');
      });

      const updatedStore = useProjectsStore.getState();
      expect(updatedStore.tasks[0].subtasks?.[0].completed).toBe(true);
    });

    it('should toggle subtask back to incomplete', async () => {
      const completedSubTask = { ...mockSubTask, completed: true };
      const taskWithCompletedSubtask = { ...mockTask, subtasks: [completedSubTask] };
      useProjectsStore.setState({ tasks: [taskWithCompletedSubtask] });

      const store = useProjectsStore.getState();
      await act(async () => {
        await store.toggleSubtask('t1', 'st1');
      });

      const updatedStore = useProjectsStore.getState();
      expect(updatedStore.tasks[0].subtasks?.[0].completed).toBe(false);
    });

    it('should not crash when toggling subtask on task without subtasks', async () => {
      const taskWithoutSubtasks = { ...mockTask, subtasks: undefined };
      useProjectsStore.setState({ tasks: [taskWithoutSubtasks] });

      const store = useProjectsStore.getState();
      await act(async () => {
        await store.toggleSubtask('t1', 'st1');
      });

      // Should not throw error
      expect(useProjectsStore.getState().tasks).toHaveLength(1);
    });
  });

  describe('Metrics Operations', () => {
    it('should fetch metrics successfully', async () => {
      const store = useProjectsStore.getState();

      await act(async () => {
        await store.fetchMetrics();
      });

      const updatedStore = useProjectsStore.getState();
      expect(updatedStore.metrics).toBeDefined();
    });

    it('should return complete metrics object', async () => {
      const store = useProjectsStore.getState();

      await act(async () => {
        await store.fetchMetrics();
      });

      const metrics = useProjectsStore.getState().metrics;
      expect(metrics).toHaveProperty('totalProjects');
      expect(metrics).toHaveProperty('completedProjects');
      expect(metrics).toHaveProperty('activeProjects');
      expect(metrics).toHaveProperty('totalTasks');
      expect(metrics).toHaveProperty('completedTasks');
      expect(metrics).toHaveProperty('overdueTasks');
    });
  });

  describe('Selection Operations', () => {
    it('should set selected project', () => {
      const store = useProjectsStore.getState();

      act(() => {
        store.setSelectedProject(mockProject);
      });

      expect(useProjectsStore.getState().selectedProject).toEqual(mockProject);
    });

    it('should clear selected project', () => {
      useProjectsStore.setState({ selectedProject: mockProject });

      const store = useProjectsStore.getState();
      act(() => {
        store.setSelectedProject(null);
      });

      expect(useProjectsStore.getState().selectedProject).toBeNull();
    });

    it('should set selected task', () => {
      const store = useProjectsStore.getState();

      act(() => {
        store.setSelectedTask(mockTask);
      });

      expect(useProjectsStore.getState().selectedTask).toEqual(mockTask);
    });

    it('should clear selected task', () => {
      useProjectsStore.setState({ selectedTask: mockTask });

      const store = useProjectsStore.getState();
      act(() => {
        store.setSelectedTask(null);
      });

      expect(useProjectsStore.getState().selectedTask).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should clear error state', () => {
      useProjectsStore.setState({ error: 'Some error' });

      const store = useProjectsStore.getState();
      act(() => {
        store.clearError();
      });

      expect(useProjectsStore.getState().error).toBeNull();
    });
  });

  describe('Task Priorities', () => {
    const priorities: TaskPriority[] = ['low', 'medium', 'high', 'urgent'];

    it.each(priorities)('should support %s priority', async (priority) => {
      const store = useProjectsStore.getState();
      let task: Task | undefined;

      await act(async () => {
        task = await store.createTask({ priority });
      });

      expect(task?.priority).toBe(priority);
    });
  });

  describe('Project Status Transitions', () => {
    it('should create project with planning status', async () => {
      const store = useProjectsStore.getState();
      let project: Project | undefined;

      await act(async () => {
        project = await store.createProject({ status: 'planning' });
      });

      expect(project?.status).toBe('planning');
    });

    it('should update project to in_progress', async () => {
      useProjectsStore.setState({ projects: [{ ...mockProject, status: 'planning' }] });

      const store = useProjectsStore.getState();
      await act(async () => {
        await store.updateProject('1', { status: 'in_progress' });
      });

      expect(useProjectsStore.getState().projects[0].status).toBe('in_progress');
    });

    it('should update project to completed', async () => {
      useProjectsStore.setState({ projects: [mockProject] });

      const store = useProjectsStore.getState();
      await act(async () => {
        await store.updateProject('1', { status: 'completed', progress: 100 });
      });

      const updated = useProjectsStore.getState().projects[0];
      expect(updated.status).toBe('completed');
      expect(updated.progress).toBe(100);
    });

    it('should update project to on_hold', async () => {
      useProjectsStore.setState({ projects: [mockProject] });

      const store = useProjectsStore.getState();
      await act(async () => {
        await store.updateProject('1', { status: 'on_hold' });
      });

      expect(useProjectsStore.getState().projects[0].status).toBe('on_hold');
    });
  });

  describe('Budget Tracking', () => {
    it('should create project with budget', async () => {
      const store = useProjectsStore.getState();
      let project: Project | undefined;

      await act(async () => {
        project = await store.createProject({
          name: 'Budget Project',
          budget: 100000,
          spent: 0,
        });
      });

      expect(project?.budget).toBe(100000);
      expect(project?.spent).toBe(0);
    });

    it('should update spent amount', async () => {
      useProjectsStore.setState({ projects: [mockProject] });

      const store = useProjectsStore.getState();
      await act(async () => {
        await store.updateProject('1', { spent: 30000 });
      });

      expect(useProjectsStore.getState().projects[0].spent).toBe(30000);
    });
  });
});
