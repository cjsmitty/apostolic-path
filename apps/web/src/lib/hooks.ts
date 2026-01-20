/**
 * API hooks for data fetching with React Query
 */

import type {
    BibleStudy,
    Church,
    ChurchStats,
    LessonProgress,
    NewBirthStats,
    Student,
    User,
} from '@apostolic-path/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './api';
import { useAuthStore } from './auth';

// ============ Church Hooks ============

export function useCurrentChurch() {
  const { isAuthenticated, isLoading } = useAuthStore();
  
  return useQuery({
    queryKey: ['church', 'current'],
    queryFn: async () => {
      const response = await api.get<Church>('/churches/me');
      return response.data;
    },
    enabled: isAuthenticated && !isLoading,
    staleTime: Infinity, // Don't refetch automatically
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 min
    retry: false,
  });
}

export function useChurchStats() {
  const { isAuthenticated, isLoading } = useAuthStore();
  
  return useQuery({
    queryKey: ['church', 'stats'],
    queryFn: async () => {
      const response = await api.get<ChurchStats>('/churches/me/stats');
      return response.data;
    },
    enabled: isAuthenticated && !isLoading,
    staleTime: Infinity,
    retry: false,
  });
}

export function useUserChurches() {
  const { isAuthenticated, isLoading } = useAuthStore();
  
  return useQuery({
    queryKey: ['user', 'churches'],
    queryFn: async () => {
      const response = await api.get<Church[]>('/auth/me/churches');
      return response.data || [];
    },
    enabled: isAuthenticated && !isLoading,
    staleTime: Infinity,
    retry: false,
  });
}

export function useSwitchChurch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (churchId: string) => {
      const response = await api.post<{ token: string }>('/auth/switch-church', { churchId });
      return response.data;
    },
    onSuccess: () => {
      // Invalidate all queries when church is switched
      queryClient.invalidateQueries();
    },
  });
}

// ============ Student Hooks ============

interface StudentWithUser extends Student {
  user?: User;
}

interface ListStudentsResponse {
  items: StudentWithUser[];
  nextCursor?: string;
}

export function useStudents(options?: {
  status?: string;
  teacherId?: string;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['students', options],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (options?.status) params.set('status', options.status);
      if (options?.teacherId) params.set('teacherId', options.teacherId);
      if (options?.limit) params.set('limit', options.limit.toString());

      const endpoint = `/students${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await api.get<StudentWithUser[]>(endpoint);
      return response.data || [];
    },
  });
}

export function useStudent(id: string) {
  return useQuery({
    queryKey: ['students', id],
    queryFn: async () => {
      const response = await api.get<StudentWithUser>(`/students/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useNewBirthStats() {
  return useQuery({
    queryKey: ['students', 'stats', 'new-birth'],
    queryFn: async () => {
      const response = await api.get<NewBirthStats>('/students/stats/new-birth');
      return response.data;
    },
  });
}

export function useCreateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { userId: string; assignedTeacherId?: string; notes?: string }) => {
      const response = await api.post<Student>('/students', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });
}

export function useUpdateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: {
        assignedTeacherId?: string;
        notes?: string;
      };
    }) => {
      const response = await api.patch<Student>(`/students/${id}`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['students', variables.id] });
    },
  });
}

export function useUpdateNewBirthMilestone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      studentId,
      milestone,
      completed,
      date,
      notes,
    }: {
      studentId: string;
      milestone: 'waterBaptism' | 'holyGhost';
      completed: boolean;
      date?: string;
      notes?: string;
    }) => {
      const response = await api.post<Student>(`/students/${studentId}/new-birth`, {
        milestone,
        completed,
        date,
        notes,
      });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['students', variables.studentId] });
      queryClient.invalidateQueries({ queryKey: ['students', 'stats'] });
    },
  });
}

// ============ User Hooks ============

export function useUsers(options?: { role?: string; limit?: number }) {
  return useQuery({
    queryKey: ['users', options],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (options?.role) params.set('role', options.role);
      if (options?.limit) params.set('limit', options.limit.toString());

      const endpoint = `/users${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await api.get<User[]>(endpoint);
      return response.data || [];
    },
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: ['users', id],
    queryFn: async () => {
      const response = await api.get<User>(`/users/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useTeachers() {
  return useUsers({ role: 'teacher' });
}

// ============ Study Hooks ============

interface StudyWithDetails extends BibleStudy {
  teacher?: User;
  students?: User[];
  lessonCount?: number;
  completedLessonCount?: number;
}

export function useStudies(options?: {
  status?: string;
  teacherId?: string;
  curriculum?: string;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['studies', options],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (options?.status) params.set('status', options.status);
      if (options?.teacherId) params.set('teacherId', options.teacherId);
      if (options?.curriculum) params.set('curriculum', options.curriculum);
      if (options?.limit) params.set('limit', options.limit.toString());

      const endpoint = `/studies${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await api.get<StudyWithDetails[]>(endpoint);
      return response.data || [];
    },
  });
}

export function useStudy(id: string) {
  return useQuery({
    queryKey: ['studies', id],
    queryFn: async () => {
      const response = await api.get<StudyWithDetails>(`/studies/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useStudiesByStudent(studentId: string) {
  return useQuery({
    queryKey: ['studies', 'student', studentId],
    queryFn: async () => {
      const response = await api.get<BibleStudy[]>(`/studies/student/${studentId}`);
      return response.data || [];
    },
    enabled: !!studentId,
  });
}

export function useCreateStudy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      title: string;
      curriculum: string;
      studentIds: string[];
      scheduledDay?: string;
      scheduledTime?: string;
      location?: string;
      notes?: string;
    }) => {
      const response = await api.post<BibleStudy>('/studies', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studies'] });
      queryClient.invalidateQueries({ queryKey: ['church', 'stats'] });
    },
  });
}

export function useUpdateStudy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<{
        title: string;
        curriculum: string;
        studentIds: string[];
        scheduledDay?: string;
        scheduledTime?: string;
        location?: string;
        notes?: string;
        status?: string;
      }>;
    }) => {
      const response = await api.patch<BibleStudy>(`/studies/${id}`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['studies'] });
      queryClient.invalidateQueries({ queryKey: ['studies', variables.id] });
    },
  });
}

export function useUpdateStudyStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await api.post<BibleStudy>(`/studies/${id}/status`, { status });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['studies'] });
      queryClient.invalidateQueries({ queryKey: ['studies', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['church', 'stats'] });
    },
  });
}

// ============ Lesson Hooks ============

export function useLessons(studyId: string) {
  return useQuery({
    queryKey: ['lessons', studyId],
    queryFn: async () => {
      const response = await api.get<LessonProgress[]>(`/lessons/study/${studyId}`);
      return response.data || [];
    },
    enabled: !!studyId,
  });
}

export function useLesson(id: string) {
  return useQuery({
    queryKey: ['lessons', 'detail', id],
    queryFn: async () => {
      const response = await api.get<LessonProgress>(`/lessons/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useUpdateLesson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      studyId: string;
      data: {
        status?: 'not-started' | 'in-progress' | 'completed';
        teacherNotes?: string;
        studentNotes?: string;
        completedDate?: string;
      };
    }) => {
      const response = await api.patch<LessonProgress>(`/lessons/${id}`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lessons', variables.studyId] });
      queryClient.invalidateQueries({ queryKey: ['lessons', 'detail', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['studies'] });
    },
  });
}

export function useMarkLessonComplete() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      studyId,
      notes,
    }: {
      id: string;
      studyId: string;
      notes?: string;
    }) => {
      const response = await api.post<LessonProgress>(`/lessons/${id}/complete`, { notes });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lessons', variables.studyId] });
      queryClient.invalidateQueries({ queryKey: ['lessons', 'detail', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['studies'] });
    },
  });
}

// ============ First Steps Hooks ============

interface FirstStepsStats {
  totalStudents: number;
  stepProgress: Record<string, { started: number; completed: number }>;
  averageCompletion: number;
  fullyCompleted: number;
}

export function useFirstStepsStats() {
  return useQuery({
    queryKey: ['students', 'stats', 'first-steps'],
    queryFn: async () => {
      const response = await api.get<FirstStepsStats>('/students/stats/first-steps');
      return response.data;
    },
  });
}

export function useUpdateFirstStep() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      studentId,
      step,
      started,
      completed,
      notes,
    }: {
      studentId: string;
      step: string;
      started?: boolean;
      completed?: boolean;
      notes?: string;
    }) => {
      const response = await api.post<Student>(`/students/${studentId}/first-steps/${step}`, {
        started,
        completed,
        notes,
      });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['students', variables.studentId] });
      queryClient.invalidateQueries({ queryKey: ['students', 'stats', 'first-steps'] });
    },
  });
}
