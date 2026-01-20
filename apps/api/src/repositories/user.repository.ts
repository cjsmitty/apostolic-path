import { docClient, Keys, TABLE_NAMES } from '@apostolic-path/database';
import type { ListUsersOptions, PaginatedResult, User } from '@apostolic-path/shared';
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
 * User Repository
 *
 * Handles all database operations for User entities.
 * All operations are scoped by church_id for multi-tenancy.
 */
export class UserRepository {
  async findById(userId: string, churchId: string): Promise<User | null> {
    const result = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAMES.MAIN,
        Key: Keys.user(churchId, userId),
      })
    );

    if (!result.Item) {
      return null;
    }

    return this.mapToUser(result.Item);
  }

  async findByEmail(email: string, churchId: string): Promise<User | null> {
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAMES.MAIN,
        IndexName: 'GSI2',
        KeyConditionExpression: 'GSI2PK = :pk',
        FilterExpression: 'churchId = :churchId',
        ExpressionAttributeValues: {
          ':pk': `EMAIL#${email.toLowerCase()}`,
          ':churchId': churchId,
        },
        Limit: 1,
      })
    );

    if (!result.Items || result.Items.length === 0) {
      return null;
    }

    const item = result.Items[0];
    if (!item) {
      return null;
    }

    return this.mapToUser(item);
  }

  async listByChurch(
    churchId: string,
    options: ListUsersOptions
  ): Promise<PaginatedResult<User>> {
    const { role, limit = 50, cursor } = options;
    const keyPrefix = Keys.prefixes.usersInChurch(churchId);

    const queryParams: QueryCommandInput = {
      TableName: TABLE_NAMES.MAIN,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': keyPrefix.PK,
        ':sk': keyPrefix.SKPrefix,
      },
      Limit: limit,
    };

    // Add role filter if specified
    if (role) {
      queryParams.FilterExpression = '#role = :role';
      queryParams.ExpressionAttributeNames = { '#role': 'role' };
      queryParams.ExpressionAttributeValues![':role'] = role;
    }

    // Add cursor for pagination
    if (cursor) {
      queryParams.ExclusiveStartKey = JSON.parse(Buffer.from(cursor, 'base64').toString());
    }

    const result = await docClient.send(new QueryCommand(queryParams));

    const items = (result.Items || []).map((item) => this.mapToUser(item));
    const nextCursor = result.LastEvaluatedKey
      ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64')
      : undefined;

    return { items, nextCursor };
  }

  async create(data: Omit<User, 'id'>): Promise<User> {
    const userId = nanoid();
    const user: User = {
      id: userId,
      ...data,
    };

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAMES.MAIN,
        Item: {
          ...Keys.user(data.churchId, userId),
          entityType: 'USER',
          ...user,
          GSI2PK: `EMAIL#${data.email.toLowerCase()}`,
          GSI2SK: `USER#${userId}`,
        },
      })
    );

    return user;
  }

  async update(userId: string, churchId: string, data: Partial<User>): Promise<User> {
    const updateExpressions: string[] = ['updatedAt = :updatedAt'];
    const expressionValues: Record<string, unknown> = {
      ':updatedAt': new Date().toISOString(),
    };
    const expressionNames: Record<string, string> = {};

    // Build update expression dynamically
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
        Key: Keys.user(churchId, userId),
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeNames: Object.keys(expressionNames).length > 0 ? expressionNames : undefined,
        ExpressionAttributeValues: expressionValues,
        ReturnValues: 'ALL_NEW',
      })
    );

    return this.mapToUser(result.Attributes!);
  }

  async delete(userId: string, churchId: string): Promise<void> {
    await docClient.send(
      new DeleteCommand({
        TableName: TABLE_NAMES.MAIN,
        Key: Keys.user(churchId, userId),
      })
    );
  }

  private mapToUser(item: Record<string, unknown>): User {
    return {
      id: item.id as string,
      churchId: item.churchId as string,
      email: item.email as string,
      firstName: item.firstName as string,
      lastName: item.lastName as string,
      phone: item.phone as string | undefined,
      role: item.role as User['role'],
      avatar: item.avatar as string | undefined,
      isActive: item.isActive as boolean,
      lastLoginAt: item.lastLoginAt as string | undefined,
      createdAt: item.createdAt as string,
      updatedAt: item.updatedAt as string,
    };
  }
}
