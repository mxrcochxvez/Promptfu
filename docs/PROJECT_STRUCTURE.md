# Project Structure

This document provides a comprehensive guide to the file and directory organization in the Promptfu LMS codebase.

## Table of Contents

- [Root Directory](#root-directory)
- [Source Directory (`src/`)](#source-directory-src)
- [Database Directory (`db/`)](#database-directory-db)
- [Configuration Files](#configuration-files)
- [Naming Conventions](#naming-conventions)
- [Where to Find Things](#where-to-find-things)

## Root Directory

```
promptfu/
├── db/                    # Database migrations and SQL
├── dist/                  # Build output (generated)
├── docs/                  # Documentation
├── node_modules/          # Dependencies (generated)
├── public/                # Static assets
├── scripts/               # Utility scripts
├── src/                   # Source code
├── .env.local             # Environment variables (not in git)
├── drizzle.config.ts      # Drizzle ORM configuration
├── netlify.toml           # Netlify deployment config
├── package.json           # Dependencies and scripts
├── pnpm-lock.yaml         # Lock file
├── README.md              # Project README
├── tsconfig.json          # TypeScript configuration
└── vite.config.ts         # Vite build configuration
```

## Source Directory (`src/`)

The `src/` directory contains all application source code:

```
src/
├── components/            # Reusable React components
├── contexts/             # React contexts (AuthContext)
├── data/                  # Static data and demo files
├── db/                    # Database layer
│   ├── auth-queries.ts   # Authentication queries
│   ├── index.ts          # Database connection
│   ├── queries.ts        # Main database queries
│   └── schema.ts         # Database schema definitions
├── hooks/                 # Custom React hooks (currently empty)
├── integrations/          # Third-party integrations
│   └── tanstack-query/   # TanStack Query setup
├── lib/                   # Utility libraries
│   ├── api/              # Server function definitions
│   ├── auth.ts           # Authentication utilities
│   └── slug.ts           # Slug generation
├── routes/                # File-based routes (pages)
├── db.ts                  # Legacy database file
├── router.tsx            # Router configuration
├── routeTree.gen.ts       # Generated route tree (auto-generated)
└── styles.css            # Global styles
```

## Components Directory

Reusable React components located in `src/components/`:

```
components/
├── ClassCard.tsx          # Display class information cards
├── CommunityCard.tsx     # Community listing cards
├── FeedbackForm.tsx      # Feedback submission form
├── Header.tsx            # Main navigation header
├── MarkdownRenderer.tsx   # Renders markdown content
├── ProgressBar.tsx       # Progress indicator component
├── ReplyCard.tsx          # Community reply display
├── RightSidebar.tsx      # Sidebar navigation for classes
├── TestQuestion.tsx      # Test question display
├── ThreadCard.tsx        # Community thread cards
└── UserMenu.tsx          # User dropdown menu
```

### Component Patterns

- **Naming**: PascalCase (e.g., `ClassCard.tsx`)
- **Location**: One component per file
- **Props**: TypeScript interfaces defined in file
- **Styling**: Tailwind CSS classes

## Routes Directory

File-based routing structure in `src/routes/`:

```
routes/
├── __root.tsx            # Root layout (wraps all routes)
├── index.tsx              # Home page (/)
├── login.tsx              # Login page (/login)
├── signup.tsx             # Signup page (/signup)
├── dashboard.tsx          # User dashboard (/dashboard)
├── setup-admin.tsx        # Admin setup page (/setup-admin)
│
├── classes/               # Class-related routes
│   ├── $classId/          # Routes using class ID
│   │   ├── tests/
│   │   │   └── $testId.tsx
│   │   └── units/
│   │       └── $unitId/
│   │           └── lessons/
│   │               └── $lessonId.tsx
│   │
│   ├── $slug/            # Routes using class slug (preferred)
│   │   ├── tests/
│   │   │   └── $testId.tsx
│   │   ├── units/
│   │   │   ├── $unitId/
│   │   │   │   └── lessons/
│   │   │   │       └── $lessonId.tsx
│   │   │   └── $unitId.tsx
│   │   └── lessons/
│   │
│   ├── $classId.tsx       # Legacy class page (by ID)
│   └── $slug.tsx           # Class page (by slug)
│
├── communities/           # Community/forum routes
│   ├── $communityId/
│   │   └── threads/
│   │       └── $threadId.tsx
│   └── $communityId.tsx
│
├── communities.tsx        # Communities listing
│
└── admin/                 # Admin panel routes
    ├── classes/
    │   ├── $classId/
    │   │   ├── edit.tsx
    │   │   ├── tests/
    │   │   │   └── create.tsx
    │   │   └── units/
    │   │       ├── $unitId/
    │   │       │   └── edit.tsx
    │   │       │   └── lessons/
    │   │       │       ├── $lessonId/
    │   │       │       │   └── edit.tsx
    │   │       │       └── create.tsx
    │   │       └── create.tsx
    │   ├── create.tsx
    │   └── index.tsx
    ├── feedback.tsx
    └── users/
        ├── $userId/
        │   └── edit.tsx
        ├── create.tsx
        └── index.tsx
```

### Route File Naming

- **Static routes**: `filename.tsx` → `/filename`
- **Dynamic routes**: `$param.tsx` → `/:param`
- **Layout routes**: `__root.tsx` or nested folders
- **Index routes**: `index.tsx` → default for parent path
- **Nested routes**: Folder structure creates nested paths

## Database Directory

Database-related code in `src/db/`:

```
db/
├── index.ts              # Database connection setup
├── schema.ts              # Drizzle schema definitions
├── queries.ts             # Main query functions
└── auth-queries.ts        # Authentication queries
```

### Database Files

- **`schema.ts`**: Table definitions using Drizzle ORM
- **`queries.ts`**: Reusable query functions (classes, units, lessons, tests, progress, communities)
- **`auth-queries.ts`**: User authentication and management queries
- **`index.ts`**: Database connection pool and Drizzle setup

## Database Migrations

SQL migrations in `db/`:

```
db/
├── init.sql               # Initial database schema
└── migrations/
    └── add-slug-to-classes.sql
```

## Scripts Directory

Utility scripts in `scripts/`:

```
scripts/
├── backfill-communities.ts  # Create communities for existing classes
├── backfill-slugs.ts        # Generate slugs for existing classes
├── run-slug-migration.sh    # Shell script for slug migration
└── run-slug-migration.ts    # TypeScript slug migration script
```

## Library Directory (`lib/`)

Utility libraries in `src/lib/`:

```
lib/
├── api/                   # Server function definitions
│   ├── auth.login.ts     # Login server function
│   ├── auth.logout.ts    # Logout server function
│   ├── auth.signup.ts    # Signup server function
│   ├── auth.verify.ts    # Token verification
│   └── feedback.ts       # Feedback API
├── auth.ts                # Authentication utilities (JWT, bcrypt)
└── slug.ts                # Slug generation utilities
```

## Contexts Directory

React contexts in `src/contexts/`:

```
contexts/
└── AuthContext.tsx        # Authentication context provider
```

## Integrations Directory

Third-party integrations in `src/integrations/`:

```
integrations/
└── tanstack-query/
    ├── devtools.tsx      # Query devtools component
    └── root-provider.tsx # Query provider setup
```

## Configuration Files

### Root Level Configs

- **`package.json`**: Dependencies, scripts, project metadata
- **`tsconfig.json`**: TypeScript compiler configuration
- **`vite.config.ts`**: Vite build tool configuration
- **`drizzle.config.ts`**: Drizzle ORM configuration
- **`netlify.toml`**: Netlify deployment settings

### Environment Files

- **`.env.local`**: Local environment variables (not committed)
- Variables prefixed with `VITE_` are exposed to client
- Other variables are server-only

## Public Directory

Static assets served from `public/`:

```
public/
├── favicon.ico
├── logo192.png
├── logo512.png
├── manifest.json
├── promptfu-logo.png
├── robots.txt
└── ... (various SVG files)
```

Files in `public/` are served at root URL (e.g., `/promptfu-logo.png`).

## Build Output

Generated files in `dist/` (created during build):

```
dist/
├── client/               # Client-side assets
│   └── assets/          # Bundled JS/CSS
└── server/              # Server-side code
    └── server.js        # Server entry point
```

**Do not edit files in `dist/`** - they are regenerated on each build.

## Naming Conventions

### Files

- **Components**: PascalCase (e.g., `ClassCard.tsx`)
- **Utilities**: camelCase (e.g., `auth.ts`, `slug.ts`)
- **Routes**: kebab-case or dynamic (e.g., `index.tsx`, `$slug.tsx`)
- **Server functions**: camelCase with type suffix (e.g., `auth.login.ts`)

### Directories

- **Lowercase**: All directory names use lowercase
- **Kebab-case**: Multi-word directories use hyphens (e.g., `tanstack-query`)

### Variables and Functions

- **camelCase**: Variables, functions, methods
- **PascalCase**: Components, classes, types, interfaces
- **UPPER_SNAKE_CASE**: Constants, environment variables

### Database

- **snake_case**: Database tables and columns
- **camelCase**: Drizzle schema properties (mapped to snake_case)

## Where to Find Things

### Adding a New Route

**Location**: `src/routes/`
- Create a new `.tsx` file or folder
- File name determines route path
- See [ROUTING.md](./ROUTING.md) for details

### Adding a New Component

**Location**: `src/components/`
- Create new `.tsx` file
- Export as default or named export
- Import where needed

### Adding a Database Query

**Location**: `src/db/queries.ts`
- Add new query function
- Use Drizzle ORM
- Export for use in server functions

### Adding Authentication

**Location**: `src/lib/auth.ts` or `src/db/auth-queries.ts`
- Auth utilities: `src/lib/auth.ts`
- User queries: `src/db/auth-queries.ts`
- Server functions: `src/lib/api/auth.*.ts`

### Adding a Server Function (API Endpoint)

**Location**: `src/lib/api/`
- Create new file (e.g., `myFeature.ts`)
- Use `createServerFn` from TanStack Start
- Call from components via TanStack Query

### Modifying Database Schema

**Location**: `src/db/schema.ts`
- Update Drizzle table definitions
- Run `pnpm db:push` to sync
- Or generate migration with `pnpm db:generate`

### Adding Styles

**Location**: `src/styles.css`
- Global styles
- Tailwind directives
- Custom CSS variables

### Adding Admin Routes

**Location**: `src/routes/admin/`
- Create route under `admin/` folder
- Use admin middleware (see [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md))
- Protect with `requireAdmin()`

### Finding Example Code

**Search patterns**:
- Routes: Look in `src/routes/` for similar routes
- Components: Check `src/components/` for similar components
- Queries: Search `src/db/queries.ts` for similar queries
- Server functions: Check `src/lib/api/` for patterns

## File Organization Principles

1. **Feature-based**: Related code grouped together
2. **Separation of concerns**: Clear boundaries between layers
3. **Reusability**: Shared code in appropriate directories
4. **Scalability**: Structure supports growth

## Generated Files

These files are auto-generated and should not be edited manually:

- `src/routeTree.gen.ts` - Generated by TanStack Router
- `dist/` - Build output directory
- `node_modules/` - Dependencies

## Related Documentation

- [Architecture](./ARCHITECTURE.md) - System design overview
- [Development Guide](./DEVELOPMENT_GUIDE.md) - How to add features
- [Routing](./ROUTING.md) - Detailed routing patterns

