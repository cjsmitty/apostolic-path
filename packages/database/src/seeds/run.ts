/**
 * Database Seed Script
 *
 * Creates DynamoDB tables and populates with sample data for development.
 * Includes multiple churches with diverse student data.
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

// Helper to create a date in the past
function daysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

async function seedData() {
  console.log('\nSeeding sample data...');

  const now = new Date().toISOString();
  
  // ============================================
  // CHURCH 1: First Apostolic Church (Austin, TX)
  // ============================================
  const church1Id = 'demo-church-001';
  const church1 = {
    ...Keys.church(church1Id),
    entityType: 'CHURCH',
    id: church1Id,
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
    GSI1SK: `CHURCH#${church1Id}`,
  };

  // ============================================
  // CHURCH 2: First Apostolic - North Campus (Round Rock, TX)
  // ============================================
  const church2Id = 'demo-church-002';
  const church2 = {
    ...Keys.church(church2Id),
    entityType: 'CHURCH',
    id: church2Id,
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
    GSI1SK: `CHURCH#${church2Id}`,
  };

  // ============================================
  // CHURCH 3: Grace Apostolic Fellowship (Houston, TX)
  // ============================================
  const church3Id = 'demo-church-003';
  const church3 = {
    ...Keys.church(church3Id),
    entityType: 'CHURCH',
    id: church3Id,
    name: 'Grace Apostolic Fellowship',
    slug: 'grace-apostolic',
    address: {
      street: '789 Spirit Way',
      city: 'Houston',
      state: 'TX',
      zip: '77001',
      country: 'USA',
    },
    pastorId: 'user-pastor-002',
    pastorName: 'Pastor David Martinez',
    phone: '(713) 555-0300',
    email: 'pastor@graceapostolic.org',
    settings: {
      timezone: 'America/Chicago',
      firstDayOfWeek: 0,
      enabledCurriculums: ['search-for-truth'],
    },
    subscription: 'starter',
    createdAt: now,
    updatedAt: now,
    GSI1PK: 'CHURCHES',
    GSI1SK: `CHURCH#${church3Id}`,
  };

  // ============================================
  // PLATFORM ADMIN (System-wide admin)
  // ============================================
  const platformAdmin = {
    ...Keys.user('SYSTEM', 'user-platform-admin-001'),
    entityType: 'USER',
    id: 'user-platform-admin-001',
    churchId: 'SYSTEM',
    churchIds: [church1Id, church2Id, church3Id], // Has access to all churches
    email: 'admin@apostolicpath.com',
    passwordHash: TEST_PASSWORD_HASH,
    firstName: 'System',
    lastName: 'Administrator',
    phone: '(888) 555-0000',
    role: 'platform_admin',
    isActive: true,
    createdAt: now,
    updatedAt: now,
    GSI2PK: 'EMAIL#admin@apostolicpath.com',
    GSI2SK: 'USER#user-platform-admin-001',
  };

  // ============================================
  // USERS - CHURCH 1 (First Apostolic - Austin)
  // ============================================
  const church1Users = [
    // Church Admin (different from pastor - handles administrative tasks)
    {
      ...Keys.user(church1Id, 'user-admin-001'),
      entityType: 'USER',
      id: 'user-admin-001',
      churchId: church1Id,
      email: 'admin@firstapostolic.church',
      passwordHash: TEST_PASSWORD_HASH,
      firstName: 'Rebecca',
      lastName: 'Anderson',
      phone: '(512) 555-0100',
      role: 'admin',
      isActive: true,
      createdAt: now,
      updatedAt: now,
      GSI2PK: 'EMAIL#admin@firstapostolic.church',
      GSI2SK: 'USER#user-admin-001',
    },
    // Pastor
    {
      ...Keys.user(church1Id, 'user-pastor-001'),
      entityType: 'USER',
      id: 'user-pastor-001',
      churchId: church1Id,
      churchIds: [church1Id, church2Id], // Pastor oversees both Austin and Round Rock
      email: 'pastor@firstapostolic.church',
      passwordHash: TEST_PASSWORD_HASH,
      firstName: 'John',
      lastName: 'Smith',
      phone: '(512) 555-0101',
      role: 'pastor',
      isActive: true,
      createdAt: now,
      updatedAt: now,
      GSI2PK: 'EMAIL#pastor@firstapostolic.church',
      GSI2SK: 'USER#user-pastor-001',
    },
    // Teachers
    {
      ...Keys.user(church1Id, 'user-teacher-001'),
      entityType: 'USER',
      id: 'user-teacher-001',
      churchId: church1Id,
      email: 'sarah.johnson@email.com',
      passwordHash: TEST_PASSWORD_HASH,
      firstName: 'Sarah',
      lastName: 'Johnson',
      phone: '(512) 555-0102',
      role: 'teacher',
      isActive: true,
      createdAt: now,
      updatedAt: now,
      GSI2PK: 'EMAIL#sarah.johnson@email.com',
      GSI2SK: 'USER#user-teacher-001',
    },
    {
      ...Keys.user(church1Id, 'user-teacher-002'),
      entityType: 'USER',
      id: 'user-teacher-002',
      churchId: church1Id,
      email: 'mark.davis@email.com',
      passwordHash: TEST_PASSWORD_HASH,
      firstName: 'Mark',
      lastName: 'Davis',
      phone: '(512) 555-0103',
      role: 'teacher',
      isActive: true,
      createdAt: now,
      updatedAt: now,
      GSI2PK: 'EMAIL#mark.davis@email.com',
      GSI2SK: 'USER#user-teacher-002',
    },
    // Students - Church 1
    {
      ...Keys.user(church1Id, 'user-student-001'),
      entityType: 'USER',
      id: 'user-student-001',
      churchId: church1Id,
      email: 'mike.williams@email.com',
      passwordHash: TEST_PASSWORD_HASH,
      firstName: 'Mike',
      lastName: 'Williams',
      phone: '(512) 555-0104',
      role: 'student',
      isActive: true,
      createdAt: now,
      updatedAt: now,
      GSI2PK: 'EMAIL#mike.williams@email.com',
      GSI2SK: 'USER#user-student-001',
    },
    {
      ...Keys.user(church1Id, 'user-student-002'),
      entityType: 'USER',
      id: 'user-student-002',
      churchId: church1Id,
      email: 'jennifer.brown@email.com',
      passwordHash: TEST_PASSWORD_HASH,
      firstName: 'Jennifer',
      lastName: 'Brown',
      phone: '(512) 555-0105',
      role: 'student',
      isActive: true,
      createdAt: now,
      updatedAt: now,
      GSI2PK: 'EMAIL#jennifer.brown@email.com',
      GSI2SK: 'USER#user-student-002',
    },
    {
      ...Keys.user(church1Id, 'user-student-003'),
      entityType: 'USER',
      id: 'user-student-003',
      churchId: church1Id,
      email: 'carlos.garcia@email.com',
      passwordHash: TEST_PASSWORD_HASH,
      firstName: 'Carlos',
      lastName: 'Garcia',
      phone: '(512) 555-0106',
      role: 'student',
      isActive: true,
      createdAt: now,
      updatedAt: now,
      GSI2PK: 'EMAIL#carlos.garcia@email.com',
      GSI2SK: 'USER#user-student-003',
    },
    {
      ...Keys.user(church1Id, 'user-student-004'),
      entityType: 'USER',
      id: 'user-student-004',
      churchId: church1Id,
      email: 'emily.thompson@email.com',
      passwordHash: TEST_PASSWORD_HASH,
      firstName: 'Emily',
      lastName: 'Thompson',
      phone: '(512) 555-0107',
      role: 'student',
      isActive: true,
      createdAt: now,
      updatedAt: now,
      GSI2PK: 'EMAIL#emily.thompson@email.com',
      GSI2SK: 'USER#user-student-004',
    },
    {
      ...Keys.user(church1Id, 'user-student-005'),
      entityType: 'USER',
      id: 'user-student-005',
      churchId: church1Id,
      email: 'david.lee@email.com',
      passwordHash: TEST_PASSWORD_HASH,
      firstName: 'David',
      lastName: 'Lee',
      phone: '(512) 555-0108',
      role: 'student',
      isActive: true,
      createdAt: now,
      updatedAt: now,
      GSI2PK: 'EMAIL#david.lee@email.com',
      GSI2SK: 'USER#user-student-005',
    },
    {
      ...Keys.user(church1Id, 'user-student-006'),
      entityType: 'USER',
      id: 'user-student-006',
      churchId: church1Id,
      email: 'ashley.wilson@email.com',
      passwordHash: TEST_PASSWORD_HASH,
      firstName: 'Ashley',
      lastName: 'Wilson',
      phone: '(512) 555-0109',
      role: 'student',
      isActive: true,
      createdAt: now,
      updatedAt: now,
      GSI2PK: 'EMAIL#ashley.wilson@email.com',
      GSI2SK: 'USER#user-student-006',
    },
    // Members (potential students)
    {
      ...Keys.user(church1Id, 'user-member-001'),
      entityType: 'USER',
      id: 'user-member-001',
      churchId: church1Id,
      email: 'rachel.clark@email.com',
      passwordHash: TEST_PASSWORD_HASH,
      firstName: 'Rachel',
      lastName: 'Clark',
      phone: '(512) 555-0110',
      role: 'member',
      isActive: true,
      createdAt: now,
      updatedAt: now,
      GSI2PK: 'EMAIL#rachel.clark@email.com',
      GSI2SK: 'USER#user-member-001',
    },
    {
      ...Keys.user(church1Id, 'user-member-002'),
      entityType: 'USER',
      id: 'user-member-002',
      churchId: church1Id,
      email: 'jason.moore@email.com',
      passwordHash: TEST_PASSWORD_HASH,
      firstName: 'Jason',
      lastName: 'Moore',
      phone: '(512) 555-0111',
      role: 'member',
      isActive: true,
      createdAt: now,
      updatedAt: now,
      GSI2PK: 'EMAIL#jason.moore@email.com',
      GSI2SK: 'USER#user-member-002',
    },
  ];

  // ============================================
  // STUDENTS - CHURCH 1 (Various progression states)
  // ============================================
  const church1Students = [
    // Student 1: Mike Williams - Baptized, awaiting Holy Ghost
    {
      ...Keys.student(church1Id, 'student-001'),
      entityType: 'STUDENT',
      id: 'student-001',
      churchId: church1Id,
      userId: 'user-student-001',
      assignedTeacherId: 'user-teacher-001',
      newBirthStatus: {
        waterBaptism: { completed: true, date: daysAgo(7), notes: 'Baptized in Jesus\' Name - Hallelujah!' },
        holyGhost: { completed: false },
      },
      firstStepsProgress: {
        step1_foundations: { started: true, completed: true, completedDate: daysAgo(14) },
        step2_waterBaptism: { started: true, completed: true, completedDate: daysAgo(7) },
        step3_holyGhost: { started: true, completed: false },
        step4_prayer: { started: false, completed: false },
        step5_wordOfGod: { started: false, completed: false },
        step6_churchLife: { started: false, completed: false },
        step7_holiness: { started: false, completed: false },
        step8_evangelism: { started: false, completed: false },
      },
      startDate: daysAgo(21),
      notes: 'Very eager learner, has been attending prayer services regularly.',
      createdAt: daysAgo(21),
      updatedAt: now,
      GSI1PK: `CHURCH#${church1Id}#STUDENTS`,
      GSI1SK: 'student-001',
    },
    // Student 2: Jennifer Brown - Completed New Birth!
    {
      ...Keys.student(church1Id, 'student-002'),
      entityType: 'STUDENT',
      id: 'student-002',
      churchId: church1Id,
      userId: 'user-student-002',
      assignedTeacherId: 'user-teacher-001',
      newBirthStatus: {
        waterBaptism: { completed: true, date: daysAgo(30), notes: 'Beautiful baptism service' },
        holyGhost: { completed: true, date: daysAgo(14), notes: 'Received the Holy Ghost during revival!' },
      },
      firstStepsProgress: {
        step1_foundations: { started: true, completed: true, completedDate: daysAgo(45) },
        step2_waterBaptism: { started: true, completed: true, completedDate: daysAgo(30) },
        step3_holyGhost: { started: true, completed: true, completedDate: daysAgo(14) },
        step4_prayer: { started: true, completed: true, completedDate: daysAgo(10) },
        step5_wordOfGod: { started: true, completed: false },
        step6_churchLife: { started: false, completed: false },
        step7_holiness: { started: false, completed: false },
        step8_evangelism: { started: false, completed: false },
      },
      startDate: daysAgo(60),
      completionDate: daysAgo(14),
      notes: 'Strong testimony, helping with worship team.',
      createdAt: daysAgo(60),
      updatedAt: now,
      GSI1PK: `CHURCH#${church1Id}#STUDENTS`,
      GSI1SK: 'student-002',
    },
    // Student 3: Carlos Garcia - Just started, no milestones yet
    {
      ...Keys.student(church1Id, 'student-003'),
      entityType: 'STUDENT',
      id: 'student-003',
      churchId: church1Id,
      userId: 'user-student-003',
      assignedTeacherId: 'user-teacher-002',
      newBirthStatus: {
        waterBaptism: { completed: false },
        holyGhost: { completed: false },
      },
      firstStepsProgress: {
        step1_foundations: { started: true, completed: false },
        step2_waterBaptism: { started: false, completed: false },
        step3_holyGhost: { started: false, completed: false },
        step4_prayer: { started: false, completed: false },
        step5_wordOfGod: { started: false, completed: false },
        step6_churchLife: { started: false, completed: false },
        step7_holiness: { started: false, completed: false },
        step8_evangelism: { started: false, completed: false },
      },
      startDate: daysAgo(3),
      notes: 'First-time visitor from Catholic background. Very interested in learning.',
      createdAt: daysAgo(3),
      updatedAt: now,
      GSI1PK: `CHURCH#${church1Id}#STUDENTS`,
      GSI1SK: 'student-003',
    },
    // Student 4: Emily Thompson - Baptized, received Holy Ghost (fully complete)
    {
      ...Keys.student(church1Id, 'student-004'),
      entityType: 'STUDENT',
      id: 'student-004',
      churchId: church1Id,
      userId: 'user-student-004',
      assignedTeacherId: 'user-teacher-001',
      newBirthStatus: {
        waterBaptism: { completed: true, date: daysAgo(60), notes: 'Baptized during Sunday service' },
        holyGhost: { completed: true, date: daysAgo(45), notes: 'Received during Wednesday prayer' },
      },
      firstStepsProgress: {
        step1_foundations: { started: true, completed: true, completedDate: daysAgo(75) },
        step2_waterBaptism: { started: true, completed: true, completedDate: daysAgo(60) },
        step3_holyGhost: { started: true, completed: true, completedDate: daysAgo(45) },
        step4_prayer: { started: true, completed: true, completedDate: daysAgo(30) },
        step5_wordOfGod: { started: true, completed: true, completedDate: daysAgo(20) },
        step6_churchLife: { started: true, completed: true, completedDate: daysAgo(10) },
        step7_holiness: { started: true, completed: false },
        step8_evangelism: { started: false, completed: false },
      },
      startDate: daysAgo(90),
      completionDate: daysAgo(45),
      notes: 'Excellent progress! Now helping with children\'s ministry.',
      createdAt: daysAgo(90),
      updatedAt: now,
      GSI1PK: `CHURCH#${church1Id}#STUDENTS`,
      GSI1SK: 'student-004',
    },
    // Student 5: David Lee - Not yet baptized
    {
      ...Keys.student(church1Id, 'student-005'),
      entityType: 'STUDENT',
      id: 'student-005',
      churchId: church1Id,
      userId: 'user-student-005',
      assignedTeacherId: 'user-teacher-002',
      newBirthStatus: {
        waterBaptism: { completed: false },
        holyGhost: { completed: false },
      },
      firstStepsProgress: {
        step1_foundations: { started: true, completed: true, completedDate: daysAgo(10) },
        step2_waterBaptism: { started: true, completed: false },
        step3_holyGhost: { started: false, completed: false },
        step4_prayer: { started: false, completed: false },
        step5_wordOfGod: { started: false, completed: false },
        step6_churchLife: { started: false, completed: false },
        step7_holiness: { started: false, completed: false },
        step8_evangelism: { started: false, completed: false },
      },
      startDate: daysAgo(14),
      notes: 'Scheduled for baptism this coming Sunday.',
      createdAt: daysAgo(14),
      updatedAt: now,
      GSI1PK: `CHURCH#${church1Id}#STUDENTS`,
      GSI1SK: 'student-005',
    },
    // Student 6: Ashley Wilson - Awaiting Holy Ghost
    {
      ...Keys.student(church1Id, 'student-006'),
      entityType: 'STUDENT',
      id: 'student-006',
      churchId: church1Id,
      userId: 'user-student-006',
      assignedTeacherId: 'user-teacher-001',
      newBirthStatus: {
        waterBaptism: { completed: true, date: daysAgo(21), notes: 'Baptized in Jesus\' Name' },
        holyGhost: { completed: false },
      },
      firstStepsProgress: {
        step1_foundations: { started: true, completed: true, completedDate: daysAgo(30) },
        step2_waterBaptism: { started: true, completed: true, completedDate: daysAgo(21) },
        step3_holyGhost: { started: true, completed: false },
        step4_prayer: { started: true, completed: false },
        step5_wordOfGod: { started: false, completed: false },
        step6_churchLife: { started: false, completed: false },
        step7_holiness: { started: false, completed: false },
        step8_evangelism: { started: false, completed: false },
      },
      startDate: daysAgo(35),
      notes: 'Faithful in prayer. Seeking the Holy Ghost earnestly.',
      createdAt: daysAgo(35),
      updatedAt: now,
      GSI1PK: `CHURCH#${church1Id}#STUDENTS`,
      GSI1SK: 'student-006',
    },
  ];

  // ============================================
  // USERS - CHURCH 2 (First Apostolic - North Campus)
  // ============================================
  const church2Users = [
    // Assistant Pastor (can also see Church 1)
    {
      ...Keys.user(church2Id, 'user-pastor-003'),
      entityType: 'USER',
      id: 'user-pastor-003',
      churchId: church2Id,
      email: 'asst.pastor@firstapostolic.church',
      passwordHash: TEST_PASSWORD_HASH,
      firstName: 'Robert',
      lastName: 'Anderson',
      phone: '(512) 555-0201',
      role: 'pastor',
      isActive: true,
      createdAt: now,
      updatedAt: now,
      GSI2PK: 'EMAIL#asst.pastor@firstapostolic.church',
      GSI2SK: 'USER#user-pastor-003',
    },
    // Teacher
    {
      ...Keys.user(church2Id, 'user-teacher-003'),
      entityType: 'USER',
      id: 'user-teacher-003',
      churchId: church2Id,
      email: 'linda.martinez@email.com',
      passwordHash: TEST_PASSWORD_HASH,
      firstName: 'Linda',
      lastName: 'Martinez',
      phone: '(512) 555-0202',
      role: 'teacher',
      isActive: true,
      createdAt: now,
      updatedAt: now,
      GSI2PK: 'EMAIL#linda.martinez@email.com',
      GSI2SK: 'USER#user-teacher-003',
    },
    // Students - Church 2
    {
      ...Keys.user(church2Id, 'user-student-007'),
      entityType: 'USER',
      id: 'user-student-007',
      churchId: church2Id,
      email: 'brian.taylor@email.com',
      passwordHash: TEST_PASSWORD_HASH,
      firstName: 'Brian',
      lastName: 'Taylor',
      phone: '(512) 555-0203',
      role: 'student',
      isActive: true,
      createdAt: now,
      updatedAt: now,
      GSI2PK: 'EMAIL#brian.taylor@email.com',
      GSI2SK: 'USER#user-student-007',
    },
    {
      ...Keys.user(church2Id, 'user-student-008'),
      entityType: 'USER',
      id: 'user-student-008',
      churchId: church2Id,
      email: 'maria.rodriguez@email.com',
      passwordHash: TEST_PASSWORD_HASH,
      firstName: 'Maria',
      lastName: 'Rodriguez',
      phone: '(512) 555-0204',
      role: 'student',
      isActive: true,
      createdAt: now,
      updatedAt: now,
      GSI2PK: 'EMAIL#maria.rodriguez@email.com',
      GSI2SK: 'USER#user-student-008',
    },
    {
      ...Keys.user(church2Id, 'user-student-009'),
      entityType: 'USER',
      id: 'user-student-009',
      churchId: church2Id,
      email: 'kevin.white@email.com',
      passwordHash: TEST_PASSWORD_HASH,
      firstName: 'Kevin',
      lastName: 'White',
      phone: '(512) 555-0205',
      role: 'student',
      isActive: true,
      createdAt: now,
      updatedAt: now,
      GSI2PK: 'EMAIL#kevin.white@email.com',
      GSI2SK: 'USER#user-student-009',
    },
  ];

  // ============================================
  // STUDENTS - CHURCH 2 (North Campus)
  // ============================================
  const church2Students = [
    // Student 7: Brian Taylor - Completed New Birth
    {
      ...Keys.student(church2Id, 'student-007'),
      entityType: 'STUDENT',
      id: 'student-007',
      churchId: church2Id,
      userId: 'user-student-007',
      assignedTeacherId: 'user-teacher-003',
      newBirthStatus: {
        waterBaptism: { completed: true, date: daysAgo(45), notes: 'Baptized during Sunday service' },
        holyGhost: { completed: true, date: daysAgo(30), notes: 'Received during youth service!' },
      },
      firstStepsProgress: {
        step1_foundations: { started: true, completed: true, completedDate: daysAgo(60) },
        step2_waterBaptism: { started: true, completed: true, completedDate: daysAgo(45) },
        step3_holyGhost: { started: true, completed: true, completedDate: daysAgo(30) },
        step4_prayer: { started: true, completed: true, completedDate: daysAgo(20) },
        step5_wordOfGod: { started: true, completed: false },
        step6_churchLife: { started: false, completed: false },
        step7_holiness: { started: false, completed: false },
        step8_evangelism: { started: false, completed: false },
      },
      startDate: daysAgo(75),
      completionDate: daysAgo(30),
      notes: 'College student, very involved in youth group.',
      createdAt: daysAgo(75),
      updatedAt: now,
      GSI1PK: `CHURCH#${church2Id}#STUDENTS`,
      GSI1SK: 'student-007',
    },
    // Student 8: Maria Rodriguez - Awaiting Baptism
    {
      ...Keys.student(church2Id, 'student-008'),
      entityType: 'STUDENT',
      id: 'student-008',
      churchId: church2Id,
      userId: 'user-student-008',
      assignedTeacherId: 'user-teacher-003',
      newBirthStatus: {
        waterBaptism: { completed: false },
        holyGhost: { completed: false },
      },
      firstStepsProgress: {
        step1_foundations: { started: true, completed: true, completedDate: daysAgo(5) },
        step2_waterBaptism: { started: true, completed: false },
        step3_holyGhost: { started: false, completed: false },
        step4_prayer: { started: false, completed: false },
        step5_wordOfGod: { started: false, completed: false },
        step6_churchLife: { started: false, completed: false },
        step7_holiness: { started: false, completed: false },
        step8_evangelism: { started: false, completed: false },
      },
      startDate: daysAgo(10),
      notes: 'Spanish-speaking, would benefit from bilingual materials.',
      createdAt: daysAgo(10),
      updatedAt: now,
      GSI1PK: `CHURCH#${church2Id}#STUDENTS`,
      GSI1SK: 'student-008',
    },
    // Student 9: Kevin White - Baptized, seeking Holy Ghost
    {
      ...Keys.student(church2Id, 'student-009'),
      entityType: 'STUDENT',
      id: 'student-009',
      churchId: church2Id,
      userId: 'user-student-009',
      assignedTeacherId: 'user-teacher-003',
      newBirthStatus: {
        waterBaptism: { completed: true, date: daysAgo(14), notes: 'Baptized in Jesus\' Name' },
        holyGhost: { completed: false },
      },
      firstStepsProgress: {
        step1_foundations: { started: true, completed: true, completedDate: daysAgo(25) },
        step2_waterBaptism: { started: true, completed: true, completedDate: daysAgo(14) },
        step3_holyGhost: { started: true, completed: false },
        step4_prayer: { started: false, completed: false },
        step5_wordOfGod: { started: false, completed: false },
        step6_churchLife: { started: false, completed: false },
        step7_holiness: { started: false, completed: false },
        step8_evangelism: { started: false, completed: false },
      },
      startDate: daysAgo(30),
      notes: 'Invited by coworker, very faithful in attendance.',
      createdAt: daysAgo(30),
      updatedAt: now,
      GSI1PK: `CHURCH#${church2Id}#STUDENTS`,
      GSI1SK: 'student-009',
    },
  ];

  // ============================================
  // USERS - CHURCH 3 (Grace Apostolic - Houston)
  // ============================================
  const church3Users = [
    // Pastor
    {
      ...Keys.user(church3Id, 'user-pastor-002'),
      entityType: 'USER',
      id: 'user-pastor-002',
      churchId: church3Id,
      email: 'pastor@graceapostolic.org',
      passwordHash: TEST_PASSWORD_HASH,
      firstName: 'David',
      lastName: 'Martinez',
      phone: '(713) 555-0301',
      role: 'pastor',
      isActive: true,
      createdAt: now,
      updatedAt: now,
      GSI2PK: 'EMAIL#pastor@graceapostolic.org',
      GSI2SK: 'USER#user-pastor-002',
    },
    // Teacher
    {
      ...Keys.user(church3Id, 'user-teacher-004'),
      entityType: 'USER',
      id: 'user-teacher-004',
      churchId: church3Id,
      email: 'james.wilson@email.com',
      passwordHash: TEST_PASSWORD_HASH,
      firstName: 'James',
      lastName: 'Wilson',
      phone: '(713) 555-0302',
      role: 'teacher',
      isActive: true,
      createdAt: now,
      updatedAt: now,
      GSI2PK: 'EMAIL#james.wilson@email.com',
      GSI2SK: 'USER#user-teacher-004',
    },
    // Students
    {
      ...Keys.user(church3Id, 'user-student-010'),
      entityType: 'USER',
      id: 'user-student-010',
      churchId: church3Id,
      email: 'anna.jones@email.com',
      passwordHash: TEST_PASSWORD_HASH,
      firstName: 'Anna',
      lastName: 'Jones',
      phone: '(713) 555-0303',
      role: 'student',
      isActive: true,
      createdAt: now,
      updatedAt: now,
      GSI2PK: 'EMAIL#anna.jones@email.com',
      GSI2SK: 'USER#user-student-010',
    },
    {
      ...Keys.user(church3Id, 'user-student-011'),
      entityType: 'USER',
      id: 'user-student-011',
      churchId: church3Id,
      email: 'marcus.king@email.com',
      passwordHash: TEST_PASSWORD_HASH,
      firstName: 'Marcus',
      lastName: 'King',
      phone: '(713) 555-0304',
      role: 'student',
      isActive: true,
      createdAt: now,
      updatedAt: now,
      GSI2PK: 'EMAIL#marcus.king@email.com',
      GSI2SK: 'USER#user-student-011',
    },
  ];

  // ============================================
  // STUDENTS - CHURCH 3 (Grace Apostolic)
  // ============================================
  const church3Students = [
    // Student 10: Anna Jones - Completed New Birth
    {
      ...Keys.student(church3Id, 'student-010'),
      entityType: 'STUDENT',
      id: 'student-010',
      churchId: church3Id,
      userId: 'user-student-010',
      assignedTeacherId: 'user-teacher-004',
      newBirthStatus: {
        waterBaptism: { completed: true, date: daysAgo(90), notes: 'Baptized in Jesus\' Name' },
        holyGhost: { completed: true, date: daysAgo(60), notes: 'Glorious experience!' },
      },
      firstStepsProgress: {
        step1_foundations: { started: true, completed: true, completedDate: daysAgo(120) },
        step2_waterBaptism: { started: true, completed: true, completedDate: daysAgo(90) },
        step3_holyGhost: { started: true, completed: true, completedDate: daysAgo(60) },
        step4_prayer: { started: true, completed: true, completedDate: daysAgo(45) },
        step5_wordOfGod: { started: true, completed: true, completedDate: daysAgo(30) },
        step6_churchLife: { started: true, completed: true, completedDate: daysAgo(15) },
        step7_holiness: { started: true, completed: true, completedDate: daysAgo(7) },
        step8_evangelism: { started: true, completed: false },
      },
      startDate: daysAgo(150),
      completionDate: daysAgo(60),
      notes: 'Nearly completed First Steps! Planning to start evangelism training.',
      createdAt: daysAgo(150),
      updatedAt: now,
      GSI1PK: `CHURCH#${church3Id}#STUDENTS`,
      GSI1SK: 'student-010',
    },
    // Student 11: Marcus King - Just started
    {
      ...Keys.student(church3Id, 'student-011'),
      entityType: 'STUDENT',
      id: 'student-011',
      churchId: church3Id,
      userId: 'user-student-011',
      assignedTeacherId: 'user-teacher-004',
      newBirthStatus: {
        waterBaptism: { completed: false },
        holyGhost: { completed: false },
      },
      firstStepsProgress: {
        step1_foundations: { started: true, completed: false },
        step2_waterBaptism: { started: false, completed: false },
        step3_holyGhost: { started: false, completed: false },
        step4_prayer: { started: false, completed: false },
        step5_wordOfGod: { started: false, completed: false },
        step6_churchLife: { started: false, completed: false },
        step7_holiness: { started: false, completed: false },
        step8_evangelism: { started: false, completed: false },
      },
      startDate: daysAgo(5),
      notes: 'Young professional, works in tech. Very analytical.',
      createdAt: daysAgo(5),
      updatedAt: now,
      GSI1PK: `CHURCH#${church3Id}#STUDENTS`,
      GSI1SK: 'student-011',
    },
  ];

  // ============================================
  // BIBLE STUDIES
  // ============================================
  const studies = [
    // Church 1: Study with Mike
    {
      ...Keys.study(church1Id, 'study-001'),
      entityType: 'STUDY',
      id: 'study-001',
      churchId: church1Id,
      teacherId: 'user-teacher-001',
      studentIds: ['user-student-001'],
      title: 'Search for Truth with Mike',
      curriculum: 'search-for-truth',
      status: 'in-progress',
      scheduledDay: 'Tuesday',
      scheduledTime: '7:00 PM',
      location: 'Church Office',
      createdAt: daysAgo(21),
      updatedAt: now,
      GSI1PK: `CHURCH#${church1Id}#STUDIES`,
      GSI1SK: 'study-001',
    },
    // Church 1: Study with Carlos
    {
      ...Keys.study(church1Id, 'study-002'),
      entityType: 'STUDY',
      id: 'study-002',
      churchId: church1Id,
      teacherId: 'user-teacher-002',
      studentIds: ['user-student-003'],
      title: 'Exploring God\'s Word with Carlos',
      curriculum: 'exploring-gods-word',
      status: 'in-progress',
      scheduledDay: 'Thursday',
      scheduledTime: '6:30 PM',
      location: 'Fellowship Hall',
      createdAt: daysAgo(3),
      updatedAt: now,
      GSI1PK: `CHURCH#${church1Id}#STUDIES`,
      GSI1SK: 'study-002',
    },
    // Church 2: Study with Maria
    {
      ...Keys.study(church2Id, 'study-003'),
      entityType: 'STUDY',
      id: 'study-003',
      churchId: church2Id,
      teacherId: 'user-teacher-003',
      studentIds: ['user-student-008'],
      title: 'La Búsqueda de la Verdad con Maria',
      curriculum: 'search-for-truth',
      status: 'in-progress',
      scheduledDay: 'Wednesday',
      scheduledTime: '7:00 PM',
      location: 'North Campus Office',
      createdAt: daysAgo(10),
      updatedAt: now,
      GSI1PK: `CHURCH#${church2Id}#STUDIES`,
      GSI1SK: 'study-003',
    },
    // Church 3: Study with Marcus
    {
      ...Keys.study(church3Id, 'study-004'),
      entityType: 'STUDY',
      id: 'study-004',
      churchId: church3Id,
      teacherId: 'user-teacher-004',
      studentIds: ['user-student-011'],
      title: 'Search for Truth with Marcus',
      curriculum: 'search-for-truth',
      status: 'in-progress',
      scheduledDay: 'Saturday',
      scheduledTime: '10:00 AM',
      location: 'Coffee Shop',
      createdAt: daysAgo(5),
      updatedAt: now,
      GSI1PK: `CHURCH#${church3Id}#STUDIES`,
      GSI1SK: 'study-004',
    },
  ];

  // ============================================
  // LESSONS
  // ============================================
  const lessons = [
    // Study 1: Lessons for Mike
    {
      ...Keys.lesson('study-001', 'lesson-001'),
      entityType: 'LESSON',
      id: 'lesson-001',
      studyId: 'study-001',
      lessonNumber: 1,
      lessonTitle: 'The Bible',
      status: 'completed',
      completedDate: daysAgo(14),
      teacherNotes: 'Great discussion about biblical authority and inspiration.',
      createdAt: daysAgo(21),
      updatedAt: daysAgo(14),
    },
    {
      ...Keys.lesson('study-001', 'lesson-002'),
      entityType: 'LESSON',
      id: 'lesson-002',
      studyId: 'study-001',
      lessonNumber: 2,
      lessonTitle: 'God',
      status: 'completed',
      completedDate: daysAgo(7),
      teacherNotes: 'Covered Oneness doctrine. Mike understands the Godhead well now.',
      createdAt: daysAgo(14),
      updatedAt: daysAgo(7),
    },
    {
      ...Keys.lesson('study-001', 'lesson-003'),
      entityType: 'LESSON',
      id: 'lesson-003',
      studyId: 'study-001',
      lessonNumber: 3,
      lessonTitle: 'Sin',
      status: 'in-progress',
      createdAt: daysAgo(7),
      updatedAt: now,
    },
    // Study 2: Lesson for Carlos
    {
      ...Keys.lesson('study-002', 'lesson-004'),
      entityType: 'LESSON',
      id: 'lesson-004',
      studyId: 'study-002',
      lessonNumber: 1,
      lessonTitle: 'Why Study the Bible?',
      status: 'in-progress',
      createdAt: daysAgo(3),
      updatedAt: now,
    },
  ];

  // ============================================
  // INSERT ALL DATA
  // ============================================
  const allItems = [
    // Churches
    church1,
    church2,
    church3,
    // Users
    platformAdmin,
    ...church1Users,
    ...church2Users,
    ...church3Users,
    // Students
    ...church1Students,
    ...church2Students,
    ...church3Students,
    // Studies
    ...studies,
    // Lessons
    ...lessons,
  ];

  console.log(`\nInserting ${allItems.length} items...`);

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
  console.log('Creating 3 churches with 11 total students across different states:\n');
  console.log('Church 1: First Apostolic Church (Austin, TX) - 6 students');
  console.log('Church 2: First Apostolic - North Campus (Round Rock, TX) - 3 students');
  console.log('Church 3: Grace Apostolic Fellowship (Houston, TX) - 2 students\n');

  try {
    await createTables();
    await seedData();
    console.log('\n✅ Database seeding complete!');
    console.log('\n📝 Test Credentials:');
    console.log('   Email: pastor@firstapostolic.church');
    console.log('   Password: testpass123');
    console.log('   (Has access to both Austin and North Campus)\n');
    console.log('   Email: pastor@graceapostolic.org');
    console.log('   Password: testpass123');
    console.log('   (Grace Apostolic - Houston)\n');
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  }
}

run();
