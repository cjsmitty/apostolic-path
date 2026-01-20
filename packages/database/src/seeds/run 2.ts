/**
 * Database Seed Script
 *
 * Creates DynamoDB tables and populates with sample data for development.
 */

import { CreateTableCommand, DescribeTableCommand, DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { createTableDefinitions, Keys, TABLE_NAMES } from '../tables.js';

// Pre-computed hash for password "testpass123" with 12 salt rounds
const TEST_PASSWORD_HASH = '$2b$12$k1f5vHjr7TM4p0fv0hKuAOOK0FuA9vV4SYOimdsdRhlXe0oEZHPEO';

const ENDPOINT = process.env.DYNAMODB_ENDPOINT || 'http://localhost:8000';

const dynamoClient = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  endpoint: ENDPOINT,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'local',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'local',
  },
});

// Create document client with same config
const docClient = DynamoDBDocumentClient.from(dynamoClient, {
  marshallOptions: {
    removeUndefinedValues: true,
    convertClassInstanceToMap: true,
  },
  unmarshallOptions: {
    wrapNumbers: false,
  },
});

console.log(`Using DynamoDB endpoint: ${ENDPOINT}`);

async function tableExists(tableName: string): Promise<boolean> {
  try {
    await dynamoClient.send(new DescribeTableCommand({ TableName: tableName }));
    return true;
  } catch (error) {
    return false;
  }
}

async function createTables() {
  console.log('Creating DynamoDB tables...');

  const tableDefinitions = createTableDefinitions();

  for (const definition of tableDefinitions) {
    const tableName = definition.TableName!;

    if (await tableExists(tableName)) {
      console.log(`  ✓ Table ${tableName} already exists`);
      continue;
    }

    try {
      await dynamoClient.send(new CreateTableCommand(definition));
      console.log(`  ✓ Created table ${tableName}`);
    } catch (error) {
      console.error(`  ✗ Failed to create table ${tableName}:`, error);
    }
  }
}

async function seedData() {
  console.log('\nSeeding sample data...');

  const now = new Date().toISOString();
  const churchId = 'demo-church-001';
  const churchId2 = 'demo-church-002';

  // Sample church (Main Campus)
  const church = {
    ...Keys.church(churchId),
    entityType: 'CHURCH',
    id: churchId,
    name: 'First Apostolic Church',
    slug: 'first-apostolic',
    address: {
      street: '123 Faith Street',
      city: 'Austin',
      state: 'TX',
      zip: '78701',
      country: 'USA',
    },
    pastorId: 'user-pastor-001',
    pastorName: 'Pastor John Smith',
    phone: '(512) 555-0100',
    email: 'pastor@firstapostolic.church',
    settings: {
      timezone: 'America/Chicago',
      firstDayOfWeek: 0,
      enabledCurriculums: ['search-for-truth', 'exploring-gods-word'],
    },
    subscription: 'growth',
    createdAt: now,
    updatedAt: now,
    GSI1PK: 'CHURCHES',
    GSI1SK: `CHURCH#${churchId}`,
  };

  // Second church (North Campus)
  const church2 = {
    ...Keys.church(churchId2),
    entityType: 'CHURCH',
    id: churchId2,
    name: 'First Apostolic - North Campus',
    slug: 'first-apostolic-north',
    address: {
      street: '456 Grace Avenue',
      city: 'Round Rock',
      state: 'TX',
      zip: '78664',
      country: 'USA',
    },
    pastorId: 'user-pastor-001',
    pastorName: 'Pastor John Smith',
    phone: '(512) 555-0200',
    email: 'north@firstapostolic.church',
    settings: {
      timezone: 'America/Chicago',
      firstDayOfWeek: 0,
      enabledCurriculums: ['search-for-truth', 'exploring-gods-word'],
    },
    subscription: 'growth',
    createdAt: now,
    updatedAt: now,
    GSI1PK: 'CHURCHES',
    GSI1SK: `CHURCH#${churchId2}`,
  };

  // Sample users (with password hash for "testpass123")
  const users = [
    {
      ...Keys.user(churchId, 'user-pastor-001'),
      entityType: 'USER',
      id: 'user-pastor-001',
      churchId,
      churchIds: [churchId, churchId2], // Pastor has access to both campuses
      email: 'pastor@firstapostolic.church',
      passwordHash: TEST_PASSWORD_HASH,
      firstName: 'John',
      lastName: 'Smith',
      role: 'pastor',
      isActive: true,
      createdAt: now,
      updatedAt: now,
      GSI2PK: 'EMAIL#pastor@firstapostolic.church',
      GSI2SK: `USER#user-pastor-001`,
    },
    {
      ...Keys.user(churchId, 'user-teacher-001'),
      entityType: 'USER',
      id: 'user-teacher-001',
      churchId,
      email: 'sarah.teacher@email.com',
      passwordHash: TEST_PASSWORD_HASH,
      firstName: 'Sarah',
      lastName: 'Johnson',
      role: 'teacher',
      isActive: true,
      createdAt: now,
      updatedAt: now,
      GSI2PK: 'EMAIL#sarah.teacher@email.com',
      GSI2SK: `USER#user-teacher-001`,
    },
    {
      ...Keys.user(churchId, 'user-student-001'),
      entityType: 'USER',
      id: 'user-student-001',
      churchId,
      email: 'mike.newbeliever@email.com',
      passwordHash: TEST_PASSWORD_HASH,
      firstName: 'Mike',
      lastName: 'Williams',
      role: 'student',
      isActive: true,
      createdAt: now,
      updatedAt: now,
      GSI2PK: 'EMAIL#mike.newbeliever@email.com',
      GSI2SK: `USER#user-student-001`,
    },
  ];

  // Sample student record
  const student = {
    ...Keys.student(churchId, 'student-001'),
    entityType: 'STUDENT',
    id: 'student-001',
    churchId,
    userId: 'user-student-001',
    assignedTeacherId: 'user-teacher-001',
    newBirthStatus: {
      waterBaptism: { completed: true, date: '2026-01-12T14:00:00Z', notes: 'Baptized in Jesus Name' },
      holyGhost: { completed: false },
    },
    firstStepsProgress: {
      step1_foundations: { started: true, completed: true, completedDate: '2026-01-15T10:00:00Z' },
      step2_waterBaptism: { started: true, completed: true, completedDate: '2026-01-12T14:00:00Z' },
      step3_holyGhost: { started: true, completed: false },
      step4_prayer: { started: false, completed: false },
      step5_wordOfGod: { started: false, completed: false },
      step6_churchLife: { started: false, completed: false },
      step7_holiness: { started: false, completed: false },
      step8_evangelism: { started: false, completed: false },
    },
    startDate: '2026-01-10T10:00:00Z',
    createdAt: now,
    updatedAt: now,
    GSI1PK: `CHURCH#${churchId}#STUDENTS`,
    GSI1SK: 'student-001',
  };

  // Sample study
  const study = {
    ...Keys.study(churchId, 'study-001'),
    entityType: 'STUDY',
    id: 'study-001',
    churchId,
    teacherId: 'user-teacher-001',
    studentIds: ['user-student-001'],
    title: 'Search for Truth with Mike',
    curriculum: 'search-for-truth',
    status: 'in-progress',
    scheduledDay: 'Tuesday',
    scheduledTime: '7:00 PM',
    location: 'Church Office',
    createdAt: now,
    updatedAt: now,
    GSI1PK: `CHURCH#${churchId}#STUDIES`,
    GSI1SK: 'study-001',
  };

  // Sample lessons
  const lessons = [
    {
      ...Keys.lesson('study-001', 'lesson-001'),
      entityType: 'LESSON',
      id: 'lesson-001',
      studyId: 'study-001',
      lessonNumber: 1,
      lessonTitle: 'The Bible',
      status: 'completed',
      completedDate: '2026-01-14T19:00:00Z',
      teacherNotes: 'Great discussion about biblical authority',
      createdAt: now,
      updatedAt: now,
    },
    {
      ...Keys.lesson('study-001', 'lesson-002'),
      entityType: 'LESSON',
      id: 'lesson-002',
      studyId: 'study-001',
      lessonNumber: 2,
      lessonTitle: 'God',
      status: 'in-progress',
      createdAt: now,
      updatedAt: now,
    },
  ];

  // Insert all data
  const allItems = [church, church2, ...users, student, study, ...lessons];

  for (const item of allItems) {
    try {
      await docClient.send(
        new PutCommand({
          TableName: TABLE_NAMES.MAIN,
          Item: item,
        })
      );
      console.log(`  ✓ Inserted ${item.entityType}: ${item.id || 'METADATA'}`);
    } catch (error) {
      console.error(`  ✗ Failed to insert ${item.entityType}:`, error);
    }
  }
}

async function run() {
  console.log('🌱 Apostolic Path Database Seeder\n');

  try {
    await createTables();
    await seedData();
    console.log('\n✅ Database seeding complete!');
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  }
}

run();
