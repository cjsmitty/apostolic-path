# Apostolic Path

> **Disciple. Track. Transform.**

A cloud-native SaaS discipleship platform for UPCI and Apostolic churches. Guide new students through the New Birth experience, track First Steps progress, and empower your teachers.

![License](https://img.shields.io/badge/license-private-red)
![Node](https://img.shields.io/badge/node-20+-green)
![TypeScript](https://img.shields.io/badge/typescript-5.3+-blue)

---

## 🎯 Mission

Fill the gap in Apostolic church technology by providing a comprehensive, easy-to-use discipleship tracking system that:

- 🔥 Guides new students through the **New Birth** experience (Repentance, Baptism, Holy Ghost)
- 📚 Tracks **Bible study** progress with popular curricula
- 👣 Manages **First Steps** discipleship journey
- 👨‍🏫 Enables teachers to manage their studies
- 📊 Gives pastors visibility into church-wide discipleship health

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, Next.js 14 (App Router), Tailwind CSS, shadcn/ui |
| **Backend** | Node.js 20, Fastify, TypeScript |
| **Database** | AWS DynamoDB (single-table design) |
| **Storage** | AWS S3 |
| **Auth** | AWS Cognito |
| **Deployment** | AWS Lambda/Fargate, API Gateway, CloudFront |
| **CI/CD** | GitHub Actions |

---

## 📁 Project Structure

```
apostolic-path/
├── apps/
│   ├── web/                 # Next.js frontend
│   └── api/                 # Fastify backend API
├── packages/
│   ├── shared/              # Shared types, schemas, utilities
│   └── database/            # DynamoDB client and table definitions
├── .github/
│   └── workflows/           # CI/CD pipelines
├── scripts/                 # Development scripts
├── docker-compose.yml       # Local development services
├── AGENTS.md               # AI agent context (detailed architecture)
└── README.md               # You are here!
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- pnpm 9+
- Docker (optional, for local AWS services)

### Setup

```bash
# Clone the repository
git clone https://github.com/cjsmitty/apostolic-path.git
cd apostolic-path

# Run setup script
chmod +x scripts/setup.sh
./scripts/setup.sh

# Or manually:
pnpm install
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

### Development

```bash
# Start local AWS services (DynamoDB, S3)
docker-compose up -d

# Start all services in development mode
pnpm dev

# Or start individually
pnpm --filter @apostolic-path/web dev   # Frontend at http://localhost:3000
pnpm --filter @apostolic-path/api dev   # Backend at http://localhost:3001
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all services in development mode |
| `pnpm build` | Build all packages and apps |
| `pnpm test` | Run all tests |
| `pnpm lint` | Lint all code |
| `pnpm typecheck` | Type-check all TypeScript |
| `pnpm format` | Format code with Prettier |

---

## 📖 API Documentation

When the API is running, visit:

- **Swagger UI**: http://localhost:3001/docs
- **Health Check**: http://localhost:3001/health

### Key Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/v1/health` | Health check |
| `GET /api/v1/churches/me` | Get current church |
| `GET /api/v1/students` | List all students |
| `POST /api/v1/students/:id/new-birth` | Update New Birth milestone |
| `GET /api/v1/studies` | List Bible studies |
| `GET /api/v1/lessons/study/:studyId` | Get lessons for a study |

---

## 🏛️ Architecture

### Multi-Tenant Design

All data is scoped to a `church_id` (tenant). This is enforced at:

1. **API Middleware**: Extract church from JWT claims
2. **Database**: Partition key includes church ID
3. **Authorization**: Role-based access per church

### DynamoDB Single-Table Design

```
PK: CHURCH#<churchId>    SK: METADATA           → Church data
PK: CHURCH#<churchId>    SK: USER#<userId>      → User data
PK: CHURCH#<churchId>    SK: STUDENT#<id>       → Student data
PK: CHURCH#<churchId>    SK: STUDY#<studyId>    → Study data
PK: STUDY#<studyId>      SK: LESSON#<lessonId>  → Lesson data
```

---

## 🤝 Contributing

This is a private project. See [AGENTS.md](./AGENTS.md) for detailed architecture documentation.

---

## 📜 License

Private - All Rights Reserved

---

## 🙏 Built For

Built with ❤️ for the Apostolic church. May this tool help bring many souls to the New Birth experience.

> *"Then Peter said unto them, Repent, and be baptized every one of you in the name of Jesus Christ for the remission of sins, and ye shall receive the gift of the Holy Ghost."* - Acts 2:38
