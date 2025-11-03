# Getting Started

This guide will help you set up the Promptfu LMS development environment and get the application running locally.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [Building for Production](#building-for-production)
- [Common Issues](#common-issues)

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 20.x or higher
- **pnpm** 8.x or higher (package manager)
- **PostgreSQL** (optional, if not using Neon)
- **Git** (for version control)

### Installing Node.js

Download and install Node.js from [nodejs.org](https://nodejs.org/). Verify installation:

```bash
node --version  # Should show v20.x or higher
```

### Installing pnpm

```bash
npm install -g pnpm
```

Verify installation:

```bash
pnpm --version  # Should show 8.x or higher
```

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd promptfu
```

### 2. Install Dependencies

```bash
pnpm install
```

This will install all project dependencies defined in `package.json`.

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```bash
# Database Connection
VITE_DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require

# JWT Authentication
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# Optional: Base URL for deployment
VITE_BASE_URL=http://localhost:3000
```

### Environment Variable Descriptions

#### `VITE_DATABASE_URL` (Required)
PostgreSQL connection string.

**Format:**
```
postgresql://username:password@host:port/database?sslmode=require
```

**Examples:**
- Neon: `postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require`
- Local: `postgresql://postgres:password@localhost:5432/promptfu`

#### `JWT_SECRET` (Required)
Secret key for signing JWT tokens. **Must be a strong, random string in production.**

Generate a secure secret:
```bash
openssl rand -base64 32
```

**Never commit this to version control.**

#### `JWT_EXPIRES_IN` (Optional)
JWT token expiration time. Defaults to `7d` if not specified.

**Valid formats:**
- `1h` - 1 hour
- `7d` - 7 days
- `30d` - 30 days
- `365d` - 1 year

#### `VITE_BASE_URL` (Optional)
Base URL for generating absolute URLs in meta tags and Open Graph.

- Development: `http://localhost:3000`
- Production: `https://your-domain.com`

## Database Setup

### Option 1: Using Neon (Recommended for Development)

Neon is a serverless PostgreSQL service that works seamlessly with this project.

1. **Automatic Setup** (Development):
   When you run `pnpm dev`, the Neon Vite plugin will detect if there's no database configured and create a claimable database automatically.

2. **Manual Setup**:
   - Create a Neon account at [neon.tech](https://neon.tech)
   - Create a new project
   - Copy the connection string
   - Add it to `.env.local` as `VITE_DATABASE_URL`

> **Important:** Claimable databases expire in 72 hours. For production, use a permanent database.

### Option 2: Local PostgreSQL

1. **Install PostgreSQL** (if not installed):
   ```bash
   # macOS
   brew install postgresql
   
   # Ubuntu/Debian
   sudo apt-get install postgresql
   
   # Windows
   # Download from postgresql.org
   ```

2. **Create Database**:
   ```bash
   createdb promptfu
   ```

3. **Update `.env.local`**:
   ```bash
   VITE_DATABASE_URL=postgresql://postgres:password@localhost:5432/promptfu
   ```

4. **Run Migrations**:
   ```bash
   pnpm db:push
   ```

### Option 3: Docker PostgreSQL (Optional)

```bash
docker run --name promptfu-db \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=promptfu \
  -p 5432:5432 \
  -d postgres:15
```

Update `.env.local` accordingly.

## Running the Application

### Development Server

Start the development server:

```bash
pnpm dev
```

The application will be available at:
- **Local:** http://localhost:3000
- **Network:** Check terminal output for network URL

The dev server includes:
- Hot module replacement (HMR)
- TypeScript type checking
- Auto-reload on file changes

### First Run

On first run, you'll need to:

1. **Set up the database** (if using Neon auto-setup, this happens automatically)
2. **Create an admin user**:
   - Visit `/setup-admin` on your local server
   - Or sign up normally and manually set `is_admin = true` in the database

3. **Access the application**:
   - Home page: `http://localhost:3000`
   - Login: `http://localhost:3000/login`
   - Signup: `http://localhost:3000/signup`
   - Dashboard: `http://localhost:3000/dashboard` (requires login)
   - Admin Panel: `http://localhost:3000/admin/classes` (requires admin)

## Database Commands

### Push Schema Changes

After modifying `src/db/schema.ts`:

```bash
pnpm db:push
```

This will sync your schema changes to the database.

### Generate Migration

For production deployments, generate migration files:

```bash
pnpm db:generate
```

Creates migration files in `db/migrations/`.

### Apply Migrations

```bash
pnpm db:migrate
```

### Drizzle Studio (Database GUI)

Open Drizzle Studio to view and edit database:

```bash
pnpm db:studio
```

Opens at `http://localhost:4983` by default.

### Database Utilities

Run custom database scripts:

```bash
# Backfill communities for existing classes
pnpm db:backfill-communities

# Backfill slugs for existing classes
pnpm db:backfill-slugs

# Run slug migration
pnpm db:migrate-slug
```

## Building for Production

### Build the Application

```bash
pnpm build
```

This creates an optimized production build in the `dist/` directory:
- `dist/client/` - Client-side assets
- `dist/server/` - Server-side code

### Preview Production Build

Test the production build locally:

```bash
pnpm serve
```

Serves the built application (useful for testing before deployment).

## Project Scripts

Available npm/pnpm scripts:

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm serve` | Preview production build |
| `pnpm test` | Run tests |
| `pnpm db:generate` | Generate database migrations |
| `pnpm db:migrate` | Apply database migrations |
| `pnpm db:push` | Push schema changes to database |
| `pnpm db:pull` | Pull schema from database |
| `pnpm db:studio` | Open Drizzle Studio |

## Common Issues

### Issue: "DATABASE_URL environment variable is required"

**Solution:**
1. Create `.env.local` file in project root
2. Add `VITE_DATABASE_URL` with your connection string
3. Restart the dev server

### Issue: "Cannot connect to database"

**Solutions:**
1. Verify `VITE_DATABASE_URL` is correct
2. Check database server is running
3. Verify network/firewall settings
4. For Neon, ensure connection string includes `?sslmode=require`

### Issue: "Port 3000 already in use"

**Solution:**
1. Kill process using port 3000:
   ```bash
   # macOS/Linux
   lsof -ti:3000 | xargs kill
   
   # Or change port in vite.config.ts
   ```
2. Or use a different port:
   ```bash
   pnpm dev --port 3001
   ```

### Issue: "JWT_SECRET not set"

**Solution:**
1. Add `JWT_SECRET` to `.env.local`
2. Generate a secure secret:
   ```bash
   openssl rand -base64 32
   ```
3. Restart dev server

### Issue: "Module not found" errors

**Solution:**
1. Delete `node_modules` and reinstall:
   ```bash
   rm -rf node_modules pnpm-lock.yaml
   pnpm install
   ```
2. Clear Vite cache:
   ```bash
   rm -rf .vite
   ```

### Issue: TypeScript errors

**Solution:**
1. Ensure TypeScript is installed:
   ```bash
   pnpm add -D typescript
   ```
2. Check `tsconfig.json` configuration
3. Restart TypeScript server in your IDE

### Issue: Database migrations fail

**Solutions:**
1. Check database connection string
2. Verify user has CREATE/ALTER permissions
3. Check if tables already exist (may need to drop)
4. Review migration files in `db/migrations/`

## Next Steps

After setup:

1. **Read the Architecture Guide** - [ARCHITECTURE.md](./ARCHITECTURE.md)
2. **Explore Project Structure** - [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)
3. **Learn Development Patterns** - [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md)
4. **Understand Routing** - [ROUTING.md](./ROUTING.md)

## Development Tools

### Recommended IDE Extensions

- **VSCode:**
  - ESLint
  - Prettier
  - TypeScript and JavaScript Language Features
  - Tailwind CSS IntelliSense

### Browser DevTools

The application includes development tools:
- **TanStack Router DevTools** - Route debugging
- **TanStack Query DevTools** - Query debugging
- **React DevTools** - Component inspection

These are automatically enabled in development mode.

## Getting Help

- Check [Common Issues](#common-issues) above
- Review [ARCHITECTURE.md](./ARCHITECTURE.md) for system design
- See [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md) for development patterns
- Consult [AI_GUIDE.md](./AI_GUIDE.md) for AI-specific help

---

**Ready to start developing?** Check out [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md) next!

