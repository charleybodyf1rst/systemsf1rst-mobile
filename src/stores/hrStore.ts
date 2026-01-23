import { create } from 'zustand';
import { api } from '../lib/api';

// Types
export type EmploymentType = 'full_time' | 'part_time' | 'contractor' | 'intern';
export type EmployeeStatus = 'active' | 'inactive' | 'on_leave' | 'terminated';

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatar?: string;
  department: string;
  position: string;
  managerId?: string;
  managerName?: string;
  employmentType: EmploymentType;
  status: EmployeeStatus;
  hireDate: string;
  terminationDate?: string;
  salary?: number;
  hourlyRate?: number;
  address?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  skills?: string[];
  certifications?: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  id: string;
  name: string;
  managerId?: string;
  managerName?: string;
  employeeCount: number;
}

export interface Schedule {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  startTime: string;
  endTime: string;
  shiftType: 'regular' | 'overtime' | 'on_call';
  notes?: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
}

export interface TimeOffRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  type: 'vacation' | 'sick' | 'personal' | 'bereavement' | 'other';
  startDate: string;
  endDate: string;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
}

interface HRState {
  // State
  employees: Employee[];
  departments: Department[];
  schedules: Schedule[];
  timeOffRequests: TimeOffRequest[];
  selectedEmployee: Employee | null;

  // Loading states
  employeesLoading: boolean;
  schedulesLoading: boolean;
  timeOffLoading: boolean;

  // Error states
  error: string | null;

  // Actions
  fetchEmployees: (params?: { department?: string; status?: EmployeeStatus }) => Promise<void>;
  fetchEmployee: (id: string) => Promise<Employee | null>;
  createEmployee: (data: Partial<Employee>) => Promise<Employee>;
  updateEmployee: (id: string, data: Partial<Employee>) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;

  fetchDepartments: () => Promise<void>;

  fetchSchedules: (params?: { employeeId?: string; startDate?: string; endDate?: string }) => Promise<void>;
  createSchedule: (data: Partial<Schedule>) => Promise<Schedule>;
  updateSchedule: (id: string, data: Partial<Schedule>) => Promise<void>;
  deleteSchedule: (id: string) => Promise<void>;

  fetchTimeOffRequests: (params?: { employeeId?: string; status?: string }) => Promise<void>;
  createTimeOffRequest: (data: Partial<TimeOffRequest>) => Promise<TimeOffRequest>;
  approveTimeOffRequest: (id: string) => Promise<void>;
  rejectTimeOffRequest: (id: string, reason?: string) => Promise<void>;

  setSelectedEmployee: (employee: Employee | null) => void;
  clearError: () => void;
}

// Mock data for development
const mockEmployees: Employee[] = [
  {
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
  },
  {
    id: '2',
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.johnson@company.com',
    phone: '(555) 234-5678',
    department: 'Sales',
    position: 'Sales Manager',
    employmentType: 'full_time',
    status: 'active',
    hireDate: '2021-08-01',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    firstName: 'Mike',
    lastName: 'Williams',
    email: 'mike.williams@company.com',
    department: 'Marketing',
    position: 'Marketing Specialist',
    employmentType: 'part_time',
    status: 'active',
    hireDate: '2023-01-10',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const mockDepartments: Department[] = [
  { id: '1', name: 'Engineering', employeeCount: 12 },
  { id: '2', name: 'Sales', employeeCount: 8 },
  { id: '3', name: 'Marketing', employeeCount: 5 },
  { id: '4', name: 'Human Resources', employeeCount: 3 },
  { id: '5', name: 'Finance', employeeCount: 4 },
];

export const useHRStore = create<HRState>((set, get) => ({
  // Initial state
  employees: [],
  departments: [],
  schedules: [],
  timeOffRequests: [],
  selectedEmployee: null,
  employeesLoading: false,
  schedulesLoading: false,
  timeOffLoading: false,
  error: null,

  // Employee actions
  fetchEmployees: async (params) => {
    set({ employeesLoading: true, error: null });
    try {
      // TODO: Replace with real API call
      // const response = await api.get('/hr/employees', { params });
      await new Promise(resolve => setTimeout(resolve, 500));

      let filtered = [...mockEmployees];
      if (params?.department) {
        filtered = filtered.filter(e => e.department === params.department);
      }
      if (params?.status) {
        filtered = filtered.filter(e => e.status === params.status);
      }

      set({ employees: filtered, employeesLoading: false });
    } catch (error: any) {
      console.error('Failed to fetch employees:', error);
      set({ error: error.message || 'Failed to fetch employees', employeesLoading: false });
    }
  },

  fetchEmployee: async (id) => {
    try {
      // TODO: Replace with real API call
      // const response = await api.get(`/hr/employees/${id}`);
      await new Promise(resolve => setTimeout(resolve, 300));

      const employee = mockEmployees.find(e => e.id === id) || null;
      if (employee) {
        set({ selectedEmployee: employee });
      }
      return employee;
    } catch (error: any) {
      console.error('Failed to fetch employee:', error);
      set({ error: error.message || 'Failed to fetch employee' });
      return null;
    }
  },

  createEmployee: async (data) => {
    try {
      // TODO: Replace with real API call
      // const response = await api.post('/hr/employees', data);
      await new Promise(resolve => setTimeout(resolve, 300));

      const newEmployee: Employee = {
        id: Date.now().toString(),
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        email: data.email || '',
        department: data.department || '',
        position: data.position || '',
        employmentType: data.employmentType || 'full_time',
        status: 'active',
        hireDate: data.hireDate || new Date().toISOString().split('T')[0],
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      set({ employees: [...get().employees, newEmployee] });
      return newEmployee;
    } catch (error: any) {
      console.error('Failed to create employee:', error);
      throw error;
    }
  },

  updateEmployee: async (id, data) => {
    try {
      // TODO: Replace with real API call
      // await api.put(`/hr/employees/${id}`, data);
      await new Promise(resolve => setTimeout(resolve, 300));

      set({
        employees: get().employees.map(e =>
          e.id === id ? { ...e, ...data, updatedAt: new Date().toISOString() } : e
        ),
        selectedEmployee: get().selectedEmployee?.id === id
          ? { ...get().selectedEmployee!, ...data, updatedAt: new Date().toISOString() }
          : get().selectedEmployee,
      });
    } catch (error: any) {
      console.error('Failed to update employee:', error);
      throw error;
    }
  },

  deleteEmployee: async (id) => {
    try {
      // TODO: Replace with real API call
      // await api.delete(`/hr/employees/${id}`);
      await new Promise(resolve => setTimeout(resolve, 300));

      set({
        employees: get().employees.filter(e => e.id !== id),
        selectedEmployee: get().selectedEmployee?.id === id ? null : get().selectedEmployee,
      });
    } catch (error: any) {
      console.error('Failed to delete employee:', error);
      throw error;
    }
  },

  // Department actions
  fetchDepartments: async () => {
    try {
      // TODO: Replace with real API call
      // const response = await api.get('/hr/departments');
      await new Promise(resolve => setTimeout(resolve, 300));
      set({ departments: mockDepartments });
    } catch (error: any) {
      console.error('Failed to fetch departments:', error);
      set({ error: error.message || 'Failed to fetch departments' });
    }
  },

  // Schedule actions
  fetchSchedules: async (params) => {
    set({ schedulesLoading: true, error: null });
    try {
      // TODO: Replace with real API call
      // const response = await api.get('/hr/schedules', { params });
      await new Promise(resolve => setTimeout(resolve, 500));

      const mockSchedules: Schedule[] = [
        {
          id: '1',
          employeeId: '1',
          employeeName: 'John Smith',
          date: new Date().toISOString().split('T')[0],
          startTime: '09:00',
          endTime: '17:00',
          shiftType: 'regular',
          status: 'scheduled',
        },
        {
          id: '2',
          employeeId: '2',
          employeeName: 'Sarah Johnson',
          date: new Date().toISOString().split('T')[0],
          startTime: '08:00',
          endTime: '16:00',
          shiftType: 'regular',
          status: 'confirmed',
        },
      ];

      set({ schedules: mockSchedules, schedulesLoading: false });
    } catch (error: any) {
      console.error('Failed to fetch schedules:', error);
      set({ error: error.message || 'Failed to fetch schedules', schedulesLoading: false });
    }
  },

  createSchedule: async (data) => {
    try {
      // TODO: Replace with real API call
      await new Promise(resolve => setTimeout(resolve, 300));

      const newSchedule: Schedule = {
        id: Date.now().toString(),
        employeeId: data.employeeId || '',
        employeeName: data.employeeName || '',
        date: data.date || new Date().toISOString().split('T')[0],
        startTime: data.startTime || '09:00',
        endTime: data.endTime || '17:00',
        shiftType: data.shiftType || 'regular',
        status: 'scheduled',
        ...data,
      };

      set({ schedules: [...get().schedules, newSchedule] });
      return newSchedule;
    } catch (error: any) {
      console.error('Failed to create schedule:', error);
      throw error;
    }
  },

  updateSchedule: async (id, data) => {
    try {
      // TODO: Replace with real API call
      await new Promise(resolve => setTimeout(resolve, 300));

      set({
        schedules: get().schedules.map(s =>
          s.id === id ? { ...s, ...data } : s
        ),
      });
    } catch (error: any) {
      console.error('Failed to update schedule:', error);
      throw error;
    }
  },

  deleteSchedule: async (id) => {
    try {
      // TODO: Replace with real API call
      await new Promise(resolve => setTimeout(resolve, 300));
      set({ schedules: get().schedules.filter(s => s.id !== id) });
    } catch (error: any) {
      console.error('Failed to delete schedule:', error);
      throw error;
    }
  },

  // Time off request actions
  fetchTimeOffRequests: async (params) => {
    set({ timeOffLoading: true, error: null });
    try {
      // TODO: Replace with real API call
      await new Promise(resolve => setTimeout(resolve, 500));

      const mockRequests: TimeOffRequest[] = [
        {
          id: '1',
          employeeId: '1',
          employeeName: 'John Smith',
          type: 'vacation',
          startDate: '2024-02-15',
          endDate: '2024-02-20',
          reason: 'Family vacation',
          status: 'pending',
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          employeeId: '2',
          employeeName: 'Sarah Johnson',
          type: 'sick',
          startDate: '2024-02-10',
          endDate: '2024-02-10',
          status: 'approved',
          approvedBy: 'Manager',
          createdAt: new Date().toISOString(),
        },
      ];

      set({ timeOffRequests: mockRequests, timeOffLoading: false });
    } catch (error: any) {
      console.error('Failed to fetch time off requests:', error);
      set({ error: error.message || 'Failed to fetch time off requests', timeOffLoading: false });
    }
  },

  createTimeOffRequest: async (data) => {
    try {
      // TODO: Replace with real API call
      await new Promise(resolve => setTimeout(resolve, 300));

      const newRequest: TimeOffRequest = {
        id: Date.now().toString(),
        employeeId: data.employeeId || '',
        employeeName: data.employeeName || '',
        type: data.type || 'vacation',
        startDate: data.startDate || new Date().toISOString().split('T')[0],
        endDate: data.endDate || new Date().toISOString().split('T')[0],
        status: 'pending',
        ...data,
        createdAt: new Date().toISOString(),
      };

      set({ timeOffRequests: [...get().timeOffRequests, newRequest] });
      return newRequest;
    } catch (error: any) {
      console.error('Failed to create time off request:', error);
      throw error;
    }
  },

  approveTimeOffRequest: async (id) => {
    try {
      // TODO: Replace with real API call
      await new Promise(resolve => setTimeout(resolve, 300));

      set({
        timeOffRequests: get().timeOffRequests.map(r =>
          r.id === id
            ? { ...r, status: 'approved' as const, approvedAt: new Date().toISOString() }
            : r
        ),
      });
    } catch (error: any) {
      console.error('Failed to approve time off request:', error);
      throw error;
    }
  },

  rejectTimeOffRequest: async (id, reason) => {
    try {
      // TODO: Replace with real API call
      await new Promise(resolve => setTimeout(resolve, 300));

      set({
        timeOffRequests: get().timeOffRequests.map(r =>
          r.id === id ? { ...r, status: 'rejected' as const } : r
        ),
      });
    } catch (error: any) {
      console.error('Failed to reject time off request:', error);
      throw error;
    }
  },

  // Utility actions
  setSelectedEmployee: (employee) => set({ selectedEmployee: employee }),
  clearError: () => set({ error: null }),
}));
