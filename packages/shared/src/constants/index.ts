/**
 * Application Constants
 */

// User Roles
export const USER_ROLES = ['admin', 'pastor', 'teacher', 'member', 'student'] as const;

// Study Statuses
export const STUDY_STATUSES = ['in-progress', 'completed', 'paused'] as const;

// Lesson Statuses
export const LESSON_STATUSES = ['not-started', 'in-progress', 'completed'] as const;

// Curriculum Types
export const CURRICULUM_TYPES = [
  'search-for-truth',
  'exploring-gods-word',
  'first-principles',
  'custom',
] as const;

// New Birth Milestones
export const NEW_BIRTH_MILESTONES = ['repentance', 'baptism', 'holyGhost'] as const;

// First Steps
export const FIRST_STEPS = [
  { key: 'step1_foundations', name: 'Foundations', description: 'Basic beliefs and doctrines' },
  { key: 'step2_waterBaptism', name: 'Water Baptism', description: 'Baptism in Jesus Name' },
  { key: 'step3_holyGhost', name: 'Holy Ghost', description: 'Receiving the Holy Spirit' },
  { key: 'step4_prayer', name: 'Prayer', description: 'Developing a prayer life' },
  { key: 'step5_wordOfGod', name: 'Word of God', description: 'Bible study habits' },
  { key: 'step6_churchLife', name: 'Church Life', description: 'Church involvement' },
  { key: 'step7_holiness', name: 'Holiness', description: 'Living a separated life' },
  { key: 'step8_evangelism', name: 'Evangelism', description: 'Sharing your faith' },
] as const;

// Subscription Tiers
export const SUBSCRIPTION_TIERS = {
  free: {
    name: 'Free',
    maxUsers: 10,
    maxStudies: 5,
    features: ['Basic tracking', 'Single teacher'],
  },
  starter: {
    name: 'Starter',
    maxUsers: 50,
    maxStudies: 25,
    features: ['All Free features', 'Multiple teachers', 'Basic reports'],
  },
  growth: {
    name: 'Growth',
    maxUsers: 200,
    maxStudies: 100,
    features: ['All Starter features', 'Advanced reports', 'Custom branding', 'Priority support'],
  },
  enterprise: {
    name: 'Enterprise',
    maxUsers: -1, // Unlimited
    maxStudies: -1, // Unlimited
    features: ['All Growth features', 'Unlimited users', 'API access', 'Dedicated support'],
  },
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  HEALTH: '/api/v1/health',
  CHURCHES: '/api/v1/churches',
  USERS: '/api/v1/users',
  STUDENTS: '/api/v1/students',
  STUDIES: '/api/v1/studies',
  LESSONS: '/api/v1/lessons',
} as const;
