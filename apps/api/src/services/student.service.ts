import type {
    ListStudentsOptions,
    NewBirthMilestone,
    NewBirthStats,
    PaginatedResult,
    Student,
    User,
} from '@apostolic-path/shared';
import { StudentRepository } from '../repositories/student.repository.js';
import { UserRepository } from '../repositories/user.repository.js';

interface StudentWithUser extends Student {
  user?: User;
}

export class StudentService {
  private repository: StudentRepository;
  private userRepository: UserRepository;

  constructor() {
    this.repository = new StudentRepository();
    this.userRepository = new UserRepository();
  }

  async getById(studentId: string, churchId: string): Promise<StudentWithUser | null> {
    const student = await this.repository.findById(studentId, churchId);
    if (!student) return null;

    // Fetch the user associated with this student
    const user = await this.userRepository.findById(student.userId, churchId);
    return { ...student, user: user || undefined };
  }

  async listByChurch(
    churchId: string,
    options: ListStudentsOptions
  ): Promise<PaginatedResult<StudentWithUser>> {
    const result = await this.repository.listByChurch(churchId, options);

    // Fetch user data for all students
    const studentsWithUsers = await Promise.all(
      result.items.map(async (student) => {
        const user = await this.userRepository.findById(student.userId, churchId);
        return { ...student, user: user || undefined };
      })
    );

    return { items: studentsWithUsers, nextCursor: result.nextCursor };
  }

  async getByUserId(userId: string, churchId: string): Promise<StudentWithUser | null> {
    // Find student record by userId
    const result = await this.repository.listByChurch(churchId, { limit: 1000 });
    const student = result.items.find((s) => s.userId === userId);
    
    if (!student) return null;

    // Fetch the user associated with this student
    const user = await this.userRepository.findById(student.userId, churchId);
    return { ...student, user: user || undefined };
  }

  async create(
    data: Omit<Student, 'id' | 'createdAt' | 'updatedAt' | 'newBirthStatus' | 'firstStepsProgress'>
  ): Promise<Student> {
    const now = new Date().toISOString();

    // Initialize with default New Birth status (John 3:5 - born of water and Spirit)
    const newBirthStatus = {
      waterBaptism: { completed: false },
      holyGhost: { completed: false },
    };

    // Initialize First Steps progress
    const firstStepsProgress = {
      step1_foundations: { started: false, completed: false },
      step2_waterBaptism: { started: false, completed: false },
      step3_holyGhost: { started: false, completed: false },
      step4_prayer: { started: false, completed: false },
      step5_wordOfGod: { started: false, completed: false },
      step6_churchLife: { started: false, completed: false },
      step7_holiness: { started: false, completed: false },
      step8_evangelism: { started: false, completed: false },
    };

    return this.repository.create({
      ...data,
      newBirthStatus,
      firstStepsProgress,
      startDate: now,
      createdAt: now,
      updatedAt: now,
    });
  }

  async update(
    studentId: string,
    churchId: string,
    data: Partial<Student>
  ): Promise<Student> {
    return this.repository.update(studentId, churchId, {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  }

  async updateNewBirthMilestone(
    studentId: string,
    churchId: string,
    milestone: NewBirthMilestone
  ): Promise<Student> {
    const student = await this.repository.findById(studentId, churchId);
    if (!student) {
      throw new Error('Student not found');
    }

    const updatedStatus = {
      ...student.newBirthStatus,
      [milestone.milestone]: {
        completed: milestone.completed,
        date: milestone.date || (milestone.completed ? new Date().toISOString() : undefined),
        notes: milestone.notes,
      },
    };

    // Check if both milestones are complete (born of water AND Spirit - John 3:5)
    const allComplete =
      updatedStatus.waterBaptism.completed &&
      updatedStatus.holyGhost.completed;

    return this.repository.update(studentId, churchId, {
      newBirthStatus: updatedStatus,
      completionDate: allComplete ? new Date().toISOString() : undefined,
      updatedAt: new Date().toISOString(),
    });
  }

  async getNewBirthStats(churchId: string): Promise<NewBirthStats> {
    return this.repository.getNewBirthStats(churchId);
  }

  async getFirstStepsStats(churchId: string): Promise<{
    totalStudents: number;
    stepProgress: Record<string, { started: number; completed: number }>;
    averageCompletion: number;
    fullyCompleted: number;
  }> {
    return this.repository.getFirstStepsStats(churchId);
  }

  async updateFirstStep(
    studentId: string,
    churchId: string,
    step: string,
    data: { started?: boolean; completed?: boolean; notes?: string }
  ): Promise<Student> {
    const student = await this.repository.findById(studentId, churchId);
    if (!student) {
      throw new Error('Student not found');
    }

    const validSteps = [
      'step1_foundations',
      'step2_waterBaptism',
      'step3_holyGhost',
      'step4_prayer',
      'step5_wordOfGod',
      'step6_churchLife',
      'step7_holiness',
      'step8_evangelism',
    ];

    if (!validSteps.includes(step)) {
      throw new Error('Invalid step');
    }

    const stepKey = step as keyof typeof student.firstStepsProgress;
    const currentStep = student.firstStepsProgress[stepKey];
    const now = new Date().toISOString();

    const updatedStep = {
      ...currentStep,
      ...(data.started !== undefined && {
        started: data.started,
        startedDate: data.started ? now : undefined,
      }),
      ...(data.completed !== undefined && {
        completed: data.completed,
        completedDate: data.completed ? now : undefined,
      }),
      ...(data.notes !== undefined && { notes: data.notes }),
    };

    const updatedProgress = {
      ...student.firstStepsProgress,
      [step]: updatedStep,
    };

    return this.repository.update(studentId, churchId, {
      firstStepsProgress: updatedProgress,
      updatedAt: now,
    });
  }
}
