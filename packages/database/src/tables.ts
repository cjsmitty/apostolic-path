import type { CreateTableCommandInput } from '@aws-sdk/client-dynamodb';

const TABLE_PREFIX = process.env.DYNAMODB_TABLE_PREFIX || 'apostolic-path';

export const TABLE_NAMES = {
  MAIN: `${TABLE_PREFIX}-main`,
} as const;

/**
 * Single-Table Design for Apostolic Path
 *
 * Primary Key Structure:
 * - PK: Partition Key (e.g., "CHURCH#123")
 * - SK: Sort Key (e.g., "USER#456")
 *
 * Global Secondary Indexes:
 * - GSI1: For queries by entity type across churches (admin only)
 * - GSI2: For queries by user email
 *
 * Access Patterns:
 * 1. Get church by ID: PK = CHURCH#id, SK = METADATA
 * 2. List users in church: PK = CHURCH#id, SK begins_with USER#
 * 3. Get user by ID: PK = CHURCH#id, SK = USER#id
 * 4. List students in church: PK = CHURCH#id, SK begins_with STUDENT#
 * 5. List studies in church: PK = CHURCH#id, SK begins_with STUDY#
 * 6. List lessons in study: PK = STUDY#id, SK begins_with LESSON#
 */

export function createTableDefinitions(): CreateTableCommandInput[] {
  return [
    {
      TableName: TABLE_NAMES.MAIN,
      KeySchema: [
        { AttributeName: 'PK', KeyType: 'HASH' },
        { AttributeName: 'SK', KeyType: 'RANGE' },
      ],
      AttributeDefinitions: [
        { AttributeName: 'PK', AttributeType: 'S' },
        { AttributeName: 'SK', AttributeType: 'S' },
        { AttributeName: 'GSI1PK', AttributeType: 'S' },
        { AttributeName: 'GSI1SK', AttributeType: 'S' },
        { AttributeName: 'GSI2PK', AttributeType: 'S' },
        { AttributeName: 'GSI2SK', AttributeType: 'S' },
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'GSI1',
          KeySchema: [
            { AttributeName: 'GSI1PK', KeyType: 'HASH' },
            { AttributeName: 'GSI1SK', KeyType: 'RANGE' },
          ],
          Projection: { ProjectionType: 'ALL' },
          ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5,
          },
        },
        {
          IndexName: 'GSI2',
          KeySchema: [
            { AttributeName: 'GSI2PK', KeyType: 'HASH' },
            { AttributeName: 'GSI2SK', KeyType: 'RANGE' },
          ],
          Projection: { ProjectionType: 'ALL' },
          ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5,
          },
        },
      ],
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5,
      },
    },
  ];
}

/**
 * Key Builders
 *
 * Helper functions to construct DynamoDB keys consistently.
 */
export const Keys = {
  church: (churchId: string) => ({
    PK: `CHURCH#${churchId}`,
    SK: 'METADATA',
  }),

  user: (churchId: string, userId: string) => ({
    PK: `CHURCH#${churchId}`,
    SK: `USER#${userId}`,
  }),

  student: (churchId: string, studentId: string) => ({
    PK: `CHURCH#${churchId}`,
    SK: `STUDENT#${studentId}`,
  }),

  study: (churchId: string, studyId: string) => ({
    PK: `CHURCH#${churchId}`,
    SK: `STUDY#${studyId}`,
  }),

  lesson: (studyId: string, lessonId: string) => ({
    PK: `STUDY#${studyId}`,
    SK: `LESSON#${lessonId}`,
  }),

  // Prefix patterns for queries
  prefixes: {
    usersInChurch: (churchId: string) => ({
      PK: `CHURCH#${churchId}`,
      SKPrefix: 'USER#',
    }),
    studentsInChurch: (churchId: string) => ({
      PK: `CHURCH#${churchId}`,
      SKPrefix: 'STUDENT#',
    }),
    studiesInChurch: (churchId: string) => ({
      PK: `CHURCH#${churchId}`,
      SKPrefix: 'STUDY#',
    }),
    lessonsInStudy: (studyId: string) => ({
      PK: `STUDY#${studyId}`,
      SKPrefix: 'LESSON#',
    }),
  },
};
