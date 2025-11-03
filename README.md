Welcome to Promptfu LMS! 

> **📚 Comprehensive Documentation**: See [docs/README.md](./docs/README.md) for complete documentation including architecture, development guides, API reference, and AI-specific guides.

# Getting Started

To run this application:

```bash
pnpm install
pnpm start
```

# Building For Production

To build this application for production:

```bash
pnpm build
```

## Deployment to Netlify

This application is configured for deployment to Netlify using the official TanStack Start Netlify plugin.

### Prerequisites

1. A Netlify account ([sign up here](https://app.netlify.com/signup))
2. Your project pushed to a Git repository (GitHub, GitLab, or Bitbucket)
3. A Neon PostgreSQL database (or any PostgreSQL database)
4. A strong JWT secret for production

### Deployment Steps

#### Option 1: Deploy via Netlify Dashboard (Recommended)

1. **Connect your repository:**
   - Log in to [Netlify](https://app.netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Connect your Git provider and select this repository

2. **Configure build settings:**
   - Netlify will auto-detect the build settings from `netlify.toml`
   - Build command: `pnpm build`
   - Publish directory: `dist/client`
   - Node version: `20` (specified in `.nvmrc`)

3. **Set environment variables:**
   Go to Site settings → Environment variables and add:
   ```
   VITE_DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require
   JWT_SECRET=your-strong-random-secret-key-here
   JWT_EXPIRES_IN=7d
   VITE_BASE_URL=https://your-site-name.netlify.app
   ```

4. **Deploy:**
   - Click "Deploy site"
   - Netlify will automatically build and deploy your application

#### Option 2: Deploy via Netlify CLI

1. **Install Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify:**
   ```bash
   netlify login
   ```

3. **Initialize and deploy:**
   ```bash
   netlify init
   netlify deploy --prod
   ```

   During initialization, you'll be prompted to set environment variables.

### Required Environment Variables

Set these in your Netlify site settings (Site settings → Environment variables):

- **`VITE_DATABASE_URL`** (Required): Your Neon PostgreSQL connection string
  - Format: `postgresql://username:password@host:port/database?sslmode=require`
  - Get this from your Neon dashboard

- **`JWT_SECRET`** (Required): A strong, random string for signing JWT tokens
  - Generate a secure secret: `openssl rand -base64 32`
  - **Never commit this to version control**

- **`JWT_EXPIRES_IN`** (Optional): JWT token expiration time
  - Default: `7d` (7 days)
  - Format: `1h`, `7d`, `30d`, etc.

- **`VITE_BASE_URL`** (Optional): Base URL for your deployed site
  - Used for generating absolute URLs in meta tags
  - Format: `https://your-site-name.netlify.app`
  - If not set, defaults to `https://promptfu.com`

### Post-Deployment

1. **Run database migrations:**
   If you need to run database migrations, you can use the Netlify CLI or connect to your database directly:
   ```bash
   pnpm db:push
   ```

2. **Create your first admin user:**
   - Visit `/setup-admin` on your deployed site, or
   - Sign up normally and manually set `is_admin = true` in your database

### Troubleshooting

- **Build failures:** Check that all environment variables are set correctly
- **Function errors:** Ensure `VITE_DATABASE_URL` is accessible from Netlify's servers
- **Authentication issues:** Verify `JWT_SECRET` is set and matches between deployments

## Testing

This project uses [Vitest](https://vitest.dev/) for testing. You can run the tests with:

```bash
pnpm test
```

## Styling

This project uses [Tailwind CSS](https://tailwindcss.com/) for styling.



## Setting up Database

This application uses PostgreSQL via Neon. You need to set up your database connection string.

### Option 1: Using Neon (Recommended)

When running the `dev` command, the `@neondatabase/vite-plugin-postgres` will identify there is not a database setup. It will then create and seed a claimable database.

It is the same process as [Neon Launchpad](https://neon.new).

> [!IMPORTANT]  
> Claimable databases expire in 72 hours.

### Option 2: Manual Setup

1. Create a `.env.local` file in the root directory
2. Add your database connection string:
   ```bash
   DATABASE_URL=postgresql://username:password@host:port/database
   ```
   
   Or if using Neon's serverless:
   ```bash
   VITE_DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require
   ```

**Important:** The connection string must be in the format:
- `postgresql://username:password@host:port/database`
- Make sure the username, password, host, and database name are correct
- For Neon, you typically need `?sslmode=require` at the end


## Setting up Authentication

The application uses custom email/password authentication with JWT tokens.

### Environment Variables

Add the following to your `.env.local` file:

```bash
JWT_SECRET=your-secret-key-here-change-in-production
JWT_EXPIRES_IN=7d  # Optional, defaults to 7 days
```

**Important:** The `JWT_SECRET` should be a strong, random string in production. Never commit it to version control.

### First Admin User

To create your first admin user, you can either:
1. Sign up normally and then manually set `is_admin = true` in the database, or
2. Use the admin panel (if you're already an admin) to create new users with admin privileges

### Authentication Flow

- Users sign up with email/password at `/signup`
- Users sign in at `/login`
- JWT tokens are stored in localStorage
- Protected routes check authentication status
- Admin routes require `isAdmin: true` flag



## Routing
This project uses [TanStack Router](https://tanstack.com/router). The initial setup is a file based router. Which means that the routes are managed as files in `src/routes`.

### Adding A Route

To add a new route to your application just add another a new file in the `./src/routes` directory.

TanStack will automatically generate the content of the route file for you.

Now that you have two routes you can use a `Link` component to navigate between them.

### Adding Links

To use SPA (Single Page Application) navigation you will need to import the `Link` component from `@tanstack/react-router`.

```tsx
import { Link } from "@tanstack/react-router";
```

Then anywhere in your JSX you can use it like so:

```tsx
<Link to="/about">About</Link>
```

This will create a link that will navigate to the `/about` route.

More information on the `Link` component can be found in the [Link documentation](https://tanstack.com/router/v1/docs/framework/react/api/router/linkComponent).

### Using A Layout

In the File Based Routing setup the layout is located in `src/routes/__root.tsx`. Anything you add to the root route will appear in all the routes. The route content will appear in the JSX where you use the `<Outlet />` component.

Here is an example layout that includes a header:

```tsx
import { Outlet, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

import { Link } from "@tanstack/react-router";

export const Route = createRootRoute({
  component: () => (
    <>
      <header>
        <nav>
          <Link to="/">Home</Link>
          <Link to="/about">About</Link>
        </nav>
      </header>
      <Outlet />
      <TanStackRouterDevtools />
    </>
  ),
})
```

The `<TanStackRouterDevtools />` component is not required so you can remove it if you don't want it in your layout.

More information on layouts can be found in the [Layouts documentation](https://tanstack.com/router/latest/docs/framework/react/guide/routing-concepts#layouts).


## Data Fetching

There are multiple ways to fetch data in your application. You can use TanStack Query to fetch data from a server. But you can also use the `loader` functionality built into TanStack Router to load the data for a route before it's rendered.

For example:

```tsx
const peopleRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/people",
  loader: async () => {
    const response = await fetch("https://swapi.dev/api/people");
    return response.json() as Promise<{
      results: {
        name: string;
      }[];
    }>;
  },
  component: () => {
    const data = peopleRoute.useLoaderData();
    return (
      <ul>
        {data.results.map((person) => (
          <li key={person.name}>{person.name}</li>
        ))}
      </ul>
    );
  },
});
```

Loaders simplify your data fetching logic dramatically. Check out more information in the [Loader documentation](https://tanstack.com/router/latest/docs/framework/react/guide/data-loading#loader-parameters).

### React-Query

React-Query is an excellent addition or alternative to route loading and integrating it into you application is a breeze.

First add your dependencies:

```bash
pnpm add @tanstack/react-query @tanstack/react-query-devtools
```

Next we'll need to create a query client and provider. We recommend putting those in `main.tsx`.

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// ...

const queryClient = new QueryClient();

// ...

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);

  root.render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
```

You can also add TanStack Query Devtools to the root route (optional).

```tsx
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

const rootRoute = createRootRoute({
  component: () => (
    <>
      <Outlet />
      <ReactQueryDevtools buttonPosition="top-right" />
      <TanStackRouterDevtools />
    </>
  ),
});
```

Now you can use `useQuery` to fetch your data.

```tsx
import { useQuery } from "@tanstack/react-query";

import "./App.css";

function App() {
  const { data } = useQuery({
    queryKey: ["people"],
    queryFn: () =>
      fetch("https://swapi.dev/api/people")
        .then((res) => res.json())
        .then((data) => data.results as { name: string }[]),
    initialData: [],
  });

  return (
    <div>
      <ul>
        {data.map((person) => (
          <li key={person.name}>{person.name}</li>
        ))}
      </ul>
    </div>
  );
}

export default App;
```

You can find out everything you need to know on how to use React-Query in the [React-Query documentation](https://tanstack.com/query/latest/docs/framework/react/overview).

## State Management

Another common requirement for React applications is state management. There are many options for state management in React. TanStack Store provides a great starting point for your project.

First you need to add TanStack Store as a dependency:

```bash
pnpm add @tanstack/store
```

Now let's create a simple counter in the `src/App.tsx` file as a demonstration.

```tsx
import { useStore } from "@tanstack/react-store";
import { Store } from "@tanstack/store";
import "./App.css";

const countStore = new Store(0);

function App() {
  const count = useStore(countStore);
  return (
    <div>
      <button onClick={() => countStore.setState((n) => n + 1)}>
        Increment - {count}
      </button>
    </div>
  );
}

export default App;
```

One of the many nice features of TanStack Store is the ability to derive state from other state. That derived state will update when the base state updates.

Let's check this out by doubling the count using derived state.

```tsx
import { useStore } from "@tanstack/react-store";
import { Store, Derived } from "@tanstack/store";
import "./App.css";

const countStore = new Store(0);

const doubledStore = new Derived({
  fn: () => countStore.state * 2,
  deps: [countStore],
});
doubledStore.mount();

function App() {
  const count = useStore(countStore);
  const doubledCount = useStore(doubledStore);

  return (
    <div>
      <button onClick={() => countStore.setState((n) => n + 1)}>
        Increment - {count}
      </button>
      <div>Doubled - {doubledCount}</div>
    </div>
  );
}

export default App;
```

We use the `Derived` class to create a new store that is derived from another store. The `Derived` class has a `mount` method that will start the derived store updating.

Once we've created the derived store we can use it in the `App` component just like we would any other store using the `useStore` hook.

You can find out everything you need to know on how to use TanStack Store in the [TanStack Store documentation](https://tanstack.com/store/latest).

# Demo files

Files prefixed with `demo` can be safely deleted. They are there to provide a starting point for you to play around with the features you've installed.

# Learn More

You can learn more about all of the offerings from TanStack in the [TanStack documentation](https://tanstack.com).
