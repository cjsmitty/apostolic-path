import { docClient, Keys, TABLE_NAMES } from '@apostolic-path/database';
import type { Church, ChurchStats } from '@apostolic-path/shared';
import { GetCommand, PutCommand, QueryCommand, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { nanoid } from 'nanoid';

/**
 * Church Repository
 *
 * Handles all database operations for Church entities.
 */
export class ChurchRepository {
  async findById(churchId: string): Promise<Church | null> {
    const result = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAMES.MAIN,
        Key: Keys.church(churchId),
      })
    );

    if (!result.Item || !result.Item.id) {
      return null;
    }

    return this.mapToChurch(result.Item);
  }

  async findBySlug(slug: string): Promise<Church | null> {
    // Use GSI1 for slug lookups
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAMES.MAIN,
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :pk',
        ExpressionAttributeValues: {
          ':pk': `SLUG#${slug}`,
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

    return this.mapToChurch(item);
  }

  /**
   * List all churches (for platform admins only)
   */
  async listAll(): Promise<Church[]> {
    const result = await docClient.send(
      new ScanCommand({
        TableName: TABLE_NAMES.MAIN,
        FilterExpression: 'entityType = :type',
        ExpressionAttributeValues: {
          ':type': 'CHURCH',
        },
      })
    );

    return (result.Items || []).map((item) => this.mapToChurch(item));
  }

  async create(data: Omit<Church, 'id'>): Promise<Church> {
    const churchId = nanoid();
    const church: Church = {
      id: churchId,
      ...data,
    } as Church;

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAMES.MAIN,
        Item: {
          ...Keys.church(churchId),
          entityType: 'CHURCH',
          ...church,
          GSI1PK: `SLUG#${data.slug}`,
          GSI1SK: churchId,
        },
      })
    );

    return church;
  }

  async update(churchId: string, data: Partial<Church>): Promise<Church> {
    const updateExpressions: string[] = ['updatedAt = :updatedAt'];
    const expressionValues: Record<string, unknown> = {
      ':updatedAt': new Date().toISOString(),
    };
    const expressionNames: Record<string, string> = {};

    Object.entries(data).forEach(([key, value]) => {
      if (key !== 'id' && value !== undefined) {
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
        Key: Keys.church(churchId),
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeNames: Object.keys(expressionNames).length > 0 ? expressionNames : undefined,
        ExpressionAttributeValues: expressionValues,
        ReturnValues: 'ALL_NEW',
      })
    );

    return this.mapToChurch(result.Attributes!);
  }

  async getStats(churchId: string): Promise<ChurchStats> {
    // Query students and studies to calculate stats
    const [studentsResult, studiesResult] = await Promise.all([
      docClient.send(
        new QueryCommand({
          TableName: TABLE_NAMES.MAIN,
          KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
          ExpressionAttributeValues: {
            ':pk': `CHURCH#${churchId}`,
            ':sk': 'STUDENT#',
          },
        })
      ),
      docClient.send(
        new QueryCommand({
          TableName: TABLE_NAMES.MAIN,
          KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
          ExpressionAttributeValues: {
            ':pk': `CHURCH#${churchId}`,
            ':sk': 'STUDY#',
          },
        })
      ),
    ]);

    const students = studentsResult.Items || [];
    const studies = studiesResult.Items || [];

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    let completedJourneys = 0;
    let baptismsThisMonth = 0;
    let holyGhostThisMonth = 0;

    for (const student of students) {
      const newBirthStatus = student.newBirthStatus as {
        waterBaptism: { completed: boolean; date?: string };
        holyGhost: { completed: boolean; date?: string };
      };

      // New Birth is complete when both water baptism and Holy Ghost are achieved
      if (
        newBirthStatus.waterBaptism.completed &&
        newBirthStatus.holyGhost.completed
      ) {
        completedJourneys++;
      }

      if (newBirthStatus.waterBaptism.date && newBirthStatus.waterBaptism.date >= startOfMonth) {
        baptismsThisMonth++;
      }
      if (newBirthStatus.holyGhost.date && newBirthStatus.holyGhost.date >= startOfMonth) {
        holyGhostThisMonth++;
      }
    }

    const activeStudies = studies.filter((s) => s.status === 'in-progress').length;

    return {
      totalStudents: students.length,
      activeStudies,
      completedJourneys,
      baptismsThisMonth,
      holyGhostThisMonth,
    };
  }

  private mapToChurch(item: Record<string, unknown>): Church {
    return {
      id: item.id as string,
      name: item.name as string,
      slug: item.slug as string,
      address: item.address as Church['address'],
      phone: item.phone as string | undefined,
      email: item.email as string | undefined,
      website: item.website as string | undefined,
      pastorId: item.pastorId as string,
      settings: item.settings as Church['settings'],
      subscription: item.subscription as Church['subscription'],
      createdAt: item.createdAt as string,
      updatedAt: item.updatedAt as string,
    };
  }
}
