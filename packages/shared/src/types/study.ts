/**
 * Bible Study Entity
 *
 * Represents a Bible study session or series between
 * a teacher and one or more students.
 */

export type CurriculumType = 'search-for-truth' | 'exploring-gods-word' | 'first-principles' | 'custom';
export type StudyStatus = 'in-progress' | 'completed' | 'paused';

export interface BibleStudy {
  id: string;
  churchId: string;
  teacherId: string;
  studentIds: string[];
  title: string;
  curriculum: CurriculumType;
  status: StudyStatus;
  scheduledDay?: string;
  scheduledTime?: string;
  location?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ListStudiesOptions {
  status?: string;
  teacherId?: string;
  curriculum?: string;
  limit?: number;
  cursor?: string;
}
