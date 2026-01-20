import { docClient, Keys, TABLE_NAMES } from '@apostolic-path/database';
import type { LessonProgress } from '@apostolic-path/shared';
import {
    BatchWriteCommand,
    GetCommand,
    PutCommand,
    QueryCommand,
    UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { nanoid } from 'nanoid';

/**
 * Lesson Repository
 *
 * Handles all database operations for Lesson Progress entities.
 */
export class LessonRepository {
  async findById(lessonId: string, studyId: string): Promise<LessonProgress | null> {
    const result = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAMES.MAIN,
        Key: Keys.lesson(studyId, lessonId),
      })
    );

    if (!result.Item) {
      return null;
    }

    return this.mapToLesson(result.Item);
  }

  async listByStudy(studyId: string): Promise<LessonProgress[]> {
    const keyPrefix = Keys.prefixes.lessonsInStudy(studyId);

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

    // Sort by lesson number
    const lessons = (result.Items || []).map((item) => this.mapToLesson(item));
    return lessons.sort((a, b) => a.lessonNumber - b.lessonNumber);
  }

  async create(data: Omit<LessonProgress, 'id'>): Promise<LessonProgress> {
    const lessonId = nanoid();
    const lesson: LessonProgress = {
      id: lessonId,
      ...data,
    };

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAMES.MAIN,
        Item: {
          ...Keys.lesson(data.studyId, lessonId),
          entityType: 'LESSON',
          ...lesson,
        },
      })
    );

    return lesson;
  }

  async update(lessonId: string, studyId: string, data: Partial<LessonProgress>): Promise<LessonProgress> {
    const updateExpressions: string[] = ['updatedAt = :updatedAt'];
    const expressionValues: Record<string, unknown> = {
      ':updatedAt': new Date().toISOString(),
    };
    const expressionNames: Record<string, string> = {};

    Object.entries(data).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'studyId' && value !== undefined) {
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
        Key: Keys.lesson(studyId, lessonId),
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeNames: Object.keys(expressionNames).length > 0 ? expressionNames : undefined,
        ExpressionAttributeValues: expressionValues,
        ReturnValues: 'ALL_NEW',
      })
    );

    return this.mapToLesson(result.Attributes!);
  }

  async bulkCreate(lessons: Array<Omit<LessonProgress, 'id'>>): Promise<LessonProgress[]> {
    const createdLessons: LessonProgress[] = lessons.map((lesson) => ({
      id: nanoid(),
      ...lesson,
    }));

    // DynamoDB batch write max is 25 items
    const batches: LessonProgress[][] = [];
    for (let i = 0; i < createdLessons.length; i += 25) {
      batches.push(createdLessons.slice(i, i + 25));
    }

    for (const batch of batches) {
      await docClient.send(
        new BatchWriteCommand({
          RequestItems: {
            [TABLE_NAMES.MAIN]: batch.map((lesson) => ({
              PutRequest: {
                Item: {
                  ...Keys.lesson(lesson.studyId, lesson.id),
                  entityType: 'LESSON',
                  ...lesson,
                },
              },
            })),
          },
        })
      );
    }

    return createdLessons;
  }

  private mapToLesson(item: Record<string, unknown>): LessonProgress {
    return {
      id: item.id as string,
      studyId: item.studyId as string,
      lessonNumber: item.lessonNumber as number,
      lessonTitle: item.lessonTitle as string,
      status: item.status as LessonProgress['status'],
      completedDate: item.completedDate as string | undefined,
      teacherNotes: item.teacherNotes as string | undefined,
      studentNotes: item.studentNotes as string | undefined,
      attachments: item.attachments as string[] | undefined,
      createdAt: item.createdAt as string,
      updatedAt: item.updatedAt as string,
    };
  }
}
