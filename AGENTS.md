# AGENTS.md - Apostolic Path Project Context

## Project Overview

**Apostolic Path** is a cloud-native SaaS discipleship platform designed specifically for UPCI (United Pentecostal Church International) and Apostolic churches. It empowers teachers to teach effectively, pastors to track progress, and students to complete their New Birth and First Steps journey.

---

## Core Mission

Fill the gap in Apostolic church technology by providing a comprehensive, easy-to-use discipleship tracking system that:
- Guides new students through the New Birth experience (Repentance, Baptism, Holy Ghost)
- Tracks First Steps discipleship curriculum progress
- Enables teachers to manage Bible studies and student progress
- Gives pastors visibility into church-wide discipleship health
- Supports multi-church (multi-tenant) deployment

---

## Technical Architecture

### Stack Overview
| Layer | Technology |
|-------|------------|
| Frontend | React 18+, Next.js 14+ (App Router), Tailwind CSS, shadcn/ui |
| Backend | Node.js 20+, Fastify, TypeScript |
| Database | DynamoDB (primary), MongoDB (optional for complex queries) |
| Blob Storage | AWS S3 |
| Authentication | AWS Cognito |
| Deployment | AWS Lambda / Fargate, API Gateway, CloudFront |
| CI/CD | GitHub Actions → AWS |

### Project Structure
```
apostolic-path/
├── apps/
│   ├── web/                 # Next.js frontend application
│   └── api/                 # Fastify backend API
├── packages/
│   ├── shared/              # Shared types, utilities, constants
│   ├── ui/                  # Shared UI components (if needed beyond shadcn)
│   └── database/            # Database schemas, clients, migrations
├── infrastructure/
│   ├── terraform/           # Infrastructure as Code
│   └── scripts/             # Deployment scripts
├── .github/
│   └── workflows/           # GitHub Actions CI/CD
└── docs/                    # Project documentation
```

---

## Multi-Tenant Architecture

**All data is scoped to a `church_id`**. This is enforced at:
1. API middleware level (extract church_id from JWT)
2. Database query level (partition key includes church_id)
3. Authorization checks on every request

### DynamoDB Table Design
- **Primary Key Pattern**: `PK: CHURCH#<church_id>`, `SK: <entity>#<id>`
- **GSI for cross-church admin queries** (platform admin only)
- **LSI for common access patterns** (by date, by status, etc.)

---

## Core Domain Entities

### 1. Church (Tenant)
```typescript
interface Church {
  id: string;              // UUID
  name: string;
  slug: string;            // URL-friendly identifier
  address: Address;
  pastorId: string;
  settings: ChurchSettings;
  subscription: SubscriptionTier;
  createdAt: Date;
  updatedAt: Date;
}
```

### 2. User
```typescript
interface User {
  id: string;              // Cognito sub
  churchId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'admin' | 'pastor' | 'teacher' | 'member' | 'student';
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### 3. Student (New Believer Journey)
```typescript
interface Student {
  id: string;
  churchId: string;
  userId: string;
  assignedTeacherId?: string;
  newBirthStatus: {
    repentance: { completed: boolean; date?: Date; notes?: string };
    baptism: { completed: boolean; date?: Date; notes?: string };
    holyGhost: { completed: boolean; date?: Date; notes?: string };
  };
  firstStepsProgress: FirstStepsProgress;
  startDate: Date;
  completionDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### 4. BibleStudy
```typescript
interface BibleStudy {
  id: string;
  churchId: string;
  teacherId: string;
  studentIds: string[];
  title: string;
  curriculum: 'search-for-truth' | 'exploring-gods-word' | 'custom';
  lessons: LessonProgress[];
  status: 'in-progress' | 'completed' | 'paused';
  scheduledDay?: string;
  scheduledTime?: string;
  location?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### 5. LessonProgress
```typescript
interface LessonProgress {
  id: string;
  studyId: string;
  lessonNumber: number;
  lessonTitle: string;
  status: 'not-started' | 'in-progress' | 'completed';
  completedDate?: Date;
  teacherNotes?: string;
  studentNotes?: string;
  attachments?: string[];  // S3 keys
}
```

### 6. FirstSteps (Discipleship Track)
```typescript
interface FirstStepsProgress {
  step1_foundations: StepProgress;      // Basic beliefs
  step2_waterBaptism: StepProgress;     // Baptism class
  step3_holyGhost: StepProgress;        // Holy Ghost teaching
  step4_prayer: StepProgress;           // Prayer life
  step5_wordOfGod: StepProgress;        // Bible study habits
  step6_churchLife: StepProgress;       // Church involvement
  step7_holiness: StepProgress;         // Holiness standards
  step8_evangelism: StepProgress;       // Sharing faith
}

interface StepProgress {
  started: boolean;
  startedDate?: Date;
  completed: boolean;
  completedDate?: Date;
  mentorId?: string;
  notes?: string;
}
```

---

## API Design Principles

1. **RESTful endpoints** with consistent naming: `/api/v1/<resource>`
2. **Request validation** using Zod schemas
3. **Response format**: `{ success: boolean, data?: T, error?: { code: string, message: string } }`
4. **Pagination**: cursor-based for DynamoDB compatibility
5. **Rate limiting**: per-church tier-based limits
6. **Audit logging**: all mutations logged with actor, timestamp, changes

---

## Current Backend Implementation (Jan 2026)

- Fastify app lives in apps/api (see src/index.ts); security plugins (helmet, cors, rate-limit) and Swagger UI are enabled at `/docs`; a public health probe is exposed at `/health`.
- Plugins: `authPlugin` (JWT auth with `config.jwt.secret`, role/permission decorators, platform-admin helpers), `churchContextPlugin` (sets `request.churchContext` from JWT), `permissionsPlugin` (resource access helpers), and a Zod-aware `errorHandler`.
- Auth: local email/password with bcrypt (12 rounds) and 7d JWTs; endpoints include `/api/v1/auth/register`, `/login`, `/me`, `/change-password`, `/verify`, `/me/churches`, and `/switch-church` (issues a new JWT for the target church if allowed). Cognito IDs are optional envs—JWT secrets power local auth today.
- Multi-tenant enforcement: routes read `request.churchContext.churchId` set during auth; permission checks use the shared RBAC matrix in packages/shared (roles: platform_admin > admin > pastor > teacher > member > student).
- Domain routes implemented: churches (`/me`, `/me/stats`, update), users (list/create/update/get within church, role assignment guard), students (list with role scoping, create, update, milestones, First Steps stats/updates), studies (list with role scoping, create, read, update, status, by-student), lessons (by study, read, update/complete/add note).
- Curriculum seeding: standard lesson templates defined in `apps/api/src/data/curriculums.ts` and instantiated when a study is created.
- Data layer: single DynamoDB table `${DYNAMODB_TABLE_PREFIX}-main` with key helpers (Keys.church/user/student/study/lesson) and GSIs for cross-entity/email lookups (`packages/database/src/tables.ts`). Dynamo client honors `DYNAMODB_ENDPOINT` for local dev.
- Services map 1:1 to repositories and update `updatedAt` timestamps; creation paths set default New Birth + First Steps scaffolding for students and create curriculum lessons for studies.
- Defaults from config: `PORT=3001`, `HOST=0.0.0.0`, `AWS_REGION=us-east-1`, `DYNAMODB_TABLE_PREFIX=apostolic-path`, `S3_BUCKET=apostolic-path-uploads`, `JWT_SECRET=dev-secret-change-in-production`.

---

## Authentication & Authorization

### Cognito User Pools
- One user pool per environment (dev, staging, prod)
- Custom attributes: `church_id`, `role`
- JWT tokens include church context

### Role-Based Access Control (RBAC)
| Role | Permissions |
|------|-------------|
| Platform Admin | Full access across all churches |
| Pastor/Admin | Full access to their church |
| Teacher | Manage assigned studies and students |
| Member | View own progress, limited church info |
| Student | View and update own journey |

---

## Frontend Architecture

### Route Structure (Next.js App Router)
```
app/
├── (auth)/
│   ├── login/
│   ├── register/
│   └── forgot-password/
├── (dashboard)/
│   ├── layout.tsx           # Dashboard shell with sidebar
│   ├── page.tsx             # Dashboard home
│   ├── students/
│   │   ├── page.tsx         # List all students
│   │   └── [id]/page.tsx    # Individual student detail
│   ├── studies/
│   │   ├── page.tsx         # List Bible studies
│   │   └── [id]/page.tsx    # Study detail/progress
│   ├── first-steps/
│   │   └── page.tsx         # First Steps overview
│   ├── reports/
│   │   └── page.tsx         # Analytics and reports
│   └── settings/
│       └── page.tsx         # Church settings
└── (marketing)/
    ├── page.tsx             # Landing page
    └── pricing/page.tsx     # Pricing page
```

  ### Current Frontend Implementation (Jan 2026)
  - App Router with role-gated dashboard layout (`apps/web/src/app/(dashboard)/layout.tsx`) that checks auth via Zustand store and redirects to `/login`; uses shared shell (sidebar + header).
  - Providers: React Query + Theme (light/dark) + Toasts wired in `apps/web/src/components/providers.tsx` with sensible defaults (1 min stale, single retry).
  - Auth client: Zustand store in `apps/web/src/lib/auth.ts` persists JWT token (localStorage), wraps `/auth/login` and `checkAuth` via `/auth/me` + optional `/churches/me`; stores church context; logout clears token + query cache. `api.ts` wraps fetch with base URL `NEXT_PUBLIC_API_URL` and attaches bearer token.
  - Permissions: client hooks re-export shared RBAC helpers (`apps/web/src/lib/permissions.ts`, `apps/web/src/hooks/use-permissions.ts`), used for nav visibility and role-based UI.
  - Data fetching: React Query hooks in `apps/web/src/lib/hooks.ts` map 1:1 to API routes (church stats, students, studies, lessons, switch-church, etc.) and invalidate caches on mutations.
  - Dashboard UX: role-routed dashboards (`apps/web/src/app/(dashboard)/dashboard/page.tsx`) render Manager (pastor/admin), Teacher, Student/Member variants; sidebar/header support church switching (platform admins can switch via `/auth/switch-church`).
  - UI: shadcn components (button/card/badge/toast) + lucide icons; sidebar nav is role-filtered (students see self-service items, pastors/admins get reports/settings, platform admins see system admin links).

  ### Known Gaps / TODOs
  - Student dashboard currently uses mock data (no API wiring yet) and self-progress routes like `/dashboard/my-progress` are not implemented.
  - Teacher dashboard filters assigned students client-side; API should provide teacher-scoped list to avoid over-fetching.
  - Several dashboard subpages (students/studies detail flows, settings/admin pages) are not present or stubbed; routing map above is the intent, but many pages are not yet built.

### State Management
- **Server State**: TanStack Query (React Query) for API data
- **Client State**: Zustand for UI state (modals, filters, etc.)
- **Form State**: React Hook Form + Zod validation

---

## Coding Standards

### TypeScript
- Strict mode enabled
- Explicit return types on functions
- Interface over type for object shapes
- Zod schemas as source of truth for validation

### React/Next.js
- Server Components by default
- Client Components only when needed (interactivity, hooks)
- Colocate components with their routes when specific
- Extract to `/components` when reusable

### API (Fastify)
- One file per route group in `/routes`
- Schemas defined alongside routes
- Services for business logic in `/services`
- Repository pattern for database access in `/repositories`

### Naming Conventions
- **Files**: kebab-case (`bible-study.service.ts`)
- **React Components**: PascalCase (`BibleStudyCard.tsx`)
- **Functions/Variables**: camelCase
- **Constants**: SCREAMING_SNAKE_CASE
- **Database Tables**: PascalCase (`BibleStudy`)

---

## Environment Variables

### Backend (apps/api)
```env
NODE_ENV=development
PORT=3001
AWS_REGION=us-east-1
DYNAMODB_TABLE_PREFIX=apostolic-path-dev
COGNITO_USER_POOL_ID=
COGNITO_CLIENT_ID=
S3_BUCKET=apostolic-path-dev-uploads
```

### Frontend (apps/web)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_COGNITO_USER_POOL_ID=
NEXT_PUBLIC_COGNITO_CLIENT_ID=
NEXT_PUBLIC_COGNITO_DOMAIN=
```

---

## Development Workflow

### Local Development
```bash
# Install dependencies
pnpm install

# Start all services
pnpm dev

# Start individual services
pnpm --filter web dev
pnpm --filter api dev
```

### Testing
```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test:coverage

# E2E tests
pnpm test:e2e
```

### Database (Local)
- Use DynamoDB Local for development
- Seed scripts in `/packages/database/seeds`

---

## Definition of Done

A feature is complete when:
1. ✅ Code compiles with no TypeScript errors
2. ✅ Unit tests written and passing
3. ✅ API endpoints documented with OpenAPI schema
4. ✅ Frontend components have Storybook stories (if applicable)
5. ✅ Multi-tenant isolation verified
6. ✅ Mobile responsive (if frontend)
7. ✅ Accessibility basics met (semantic HTML, ARIA labels)
8. ✅ Code reviewed and approved

---

## Key Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-01-19 | Monorepo with pnpm workspaces | Shared code, unified tooling |
| 2026-01-19 | DynamoDB as primary DB | Serverless scale, AWS integration |
| 2026-01-19 | Fastify over Express | Better TypeScript, faster performance |
| 2026-01-19 | shadcn/ui for components | Customizable, accessible, modern |

---

## Future Considerations

- [ ] Mobile app (React Native or Capacitor)
- [ ] Offline support for studies
- [ ] Multi-language support (Spanish priority)
- [ ] Integration with church management systems
- [ ] Video lesson hosting
- [ ] AI-powered follow-up suggestions

---

## Resources

- [UPCI Official](https://www.upci.org/)
- [Search for Truth Bible Studies](https://pentecostalpublishing.com/)
- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)
- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Fastify Documentation](https://www.fastify.io/)
