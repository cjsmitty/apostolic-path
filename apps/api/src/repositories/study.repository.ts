import { docClient, Keys, TABLE_NAMES } from '@apostolic-path/database';
import type { BibleStudy, ListStudiesOptions, PaginatedResult } from '@apostolic-path/shared';
import {
    DeleteCommand,
    GetCommand,
    PutCommand,
    QueryCommand,
    QueryCommandInput,
    UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { nanoid } from 'nanoid';

/**
 * Study Repository
 *
 * Handles all database operations for Bible Study entities.
 */
export class StudyRepository {
  async findById(studyId: string, churchId: string): Promise<BibleStudy | null> {
    const result = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAMES.MAIN,
        Key: Keys.study(churchId, studyId),
      })
    );

    if (!result.Item) {
      return null;
    }

    return this.mapToStudy(result.Item);
  }

  async listByChurch(
    churchId: string,
    options: ListStudiesOptions
  ): Promise<PaginatedResult<BibleStudy>> {
    const { status, teacherId, limit = 50, cursor } = options;
    const keyPrefix = Keys.prefixes.studiesInChurch(churchId);

    const queryParams: QueryCommandInput = {
      TableName: TABLE_NAMES.MAIN,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': keyPrefix.PK,
        ':sk': keyPrefix.SKPrefix,
      },
      Limit: limit,
    };

    const filters: string[] = [];
    if (status) {
      filters.push('#status = :status');
      queryParams.ExpressionAttributeNames = { ...queryParams.ExpressionAttributeNames, '#status': 'status' };
      queryParams.ExpressionAttributeValues![':status'] = status;
    }
    if (teacherId) {
      filters.push('teacherId = :teacherId');
      queryParams.ExpressionAttributeValues![':teacherId'] = teacherId;
    }

    if (filters.length > 0) {
      queryParams.FilterExpression = filters.join(' AND ');
    }

    if (cursor) {
      queryParams.ExclusiveStartKey = JSON.parse(Buffer.from(cursor, 'base64').toString());
    }

    const result = await docClient.send(new QueryCommand(queryParams));

    const items = (result.Items || []).map((item) => this.mapToStudy(item));
    const nextCursor = result.LastEvaluatedKey
      ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64')
      : undefined;

    return { items, nextCursor };
  }

  async listByTeacher(teacherId: string, churchId: string): Promise<BibleStudy[]> {
    const keyPrefix = Keys.prefixes.studiesInChurch(churchId);

    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAMES.MAIN,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        FilterExpression: 'teacherId = :teacherId',
        ExpressionAttributeValues: {
          ':pk': keyPrefix.PK,
          ':sk': keyPrefix.SKPrefix,
          ':teacherId': teacherId,
        },
      })
    );

    return (result.Items || []).map((item) => this.mapToStudy(item));
  }

  async listByStudent(studentId: string, churchId: string): Promise<BibleStudy[]> {
    const keyPrefix = Keys.prefixes.studiesInChurch(churchId);

    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAMES.MAIN,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        FilterExpression: 'contains(studentIds, :studentId)',
        ExpressionAttributeValues: {
          ':pk': keyPrefix.PK,
          ':sk': keyPrefix.SKPrefix,
          ':studentId': studentId,
        },
      })
    );

    return (result.Items || []).map((item) => this.mapToStudy(item));
  }

  async create(data: Omit<BibleStudy, 'id'>): Promise<BibleStudy> {
    const studyId = nanoid();
    const study: BibleStudy = {
      id: studyId,
      ...data,
    } as BibleStudy;

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAMES.MAIN,
        Item: {
          ...Keys.study(data.churchId, studyId),
          entityType: 'STUDY',
          ...study,
          GSI1PK: `CHURCH#${data.churchId}#STUDIES`,
          GSI1SK: studyId,
        },
      })
    );

    return study;
  }

  async update(studyId: string, churchId: string, data: Partial<BibleStudy>): Promise<BibleStudy> {
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
        Key: Keys.study(churchId, studyId),
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeNames: Object.keys(expressionNames).length > 0 ? expressionNames : undefined,
        ExpressionAttributeValues: expressionValues,
        ReturnValues: 'ALL_NEW',
      })
    );

    return this.mapToStudy(result.Attributes!);
  }

  async delete(studyId: string, churchId: string): Promise<void> {
    await docClient.send(
      new DeleteCommand({
        TableName: TABLE_NAMES.MAIN,
        Key: Keys.study(churchId, studyId),
      })
    );
  }

  private mapToStudy(item: Record<string, unknown>): BibleStudy {
    return {
      id: item.id as string,
      churchId: item.churchId as string,
      teacherId: item.teacherId as string,
      studentIds: item.studentIds as string[],
      title: item.title as string,
      curriculum: item.curriculum as BibleStudy['curriculum'],
      status: item.status as BibleStudy['status'],
      scheduledDay: item.scheduledDay as string | undefined,
      scheduledTime: item.scheduledTime as string | undefined,
      location: item.location as string | undefined,
      createdAt: item.createdAt as string,
      updatedAt: item.updatedAt as string,
    };
  }
}
