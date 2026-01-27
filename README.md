# learnloop-backend

Backend for LearnLoop - A human-first learning social app for students.

## Core Philosophy

This platform is intentionally human-first and does NOT use AI to generate, suggest, summarize, or assist with content. Learning is demonstrated through short written explanations by users.

## Tech Stack

- **Runtime**: Node.js (ES Modules)
- **Framework**: Express (to be added in Phase 2)
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Auth**: Email + password with JWT (to be added in Phase 2)

## Current Status: Phase 1 Complete ✅

### Implemented
- ✅ Database schema design
- ✅ Prisma ORM setup
- ✅ All data models with proper relations, constraints, and indexes

### Database Models
1. **User** - User accounts with UUID, email, username, and learning score
2. **Topic** - Subject categories for organizing posts
3. **Post** - User-generated learning content with soft delete support
4. **Comment** - User comments on posts
5. **SavedPost** - User bookmarks with composite primary key
6. **Vote** - Upvote-only system for posts and comments

See [SETUP.md](./SETUP.md) for detailed setup instructions and database schema documentation.

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure your database connection in `.env`:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/learnloop?schema=public"
   ```

3. Run migrations to create the database schema:
   ```bash
   npx prisma migrate dev --name init
   ```

4. (Optional) Open Prisma Studio to view the database:
   ```bash
   npx prisma studio
   ```

## What's Next

Phase 1 is complete. Future phases will implement:
- API routes and controllers
- Authentication middleware
- Business logic for content validation
- Frontend/UI

## Project Structure

```
learnloop-backend/
├── prisma/
│   └── schema.prisma      # Database schema definition
├── prisma.config.ts       # Prisma configuration
├── package.json           # Node.js dependencies
├── SETUP.md              # Detailed setup instructions
└── README.md             # This file
```

## License

ISC