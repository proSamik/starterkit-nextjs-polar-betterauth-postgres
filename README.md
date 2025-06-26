# Next.js Polar Better Auth Starter Kit

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/cgoinglove/nextjs-polar-starter-kit&env=BETTER_AUTH_SECRET&env=POLAR_ACCESS_TOKEN&envDescription=Learn+more+about+how+to+get+the+API+Keys+for+the+application&envLink=https://github.com/cgoinglove/nextjs-polar-starter-kit/blob/main/.env.example&demo-title=Next.js+Polar+Starter+Kit&demo-description=A+powerful+Next.js+starter+kit+with+Polar.sh+payments,+Better+Auth,+and+Postgres&products=[{"type":"integration","protocol":"storage","productSlug":"neon","integrationSlug":"neon"}])

The complete Next.js starter kit for building modern web applications with payments, authentication, and database out of the box.

**🚀 Built with the best modern tools:**
- ⚡ **Next.js 15** - React framework with App Router
- 💳 **Polar.sh** - Simple, powerful payments and billing
- 🔐 **Better Auth** - Modern authentication with social providers
- 🗄️ **Postgres + Drizzle ORM** - Type-safe database operations
- 🎨 **Tailwind CSS** - Beautiful, responsive design system
- 🌍 **Internationalization** - Multi-language support with next-intl

Perfect for SaaS applications, e-commerce sites, and any web app that needs user accounts and payments.

## Table of Contents

- [Next.js Polar Better Auth Starter Kit](#nextjs-polar-better-auth-starter-kit)
  - [Table of Contents](#table-of-contents)
  - [Features](#features)
  - [Tech Stack](#tech-stack)
  - [Getting Started](#getting-started)
    - [Quick Start (Local Development)](#quick-start-local-development)
    - [Quick Start (Docker Compose)](#quick-start-docker-compose)
    - [Environment Variables](#environment-variables)
  - [Project Structure](#project-structure)
  - [Authentication](#authentication)
  - [Database](#database)
  - [Payments with Polar.sh](#payments-with-polarsh)
  - [Deployment](#deployment)
    - [Vercel Deployment](#vercel-deployment)
    - [Docker Deployment](#docker-deployment)
  - [Contributing](#contributing)

## Features

✨ **Authentication & User Management**
- Email/password authentication
- Social login (GitHub, Google)
- Account linking
- Session management
- User preferences

💳 **Payments & Billing**
- Polar.sh integration
- Subscription management
- One-time payments
- Webhook handling
- Customer portal

🗄️ **Database & ORM**
- PostgreSQL database
- Drizzle ORM with type safety
- Database migrations
- Schema management

🎨 **UI & UX**
- Modern, responsive design
- Dark/light theme support
- Mobile-first approach
- Accessible components with Radix UI

🌍 **Developer Experience**
- TypeScript everywhere
- ESLint + Prettier (Biome)
- Hot reload
- Docker support
- Easy deployment

## Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 15 with App Router |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS |
| **Authentication** | Better Auth |
| **Database** | PostgreSQL with Drizzle ORM |
| **Payments** | Polar.sh |
| **UI Components** | Radix UI |
| **Internationalization** | next-intl |
| **Icons** | Lucide React |
| **Animations** | Framer Motion |
| **Linting** | Biome |
| **Package Manager** | pnpm |

## Getting Started

> This project uses [pnpm](https://pnpm.io/) as the recommended package manager.

```bash
# If you don't have pnpm:
npm install -g pnpm
```

### Quick Start (Local Development)

```bash
# 1. Clone the repository
git clone https://github.com/cgoinglove/nextjs-polar-starter-kit.git
cd nextjs-polar-starter-kit

# 2. Install dependencies
pnpm install

# 3. Create environment variables file
cp .env.example .env

# 4. (Optional) Start PostgreSQL with Docker
pnpm docker:pg

# 5. Run database migrations
pnpm db:migrate

# 6. Start the development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see your application.

### Quick Start (Docker Compose)

```bash
# 1. Clone and install dependencies
git clone https://github.com/cgoinglove/nextjs-polar-starter-kit.git
cd nextjs-polar-starter-kit
pnpm install

# 2. Create environment variables
cp .env.example .env

# 3. Start all services with Docker Compose
pnpm docker-compose:up
```

### Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```env
# === Authentication ===
BETTER_AUTH_SECRET=your_secret_here
BETTER_AUTH_URL=http://localhost:3000

# === Database ===
POSTGRES_URL=postgres://username:password@localhost:5432/database

# === Payments ===
POLAR_ACCESS_TOKEN=your_polar_token

# === OAuth (Optional) ===
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

## Project Structure

```
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── (auth)/            # Authentication pages
│   │   ├── (dashboard)/       # Protected dashboard pages
│   │   ├── api/               # API routes
│   │   └── globals.css        # Global styles
│   ├── components/            # React components
│   │   ├── ui/               # Reusable UI components
│   │   └── layouts/          # Layout components
│   ├── lib/                  # Utility libraries
│   │   ├── auth/             # Authentication config
│   │   ├── db/               # Database config & schema
│   │   └── utils.ts          # Utility functions
│   └── types/                # TypeScript type definitions
├── messages/                 # Internationalization files
├── public/                   # Static assets
└── docker/                   # Docker configuration
```

## Authentication

This starter kit uses **Better Auth** for a complete authentication solution:

- **Multiple providers**: Email/password, GitHub, Google
- **Session management**: Secure, server-side sessions
- **Account linking**: Connect multiple auth methods
- **Type-safe**: Full TypeScript support

Authentication is configured in `src/lib/auth/` and API routes are handled automatically.

## Database

**PostgreSQL** with **Drizzle ORM** provides a robust, type-safe database layer:

- **Schema definition**: Type-safe schema in `src/lib/db/schema.pg.ts`
- **Migrations**: Automatic migration generation and running
- **Type safety**: Full TypeScript integration
- **Relationships**: Support for complex data relationships

Common commands:
```bash
pnpm db:generate    # Generate migrations
pnpm db:migrate     # Run migrations
pnpm db:studio      # Open Drizzle Studio
pnpm db:push        # Push schema changes
```

## Payments with Polar.sh

**Polar.sh** integration provides everything you need for payments and billing:

- **Subscription management**: Recurring billing made simple
- **One-time payments**: Support for single purchases
- **Customer portal**: Self-service customer management
- **Webhooks**: Real-time payment updates
- **International**: Global payment processing

Set up your Polar.sh account and add your access token to the environment variables.

## Deployment

### Vercel Deployment

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/cgoinglove/nextjs-polar-starter-kit)

1. Click the deploy button above
2. Configure your environment variables
3. Connect your PostgreSQL database (Neon, Supabase, etc.)
4. Deploy!

### Docker Deployment

```bash
# Build and run with Docker
docker build -t nextjs-polar-starter .
docker run -p 3000:3000 nextjs-polar-starter

# Or use Docker Compose for full stack
docker-compose -f docker/compose.yml up -d
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

**Built with ❤️ by the community**

Start building your next great web application today!
