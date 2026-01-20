/**
 * Lesson Progress Entity
 *
 * Tracks progress through individual lessons
 * within a Bible study.
 */

export type LessonStatus = 'not-started' | 'in-progress' | 'completed';

export interface LessonProgress {
  id: string;
  studyId: string;
  lessonNumber: number;
  lessonTitle: string;
  status: LessonStatus;
  completedDate?: string;
  teacherNotes?: string;
  studentNotes?: string;
  attachments?: string[];
  createdAt: string;
  updatedAt: string;
}
