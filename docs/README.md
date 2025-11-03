# Promptfu LMS Documentation

Welcome to the Promptfu Learning Management System documentation. This documentation is designed to help both AI agents and human developers understand, work with, and extend the codebase effectively.

## Documentation Overview

This documentation is organized into several sections covering different aspects of the application:

### Quick Start
- **[Getting Started](./GETTING_STARTED.md)** - Setup, installation, and first steps
- **[Architecture](./ARCHITECTURE.md)** - High-level system architecture and design decisions
- **[Project Structure](./PROJECT_STRUCTURE.md)** - File organization and directory layout

### Development Guides
- **[Development Guide](./DEVELOPMENT_GUIDE.md)** - How to work with the codebase, add features, and follow patterns
- **[Routing](./ROUTING.md)** - TanStack Router setup and file-based routing patterns
- **[Authentication](./AUTHENTICATION.md)** - Auth system, JWT tokens, and protected routes
- **[Patterns](./PATTERNS.md)** - Code patterns, conventions, and best practices

### Reference Documentation
- **[API Reference](./API_REFERENCE.md)** - Complete API endpoint and server function documentation
- **[Database](./DATABASE.md)** - Database schema, queries, and migration guide

### Operations
- **[Deployment](./DEPLOYMENT.md)** - Production deployment guide for Netlify
- **[AI Guide](./AI_GUIDE.md)** - AI-specific documentation with decision trees and common tasks

## Key Concepts

### Application Type
Promptfu is a **Learning Management System (LMS)** built with modern web technologies, featuring:
- Course management (Classes, Units, Lessons)
- Assessment system (Tests with multiple question types)
- Progress tracking
- Community/forum features
- Admin panel for content and user management

### Tech Stack
- **Frontend Framework**: TanStack Start (React with SSR)
- **Routing**: TanStack Router (file-based routing)
- **Data Fetching**: TanStack Query + Server Functions
- **Database**: PostgreSQL via Neon (serverless)
- **ORM**: Drizzle ORM
- **Styling**: Tailwind CSS
- **Authentication**: JWT tokens
- **Deployment**: Netlify

### Architecture Pattern
- **File-based routing** - Routes are defined by file structure in `src/routes/`
- **Server Functions** - API endpoints are created using `createServerFn` from TanStack Start
- **SSR/SPA Hybrid** - Server-side rendering with client-side navigation
- **Type-safe** - Full TypeScript coverage

## Common Tasks

### For New Developers
1. Start with [Getting Started](./GETTING_STARTED.md) to set up your environment
2. Read [Architecture](./ARCHITECTURE.md) to understand the system design
3. Review [Project Structure](./PROJECT_STRUCTURE.md) to learn where things are located
4. Follow [Development Guide](./DEVELOPMENT_GUIDE.md) examples to add features

### For AI Agents
1. Read [AI Guide](./AI_GUIDE.md) for decision trees and common patterns
2. Reference [Patterns](./PATTERNS.md) for code conventions
3. Check [API Reference](./API_REFERENCE.md) for available server functions
4. Consult [Database](./DATABASE.md) for schema and query patterns

### Quick Links by Task

**Adding a new route:**
- [Routing Guide](./ROUTING.md#adding-routes)
- [Development Guide](./DEVELOPMENT_GUIDE.md#adding-routes)

**Adding authentication:**
- [Authentication Guide](./AUTHENTICATION.md)
- [Patterns - Protected Routes](./PATTERNS.md#protected-routes)

**Creating database queries:**
- [Database Guide](./DATABASE.md#query-patterns)
- [API Reference](./API_REFERENCE.md#database-queries)

**Adding admin features:**
- [Development Guide - Admin Routes](./DEVELOPMENT_GUIDE.md#admin-features)
- [Authentication - Admin Access](./AUTHENTICATION.md#admin-routes)

**Deploying to production:**
- [Deployment Guide](./DEPLOYMENT.md)

## Documentation Structure

```
docs/
├── README.md              # This file - documentation index
├── ARCHITECTURE.md        # System architecture and design
├── GETTING_STARTED.md     # Setup and installation
├── PROJECT_STRUCTURE.md   # File organization guide
├── DEVELOPMENT_GUIDE.md   # How to work with the codebase
├── ROUTING.md             # Routing system documentation
├── AUTHENTICATION.md      # Authentication system
├── PATTERNS.md            # Code patterns and conventions
├── API_REFERENCE.md       # API and server function reference
├── DATABASE.md            # Database schema and queries
├── DEPLOYMENT.md          # Deployment guide
└── AI_GUIDE.md           # AI-specific documentation
```

## Contributing to Documentation

When adding or modifying features:
1. Update relevant documentation files
2. Add code examples where helpful
3. Cross-reference related sections
4. Update this index if adding new documentation files

## Need Help?

If you can't find what you're looking for:
1. Check the [AI Guide](./AI_GUIDE.md) for common tasks
2. Review [Patterns](./PATTERNS.md) for code examples
3. Search the codebase using the structure outlined in [Project Structure](./PROJECT_STRUCTURE.md)

---

**Last Updated**: 2024
**Project**: Promptfu LMS
**Version**: 1.0

