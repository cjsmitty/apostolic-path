/**
 * Student Entity (Discipleship Journey)
 *
 * Tracks a person's journey through the New Birth experience
 * and First Steps discipleship program.
 *
 * New Birth (John 3:5): Born of Water and Spirit
 * - Water Baptism: Baptism in Jesus' name (Acts 2:38)
 * - Holy Ghost: Evidenced by speaking in tongues (Acts 2:4)
 *
 * Note: Repentance is implied/prerequisite when either milestone is achieved.
 */

export interface MilestoneStatus {
  completed: boolean;
  date?: string;
  notes?: string;
}

/**
 * New Birth Status - John 3:5
 *
 * Tracks the two essential elements of the New Birth:
 * - Water Baptism in Jesus' name
 * - Receiving the Holy Ghost with evidence of speaking in tongues
 */
export interface NewBirthStatus {
  waterBaptism: MilestoneStatus;
  holyGhost: MilestoneStatus;
}

export interface StepProgress {
  started: boolean;
  startedDate?: string;
  completed: boolean;
  completedDate?: string;
  mentorId?: string;
  notes?: string;
}

export interface FirstStepsProgress {
  step1_foundations: StepProgress;
  step2_waterBaptism: StepProgress;
  step3_holyGhost: StepProgress;
  step4_prayer: StepProgress;
  step5_wordOfGod: StepProgress;
  step6_churchLife: StepProgress;
  step7_holiness: StepProgress;
  step8_evangelism: StepProgress;
}

export interface Student {
  id: string;
  churchId: string;
  userId: string;
  assignedTeacherId?: string;
  newBirthStatus: NewBirthStatus;
  firstStepsProgress: FirstStepsProgress;
  startDate: string;
  completionDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NewBirthMilestone {
  milestone: 'waterBaptism' | 'holyGhost';
  completed: boolean;
  date?: string;
  notes?: string;
}

export interface NewBirthStats {
  totalStudents: number;
  awaitingBaptism: number;
  awaitingHolyGhost: number;
  completedNewBirth: number;
  baptismsThisMonth: number;
  holyGhostThisMonth: number;
}

export interface ListStudentsOptions {
  status?: string;
  teacherId?: string;
  limit?: number;
  cursor?: string;
}
