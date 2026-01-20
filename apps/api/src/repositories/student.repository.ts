import { docClient, Keys, TABLE_NAMES } from '@apostolic-path/database';
import type {
    ListStudentsOptions,
    NewBirthStats,
    PaginatedResult,
    Student,
} from '@apostolic-path/shared';
import { GetCommand, PutCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { nanoid } from 'nanoid';

/**
 * Student Repository
 *
 * Handles all database operations for Student (new believer) entities.
 * Tracks the New Birth journey and First Steps progress.
 */
export class StudentRepository {
  async findById(studentId: string, churchId: string): Promise<Student | null> {
    const result = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAMES.MAIN,
        Key: Keys.student(churchId, studentId),
      })
    );

    if (!result.Item) {
      return null;
    }

    return this.mapToStudent(result.Item);
  }

  async listByChurch(
    churchId: string,
    options: ListStudentsOptions
  ): Promise<PaginatedResult<Student>> {
    const { status, teacherId, limit = 50, cursor } = options;
    const keyPrefix = Keys.prefixes.studentsInChurch(churchId);

    const queryParams: Parameters<typeof QueryCommand>[0] = {
      TableName: TABLE_NAMES.MAIN,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': keyPrefix.PK,
        ':sk': keyPrefix.SKPrefix,
      },
      Limit: limit,
    };

    const filters: string[] = [];
    if (teacherId) {
      filters.push('assignedTeacherId = :teacherId');
      queryParams.ExpressionAttributeValues![':teacherId'] = teacherId;
    }
    if (status === 'active') {
      filters.push('attribute_not_exists(completionDate)');
    } else if (status === 'completed') {
      filters.push('attribute_exists(completionDate)');
    }

    if (filters.length > 0) {
      queryParams.FilterExpression = filters.join(' AND ');
    }

    if (cursor) {
      queryParams.ExclusiveStartKey = JSON.parse(Buffer.from(cursor, 'base64').toString());
    }

    const result = await docClient.send(new QueryCommand(queryParams));

    const items = (result.Items || []).map((item) => this.mapToStudent(item));
    const nextCursor = result.LastEvaluatedKey
      ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64')
      : undefined;

    return { items, nextCursor };
  }

  async listByTeacher(teacherId: string, churchId: string): Promise<Student[]> {
    const keyPrefix = Keys.prefixes.studentsInChurch(churchId);

    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAMES.MAIN,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        FilterExpression: 'assignedTeacherId = :teacherId',
        ExpressionAttributeValues: {
          ':pk': keyPrefix.PK,
          ':sk': keyPrefix.SKPrefix,
          ':teacherId': teacherId,
        },
      })
    );

    return (result.Items || []).map((item) => this.mapToStudent(item));
  }

  async create(data: Omit<Student, 'id'>): Promise<Student> {
    const studentId = nanoid();
    const student: Student = {
      id: studentId,
      ...data,
    } as Student;

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAMES.MAIN,
        Item: {
          ...Keys.student(data.churchId, studentId),
          entityType: 'STUDENT',
          ...student,
          GSI1PK: `CHURCH#${data.churchId}#STUDENTS`,
          GSI1SK: studentId,
        },
      })
    );

    return student;
  }

  async update(studentId: string, churchId: string, data: Partial<Student>): Promise<Student> {
    const updateExpressions: string[] = ['updatedAt = :updatedAt'];
    const expressionValues: Record<string, unknown> = {
      ':updatedAt': new Date().toISOString(),
    };
    const expressionNames: Record<string, string> = {};

    Object.entries(data).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'churchId' && value !== undefined) {
        const attrName = `#${key}`;
        const attrValue = `:${key}`;
        expressionNames[attrName] = key;
        expressionValues[attrValue] = value;
        updateExpressions.push(`${attrName} = ${attrValue}`);
      }
    });

    const result = await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAMES.MAIN,
        Key: Keys.student(churchId, studentId),
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeNames: Object.keys(expressionNames).length > 0 ? expressionNames : undefined,
        ExpressionAttributeValues: expressionValues,
        ReturnValues: 'ALL_NEW',
      })
    );

    return this.mapToStudent(result.Attributes!);
  }

  async getNewBirthStats(churchId: string): Promise<NewBirthStats> {
    const keyPrefix = Keys.prefixes.studentsInChurch(churchId);

    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAMES.MAIN,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': keyPrefix.PK,
          ':sk': keyPrefix.SKPrefix,
        },
      })
    );

    const students = (result.Items || []).map((item) => this.mapToStudent(item));
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const stats: NewBirthStats = {
      totalStudents: students.length,
      awaitingBaptism: 0,
      awaitingHolyGhost: 0,
      completedNewBirth: 0,
      baptismsThisMonth: 0,
      holyGhostThisMonth: 0,
    };

    for (const student of students) {
      const { waterBaptism, holyGhost } = student.newBirthStatus;

      if (!waterBaptism.completed) {
        stats.awaitingBaptism++;
      } else if (!holyGhost.completed) {
        stats.awaitingHolyGhost++;
      } else {
        stats.completedNewBirth++;
      }

      if (waterBaptism.date && waterBaptism.date >= startOfMonth) {
        stats.baptismsThisMonth++;
      }
      if (holyGhost.date && holyGhost.date >= startOfMonth) {
        stats.holyGhostThisMonth++;
      }
    }

    return stats;
  }

  async getFirstStepsStats(churchId: string): Promise<{
    totalStudents: number;
    stepProgress: Record<string, { started: number; completed: number }>;
    averageCompletion: number;
    fullyCompleted: number;
  }> {
    const keyPrefix = Keys.prefixes.studentsInChurch(churchId);

    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAMES.MAIN,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': keyPrefix.PK,
          ':sk': keyPrefix.SKPrefix,
        },
      })
    );

    const students = (result.Items || []).map((item) => this.mapToStudent(item));
    const steps = [
      'step1_foundations',
      'step2_waterBaptism',
      'step3_holyGhost',
      'step4_prayer',
      'step5_wordOfGod',
      'step6_churchLife',
      'step7_holiness',
      'step8_evangelism',
    ];

    const stepProgress: Record<string, { started: number; completed: number }> = {};
    steps.forEach((step) => {
      stepProgress[step] = { started: 0, completed: 0 };
    });

    let totalCompletion = 0;
    let fullyCompleted = 0;

    for (const student of students) {
      if (!student.firstStepsProgress) continue;

      let studentCompleted = 0;
      let allComplete = true;

      for (const step of steps) {
        const progress = student.firstStepsProgress[step as keyof typeof student.firstStepsProgress];
        if (progress?.started) {
          stepProgress[step].started++;
        }
        if (progress?.completed) {
          stepProgress[step].completed++;
          studentCompleted++;
        } else {
          allComplete = false;
        }
      }

      if (allComplete) {
        fullyCompleted++;
      }
      totalCompletion += studentCompleted;
    }

    const totalPossible = students.length * steps.length;
    const averageCompletion = totalPossible > 0 ? Math.round((totalCompletion / totalPossible) * 100) : 0;

    return {
      totalStudents: students.length,
      stepProgress,
      averageCompletion,
      fullyCompleted,
    };
  }

  private mapToStudent(item: Record<string, unknown>): Student {
    return {
      id: item.id as string,
      churchId: item.churchId as string,
      userId: item.userId as string,
      assignedTeacherId: item.assignedTeacherId as string | undefined,
      newBirthStatus: item.newBirthStatus as Student['newBirthStatus'],
      firstStepsProgress: item.firstStepsProgress as Student['firstStepsProgress'],
      startDate: item.startDate as string,
      completionDate: item.completionDate as string | undefined,
      createdAt: item.createdAt as string,
      updatedAt: item.updatedAt as string,
    };
  }
}
