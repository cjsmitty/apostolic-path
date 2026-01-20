import type {
    BibleStudy,
    ListStudiesOptions,
    PaginatedResult,
} from '@apostolic-path/shared';
import { getCurriculumLessons } from '../data/curriculums.js';
import { LessonRepository } from '../repositories/lesson.repository.js';
import { StudyRepository } from '../repositories/study.repository.js';

export class StudyService {
  private repository: StudyRepository;
  private lessonRepository: LessonRepository;

  constructor() {
    this.repository = new StudyRepository();
    this.lessonRepository = new LessonRepository();
  }

  async getById(studyId: string, churchId: string): Promise<BibleStudy | null> {
    return this.repository.findById(studyId, churchId);
  }

  async listByChurch(
    churchId: string,
    options: ListStudiesOptions
  ): Promise<PaginatedResult<BibleStudy>> {
    return this.repository.listByChurch(churchId, options);
  }

  async listByStudent(studentId: string, churchId: string): Promise<BibleStudy[]> {
    return this.repository.listByStudent(studentId, churchId);
  }

  async create(
    data: Omit<BibleStudy, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'lessons'>
  ): Promise<BibleStudy> {
    const now = new Date().toISOString();

    // Create the study first
    const study = await this.repository.create({
      ...data,
      status: 'in-progress',
      createdAt: now,
      updatedAt: now,
    });

    // Create lessons based on curriculum
    const curriculumLessons = getCurriculumLessons(data.curriculum);
    for (const lesson of curriculumLessons) {
      await this.lessonRepository.create({
        studyId: study.id,
        lessonNumber: lesson.number,
        lessonTitle: lesson.title,
        status: 'not-started',
        createdAt: now,
        updatedAt: now,
      });
    }

    return study;
  }

  async update(
    studyId: string,
    churchId: string,
    data: Partial<BibleStudy>
  ): Promise<BibleStudy> {
    return this.repository.update(studyId, churchId, {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  }

  async updateStatus(
    studyId: string,
    churchId: string,
    status: string
  ): Promise<BibleStudy> {
    return this.repository.update(studyId, churchId, {
      status: status as BibleStudy['status'],
      updatedAt: new Date().toISOString(),
    });
  }
}
