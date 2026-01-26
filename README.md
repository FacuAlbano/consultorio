# Consultorio

A modern full-stack web application built with React Router v7, TypeScript, Shadcn UI, Drizzle ORM, and Supabase.

## Tech Stack

- **React Router v7** - Framework mode with file-based routing
- **TypeScript** - Type-safe development
- **Shadcn UI** - Beautiful, accessible component library
- **Drizzle ORM** - Type-safe database queries
- **Supabase** - Backend as a service (Auth, Database, Storage)
- **Tailwind CSS v4** - Utility-first styling

## Getting Started

### Prerequisites

- Node.js 20.19+ or 22.12+
- npm or yarn
- A Supabase account and project

### Installation

1. Clone and install dependencies:
```bash
npm install
```

2. Set up environment variables:
Create a `.env` file in the root directory (use `.env.example` as reference):

```env
# Database Configuration (Supabase PostgreSQL connection string)
DATABASE_URL=postgresql://postgres:[your-password]@[your-project-ref].supabase.co:5432/postgres

# Session Secret (for authentication)
SESSION_SECRET=your-super-secret-key-here
```

3. Run database migrations:
```bash
# Generate migration files
npm run db:generate

# Push schema to database
npm run db:push
```

4. Start the development server:
```bash
npm run dev
```

Visit http://localhost:5173 to see your app!

## Project Structure

```
consultorio/
├── app/
│   ├── components/
│   │   └── ui/          # Shadcn UI components
│   ├── db/
│   │   ├── schema.ts    # Database schema definitions
│   │   └── client.ts    # Drizzle database client
│   ├── lib/
│   │   └── utils.ts     # Utility functions
│   ├── routes/          # File-based routes
│   │   ├── _auth.tsx    # Auth layout
│   │   ├── _auth.login.tsx
│   │   ├── _auth.logout.tsx
│   │   ├── _dashboard.tsx
│   │   └── _dashboard._index.tsx
│   ├── app.css          # Global styles
│   ├── root.tsx         # Root component
│   └── routes.ts        # Route configuration
├── public/              # Static assets
├── drizzle/             # Database migrations
├── drizzle.config.ts    # Drizzle configuration
└── react-router.config.ts
```

## File-Based Routing

This project uses React Router v7's file-based routing convention. Create files in `app/routes/` to define routes:

- `_index.tsx` - Index route (`/`)
- `about.tsx` - About page (`/about`)
- `blog._index.tsx` - Blog index (`/blog`)
- `blog.$slug.tsx` - Dynamic blog post (`/blog/:slug`)

Learn more: [File Route Conventions](https://reactrouter.com/en/main/route/route)

## Database Management

### Drizzle Commands

```bash
# Generate migration files after schema changes
npm run db:generate

# Push schema directly to database (dev)
npm run db:push

# Run migrations
npm run db:migrate

# Open Drizzle Studio (database GUI)
npm run db:studio
```

### Schema Example

Edit `app/db/schema.ts` to define your database tables:

```typescript
export const posts = pgTable("posts", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

## Adding Shadcn Components

Add new components from the Shadcn library:

```bash
npx shadcn@latest add [component-name]
```

Example:

```bash
npx shadcn@latest add input form dialog
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run typecheck` - Run TypeScript type checking
- `npm run db:generate` - Generate database migrations
- `npm run db:push` - Push schema to database
- `npm run db:migrate` - Run migrations
- `npm run db:studio` - Open Drizzle Studio

## Deployment

Build your app for production:

```bash
npm run build
```

Then deploy the `build/` directory to your hosting provider of choice.

For Supabase hosting, check out: [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

## Learn More

- [React Router Documentation](https://reactrouter.com/)
- [Shadcn UI Documentation](https://ui.shadcn.com/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## License

MIT
