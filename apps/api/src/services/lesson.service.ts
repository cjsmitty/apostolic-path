import type { LessonProgress } from '@apostolic-path/shared';
import { LessonRepository } from '../repositories/lesson.repository.js';

export class LessonService {
  private repository: LessonRepository;

  constructor() {
    this.repository = new LessonRepository();
  }

  async getById(lessonId: string, churchId: string): Promise<LessonProgress | null> {
    return this.repository.findById(lessonId, churchId);
  }

  async listByStudy(studyId: string): Promise<LessonProgress[]> {
    return this.repository.listByStudy(studyId);
  }

  async update(
    lessonId: string,
    churchId: string,
    data: Partial<LessonProgress>
  ): Promise<LessonProgress> {
    return this.repository.update(lessonId, churchId, {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  }

  async markComplete(
    lessonId: string,
    churchId: string,
    notes?: string
  ): Promise<LessonProgress> {
    const now = new Date().toISOString();

    return this.repository.update(lessonId, churchId, {
      status: 'completed',
      completedDate: now,
      teacherNotes: notes,
      updatedAt: now,
    });
  }

  async addNote(
    lessonId: string,
    churchId: string,
    type: 'teacher' | 'student',
    content: string
  ): Promise<LessonProgress> {
    const lesson = await this.repository.findById(lessonId, churchId);
    if (!lesson) {
      throw new Error('Lesson not found');
    }

    const updateData =
      type === 'teacher'
        ? { teacherNotes: `${lesson.teacherNotes || ''}\n${content}`.trim() }
        : { studentNotes: `${lesson.studentNotes || ''}\n${content}`.trim() };

    return this.repository.update(lessonId, churchId, {
      ...updateData,
      updatedAt: new Date().toISOString(),
    });
  }
}
