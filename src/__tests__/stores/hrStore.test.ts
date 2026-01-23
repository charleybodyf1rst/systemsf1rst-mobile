import { act } from '@testing-library/react-native';
import { useHRStore } from '../../stores/hrStore';
import type { Employee, Schedule, TimeOffRequest, EmployeeStatus } from '../../stores/hrStore';

const mockEmployee: Employee = {
  id: '1',
  firstName: 'John',
  lastName: 'Smith',
  email: 'john.smith@company.com',
  phone: '(555) 123-4567',
  department: 'Engineering',
  position: 'Senior Developer',
  employmentType: 'full_time',
  status: 'active',
  hireDate: '2022-03-15',
  skills: ['React', 'TypeScript', 'Node.js'],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockSchedule: Schedule = {
  id: '1',
  employeeId: '1',
  employeeName: 'John Smith',
  date: new Date().toISOString().split('T')[0],
  startTime: '09:00',
  endTime: '17:00',
  shiftType: 'regular',
  status: 'scheduled',
};

const mockTimeOffRequest: TimeOffRequest = {
  id: '1',
  employeeId: '1',
  employeeName: 'John Smith',
  type: 'vacation',
  startDate: '2024-02-15',
  endDate: '2024-02-20',
  reason: 'Family vacation',
  status: 'pending',
  createdAt: new Date().toISOString(),
};

describe('HR Store', () => {
  beforeEach(() => {
    // Reset the store state before each test
    useHRStore.setState({
      employees: [],
      departments: [],
      schedules: [],
      timeOffRequests: [],
      selectedEmployee: null,
      employeesLoading: false,
      schedulesLoading: false,
      timeOffLoading: false,
      error: null,
    });
  });

  describe('Employee Operations', () => {
    it('should fetch employees successfully', async () => {
      const store = useHRStore.getState();

      await act(async () => {
        await store.fetchEmployees();
      });

      const updatedStore = useHRStore.getState();
      expect(updatedStore.employees.length).toBeGreaterThan(0);
      expect(updatedStore.employeesLoading).toBe(false);
    });

    it('should filter employees by department', async () => {
      const store = useHRStore.getState();

      await act(async () => {
        await store.fetchEmployees({ department: 'Engineering' });
      });

      const updatedStore = useHRStore.getState();
      expect(updatedStore.employees.every((e) => e.department === 'Engineering')).toBe(true);
    });

    it('should filter employees by status', async () => {
      const store = useHRStore.getState();

      await act(async () => {
        await store.fetchEmployees({ status: 'active' });
      });

      const updatedStore = useHRStore.getState();
      expect(updatedStore.employees.every((e) => e.status === 'active')).toBe(true);
    });

    it('should fetch a single employee', async () => {
      const store = useHRStore.getState();
      let employee: Employee | null = null;

      await act(async () => {
        employee = await store.fetchEmployee('1');
      });

      expect(employee).toBeDefined();
      expect(useHRStore.getState().selectedEmployee).not.toBeNull();
    });

    it('should return null for non-existent employee', async () => {
      const store = useHRStore.getState();
      let employee: Employee | null = null;

      await act(async () => {
        employee = await store.fetchEmployee('non-existent');
      });

      expect(employee).toBeNull();
    });

    it('should create an employee successfully', async () => {
      const store = useHRStore.getState();
      let createdEmployee: Employee | undefined;

      await act(async () => {
        createdEmployee = await store.createEmployee({
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'jane.doe@company.com',
          department: 'Sales',
          position: 'Sales Rep',
          employmentType: 'full_time',
        });
      });

      expect(createdEmployee).toBeDefined();
      expect(createdEmployee?.firstName).toBe('Jane');
      expect(createdEmployee?.status).toBe('active');

      const updatedStore = useHRStore.getState();
      expect(updatedStore.employees).toHaveLength(1);
    });

    it('should create employee with default values', async () => {
      const store = useHRStore.getState();
      let createdEmployee: Employee | undefined;

      await act(async () => {
        createdEmployee = await store.createEmployee({});
      });

      expect(createdEmployee).toBeDefined();
      expect(createdEmployee?.employmentType).toBe('full_time');
      expect(createdEmployee?.status).toBe('active');
    });

    it('should update an employee successfully', async () => {
      useHRStore.setState({ employees: [mockEmployee] });

      const store = useHRStore.getState();
      await act(async () => {
        await store.updateEmployee('1', { position: 'Lead Developer' });
      });

      const updatedStore = useHRStore.getState();
      expect(updatedStore.employees[0].position).toBe('Lead Developer');
    });

    it('should update selected employee when updated', async () => {
      useHRStore.setState({
        employees: [mockEmployee],
        selectedEmployee: mockEmployee,
      });

      const store = useHRStore.getState();
      await act(async () => {
        await store.updateEmployee('1', { position: 'Tech Lead' });
      });

      const updatedStore = useHRStore.getState();
      expect(updatedStore.selectedEmployee?.position).toBe('Tech Lead');
    });

    it('should delete an employee successfully', async () => {
      useHRStore.setState({ employees: [mockEmployee] });

      const store = useHRStore.getState();
      await act(async () => {
        await store.deleteEmployee('1');
      });

      const updatedStore = useHRStore.getState();
      expect(updatedStore.employees).toHaveLength(0);
    });

    it('should clear selected employee when deleted', async () => {
      useHRStore.setState({
        employees: [mockEmployee],
        selectedEmployee: mockEmployee,
      });

      const store = useHRStore.getState();
      await act(async () => {
        await store.deleteEmployee('1');
      });

      const updatedStore = useHRStore.getState();
      expect(updatedStore.selectedEmployee).toBeNull();
    });

    it('should set selected employee', () => {
      const store = useHRStore.getState();

      act(() => {
        store.setSelectedEmployee(mockEmployee);
      });

      expect(useHRStore.getState().selectedEmployee).toEqual(mockEmployee);
    });

    it('should clear selected employee', () => {
      useHRStore.setState({ selectedEmployee: mockEmployee });

      const store = useHRStore.getState();
      act(() => {
        store.setSelectedEmployee(null);
      });

      expect(useHRStore.getState().selectedEmployee).toBeNull();
    });
  });

  describe('Department Operations', () => {
    it('should fetch departments successfully', async () => {
      const store = useHRStore.getState();

      await act(async () => {
        await store.fetchDepartments();
      });

      const updatedStore = useHRStore.getState();
      expect(updatedStore.departments.length).toBeGreaterThan(0);
    });

    it('should have department names', async () => {
      const store = useHRStore.getState();

      await act(async () => {
        await store.fetchDepartments();
      });

      const updatedStore = useHRStore.getState();
      expect(updatedStore.departments.every((d) => d.name)).toBe(true);
    });
  });

  describe('Schedule Operations', () => {
    it('should fetch schedules successfully', async () => {
      const store = useHRStore.getState();

      await act(async () => {
        await store.fetchSchedules();
      });

      const updatedStore = useHRStore.getState();
      expect(updatedStore.schedules.length).toBeGreaterThan(0);
      expect(updatedStore.schedulesLoading).toBe(false);
    });

    it('should create a schedule successfully', async () => {
      const store = useHRStore.getState();
      let createdSchedule: Schedule | undefined;

      await act(async () => {
        createdSchedule = await store.createSchedule({
          employeeId: '1',
          employeeName: 'John Smith',
          date: new Date().toISOString().split('T')[0],
          startTime: '08:00',
          endTime: '16:00',
          shiftType: 'regular',
        });
      });

      expect(createdSchedule).toBeDefined();
      expect(createdSchedule?.status).toBe('scheduled');
    });

    it('should create schedule with default values', async () => {
      const store = useHRStore.getState();
      let createdSchedule: Schedule | undefined;

      await act(async () => {
        createdSchedule = await store.createSchedule({});
      });

      expect(createdSchedule?.startTime).toBe('09:00');
      expect(createdSchedule?.endTime).toBe('17:00');
      expect(createdSchedule?.shiftType).toBe('regular');
    });

    it('should update a schedule successfully', async () => {
      useHRStore.setState({ schedules: [mockSchedule] });

      const store = useHRStore.getState();
      await act(async () => {
        await store.updateSchedule('1', { status: 'confirmed' });
      });

      const updatedStore = useHRStore.getState();
      expect(updatedStore.schedules[0].status).toBe('confirmed');
    });

    it('should delete a schedule successfully', async () => {
      useHRStore.setState({ schedules: [mockSchedule] });

      const store = useHRStore.getState();
      await act(async () => {
        await store.deleteSchedule('1');
      });

      const updatedStore = useHRStore.getState();
      expect(updatedStore.schedules).toHaveLength(0);
    });

    it('should support different shift types', async () => {
      const store = useHRStore.getState();

      const shiftTypes: Schedule['shiftType'][] = ['regular', 'overtime', 'on_call'];
      for (const shiftType of shiftTypes) {
        await act(async () => {
          await store.createSchedule({ shiftType });
        });
      }

      const updatedStore = useHRStore.getState();
      expect(updatedStore.schedules).toHaveLength(3);
    });
  });

  describe('Time Off Request Operations', () => {
    it('should fetch time off requests successfully', async () => {
      const store = useHRStore.getState();

      await act(async () => {
        await store.fetchTimeOffRequests();
      });

      const updatedStore = useHRStore.getState();
      expect(updatedStore.timeOffRequests.length).toBeGreaterThan(0);
      expect(updatedStore.timeOffLoading).toBe(false);
    });

    it('should create a time off request successfully', async () => {
      const store = useHRStore.getState();
      let createdRequest: TimeOffRequest | undefined;

      await act(async () => {
        createdRequest = await store.createTimeOffRequest({
          employeeId: '1',
          employeeName: 'John Smith',
          type: 'vacation',
          startDate: '2024-03-01',
          endDate: '2024-03-05',
          reason: 'Spring break',
        });
      });

      expect(createdRequest).toBeDefined();
      expect(createdRequest?.status).toBe('pending');
    });

    it('should create time off request with default type', async () => {
      const store = useHRStore.getState();
      let createdRequest: TimeOffRequest | undefined;

      await act(async () => {
        createdRequest = await store.createTimeOffRequest({});
      });

      expect(createdRequest?.type).toBe('vacation');
    });

    it('should approve a time off request', async () => {
      useHRStore.setState({ timeOffRequests: [mockTimeOffRequest] });

      const store = useHRStore.getState();
      await act(async () => {
        await store.approveTimeOffRequest('1');
      });

      const updatedStore = useHRStore.getState();
      expect(updatedStore.timeOffRequests[0].status).toBe('approved');
      expect(updatedStore.timeOffRequests[0].approvedAt).toBeDefined();
    });

    it('should reject a time off request', async () => {
      useHRStore.setState({ timeOffRequests: [mockTimeOffRequest] });

      const store = useHRStore.getState();
      await act(async () => {
        await store.rejectTimeOffRequest('1', 'Insufficient notice');
      });

      const updatedStore = useHRStore.getState();
      expect(updatedStore.timeOffRequests[0].status).toBe('rejected');
    });

    it('should support different time off types', async () => {
      const store = useHRStore.getState();

      const types: TimeOffRequest['type'][] = ['vacation', 'sick', 'personal', 'bereavement', 'other'];
      for (const type of types) {
        await act(async () => {
          await store.createTimeOffRequest({ type });
        });
      }

      const updatedStore = useHRStore.getState();
      expect(updatedStore.timeOffRequests).toHaveLength(5);
    });
  });

  describe('Error Handling', () => {
    it('should clear error state', () => {
      useHRStore.setState({ error: 'Some error' });

      const store = useHRStore.getState();
      act(() => {
        store.clearError();
      });

      expect(useHRStore.getState().error).toBeNull();
    });
  });

  describe('Employment Types', () => {
    it('should support full_time employment', async () => {
      const store = useHRStore.getState();
      let employee: Employee | undefined;

      await act(async () => {
        employee = await store.createEmployee({ employmentType: 'full_time' });
      });

      expect(employee?.employmentType).toBe('full_time');
    });

    it('should support part_time employment', async () => {
      const store = useHRStore.getState();
      let employee: Employee | undefined;

      await act(async () => {
        employee = await store.createEmployee({ employmentType: 'part_time' });
      });

      expect(employee?.employmentType).toBe('part_time');
    });

    it('should support contractor employment', async () => {
      const store = useHRStore.getState();
      let employee: Employee | undefined;

      await act(async () => {
        employee = await store.createEmployee({ employmentType: 'contractor' });
      });

      expect(employee?.employmentType).toBe('contractor');
    });

    it('should support intern employment', async () => {
      const store = useHRStore.getState();
      let employee: Employee | undefined;

      await act(async () => {
        employee = await store.createEmployee({ employmentType: 'intern' });
      });

      expect(employee?.employmentType).toBe('intern');
    });
  });
});
