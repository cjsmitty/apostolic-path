import { docClient, Keys, TABLE_NAMES } from '@apostolic-path/database';
import type { Church, UserWithPassword } from '@apostolic-path/shared';
import { GetCommand, PutCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { nanoid } from 'nanoid';

/**
 * Auth Repository
 *
 * Handles database operations for authentication.
 * Uses GSI2 for email lookups.
 */
export class AuthRepository {
  /**
   * Find user by email (uses GSI2)
   */
  async findByEmail(email: string): Promise<UserWithPassword | null> {
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAMES.MAIN,
        IndexName: 'GSI2',
        KeyConditionExpression: 'GSI2PK = :pk',
        ExpressionAttributeValues: {
          ':pk': `EMAIL#${email.toLowerCase()}`,
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

  /**
   * Find user by ID
   */
  async findById(userId: string, churchId: string): Promise<UserWithPassword | null> {
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

  /**
   * Find church by ID
   */
  async findChurchById(churchId: string): Promise<Church | null> {
    const result = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAMES.MAIN,
        Key: Keys.church(churchId),
      })
    );

    if (!result.Item) {
      return null;
    }

    return result.Item as Church;
  }

  /**
   * Create a new user
   */
  async createUser(data: Omit<UserWithPassword, 'id'>): Promise<UserWithPassword> {
    const userId = nanoid();
    const user: UserWithPassword = {
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
          // GSI2 for email lookup
          GSI2PK: `EMAIL#${data.email.toLowerCase()}`,
          GSI2SK: `USER#${userId}`,
        },
        // Ensure email doesn't already exist
        ConditionExpression: 'attribute_not_exists(PK)',
      })
    );

    return user;
  }

  /**
   * Update last login timestamp
   */
  async updateLastLogin(userId: string, churchId: string): Promise<void> {
    await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAMES.MAIN,
        Key: Keys.user(churchId, userId),
        UpdateExpression: 'SET lastLoginAt = :now, updatedAt = :now',
        ExpressionAttributeValues: {
          ':now': new Date().toISOString(),
        },
      })
    );
  }

  /**
   * Update user password
   */
  async updatePassword(userId: string, churchId: string, passwordHash: string): Promise<void> {
    await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAMES.MAIN,
        Key: Keys.user(churchId, userId),
        UpdateExpression: 'SET passwordHash = :hash, updatedAt = :now',
        ExpressionAttributeValues: {
          ':hash': passwordHash,
          ':now': new Date().toISOString(),
        },
      })
    );
  }

  private mapToUser(item: Record<string, unknown>): UserWithPassword {
    return {
      id: item.id as string,
      churchId: item.churchId as string,
      churchIds: item.churchIds as string[] | undefined,
      email: item.email as string,
      firstName: item.firstName as string,
      lastName: item.lastName as string,
      phone: item.phone as string | undefined,
      role: item.role as UserWithPassword['role'],
      avatar: item.avatar as string | undefined,
      isActive: item.isActive as boolean,
      passwordHash: item.passwordHash as string,
      lastLoginAt: item.lastLoginAt as string | undefined,
      createdAt: item.createdAt as string,
      updatedAt: item.updatedAt as string,
    };
  }
}
