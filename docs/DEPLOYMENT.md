# Deployment Guide

Complete guide for deploying Promptfu LMS to production on Netlify.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Netlify Deployment](#netlify-deployment)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Post-Deployment](#post-deployment)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying:

1. **Netlify Account**: [Sign up](https://app.netlify.com/signup)
2. **Git Repository**: Push code to GitHub, GitLab, or Bitbucket
3. **PostgreSQL Database**: Neon (recommended) or any PostgreSQL database
4. **JWT Secret**: Generate a strong secret key

## Netlify Deployment

### Option 1: Deploy via Netlify Dashboard (Recommended)

1. **Connect Repository**:
   - Log in to [Netlify](https://app.netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Connect your Git provider
   - Select this repository

2. **Build Settings** (Auto-detected from `netlify.toml`):
   - **Build command**: `pnpm build`
   - **Publish directory**: `dist/client`
   - **Node version**: `20` (or as specified)

3. **Set Environment Variables**:
   - Go to Site settings → Environment variables
   - Add all required variables (see below)

4. **Deploy**:
   - Click "Deploy site"
   - Netlify will build and deploy automatically

### Option 2: Deploy via Netlify CLI

1. **Install Netlify CLI**:
   ```bash
   npm install -g netlify-cli
   ```

2. **Login**:
   ```bash
   netlify login
   ```

3. **Initialize**:
   ```bash
   netlify init
   ```
   Follow prompts to connect to site or create new one.

4. **Deploy**:
   ```bash
   netlify deploy --prod
   ```

## Environment Variables

Set these in Netlify dashboard (Site settings → Environment variables):

### Required Variables

#### `VITE_DATABASE_URL`
PostgreSQL connection string.

**Format**:
```
postgresql://username:password@host:port/database?sslmode=require
```

**Example (Neon)**:
```
postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require
```

**Note**: Must start with `postgresql://` or `postgres://`

#### `JWT_SECRET`
Strong, random string for signing JWT tokens.

**Generate**:
```bash
openssl rand -base64 32
```

**Important**: 
- Must be strong and random
- Never commit to version control
- Use different secret for production vs development

### Optional Variables

#### `JWT_EXPIRES_IN`
JWT token expiration time.

**Default**: `7d`

**Valid formats**:
- `1h` - 1 hour
- `7d` - 7 days (default)
- `30d` - 30 days
- `365d` - 1 year

#### `VITE_BASE_URL`
Base URL for generating absolute URLs in meta tags.

**Format**:
```
https://your-site-name.netlify.app
```

**Default**: `https://promptfu.com` (if not set)

## Database Setup

### Using Neon (Recommended)

1. **Create Neon Account**: [neon.tech](https://neon.tech)
2. **Create Project**: Create new PostgreSQL project
3. **Get Connection String**: Copy connection string from dashboard
4. **Set in Netlify**: Add as `VITE_DATABASE_URL` environment variable
5. **Run Migrations**: See [Post-Deployment](#post-deployment)

### Using Other PostgreSQL

1. Set up PostgreSQL database
2. Get connection string
3. Set in Netlify as `VITE_DATABASE_URL`
4. Ensure SSL is enabled (`?sslmode=require`)

## Post-Deployment

### 1. Run Database Migrations

If you have migration files in `db/migrations/`:

**Option A: Via Netlify CLI**:
```bash
netlify functions:invoke run-migration
```

**Option B: Direct Database Connection**:
```bash
# Connect to database directly
psql $VITE_DATABASE_URL

# Run migrations
\i db/migrations/add-slug-to-classes.sql
```

**Option C: Via Script**:
```bash
pnpm db:push
```

### 2. Create Admin User

**Option A: Setup Page**:
- Visit `https://your-site.netlify.app/setup-admin`
- Create first admin user

**Option B: Manual Database**:
```sql
-- Connect to database
psql $VITE_DATABASE_URL

-- Update user to admin
UPDATE users SET is_admin = true WHERE email = 'your-email@example.com';
```

### 3. Verify Deployment

1. **Check Build Logs**: Netlify dashboard → Deploys → Build log
2. **Test Home Page**: Visit your site URL
3. **Test Authentication**: Try login/signup
4. **Test Admin Panel**: Login as admin, check `/admin/classes`

### 4. Set Up Custom Domain (Optional)

1. Go to Site settings → Domain management
2. Add custom domain
3. Configure DNS as instructed by Netlify

## Troubleshooting

### Build Failures

**Issue**: Build fails with dependency errors

**Solution**:
- Check Node version (should be 20)
- Ensure `pnpm-lock.yaml` is committed
- Check build logs for specific errors

**Issue**: TypeScript errors

**Solution**:
- Fix TypeScript errors locally first
- Ensure `tsconfig.json` is correct
- Check build logs for specific errors

**Issue**: Missing environment variables

**Solution**:
- Verify all required variables are set in Netlify
- Check variable names match exactly (case-sensitive)
- Redeploy after adding variables

### Runtime Errors

**Issue**: "DATABASE_URL environment variable is required"

**Solution**:
- Verify `VITE_DATABASE_URL` is set in Netlify
- Ensure connection string format is correct
- Redeploy after fixing

**Issue**: Database connection errors

**Solution**:
- Verify database is accessible from Netlify's servers
- Check connection string includes `?sslmode=require`
- Verify database credentials are correct
- Check database firewall/security settings

**Issue**: Authentication not working

**Solution**:
- Verify `JWT_SECRET` is set
- Ensure secret is strong (not default value)
- Check token expiration settings
- Clear browser localStorage and cookies

**Issue**: Admin routes not accessible

**Solution**:
- Verify user has `isAdmin: true` in database
- Check admin middleware is working
- Verify JWT token includes `isAdmin: true`

### Performance Issues

**Issue**: Slow page loads

**Solutions**:
- Enable Netlify's Edge caching
- Optimize images and assets
- Use batch queries (see [DATABASE.md](./DATABASE.md))
- Check database query performance

**Issue**: Timeout errors

**Solutions**:
- Optimize server functions
- Use batch queries instead of loops
- Check Netlify function timeout settings
- Consider database query optimization

## Continuous Deployment

Netlify automatically deploys on:

- **Push to main/master**: Production deployment
- **Pull requests**: Preview deployments
- **Manual trigger**: From Netlify dashboard

### Deployment Branch

Configure in Netlify:
- Site settings → Build & deploy → Production branch
- Default: `main` or `master`

### Preview Deployments

Every pull request gets a preview deployment:
- Unique URL for each PR
- Same environment variables as production
- Useful for testing before merge

## Monitoring

### Netlify Analytics

1. Enable Netlify Analytics in site settings
2. View page views, unique visitors
3. Monitor performance metrics

### Function Logs

1. Go to Netlify dashboard → Functions
2. View server function logs
3. Debug server-side issues

### Error Tracking

Consider adding error tracking:
- Sentry
- LogRocket
- Or Netlify's built-in error tracking

## Security Checklist

- [ ] Strong `JWT_SECRET` set (not default)
- [ ] `VITE_DATABASE_URL` uses SSL (`?sslmode=require`)
- [ ] Environment variables not committed to git
- [ ] HTTPS enabled (automatic on Netlify)
- [ ] Database credentials are secure
- [ ] Admin access properly protected
- [ ] CORS configured if needed

## Rollback

If deployment has issues:

1. Go to Netlify dashboard → Deploys
2. Find previous successful deploy
3. Click "Publish deploy"
4. Site rolls back to previous version

## Related Documentation

- [Getting Started](./GETTING_STARTED.md) - Local development setup
- [Architecture](./ARCHITECTURE.md) - System architecture
- [Database](./DATABASE.md) - Database schema and migrations

