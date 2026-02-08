# Kobonz - Coupon Marketplace Platform

A modern, scalable coupon marketplace platform built with Next.js, TypeScript, Prisma, and PostgreSQL.

## 🚀 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL (Neon)
- **ORM**: Prisma
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI)
- **Validation**: Zod

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL database (Neon recommended)
- npm or yarn or pnpm

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd kobonz
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Copy `.env.example` to `.env` and fill in your database credentials:
   ```bash
   cp .env.example .env
   ```

   Update the `DATABASE_URL` with your Neon PostgreSQL connection string:
   ```
   DATABASE_URL="postgresql://username:password@host:port/kobonz?schema=public"
   ```

4. **Set up the database**
   
   Generate Prisma client:
   ```bash
   npm run db:generate
   ```

   Push the schema to your database:
   ```bash
   npm run db:push
   ```

   Seed the database with initial data:
   ```bash
   npm run db:seed
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
kobonz/
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts            # Database seeding script
├── src/
│   ├── app/               # Next.js App Router
│   │   ├── globals.css    # Global styles
│   │   ├── layout.tsx     # Root layout
│   │   └── page.tsx       # Home page
│   ├── components/        # React components
│   │   └── ui/            # shadcn/ui components (to be added)
│   ├── lib/               # Utility libraries
│   │   ├── prisma.ts      # Prisma client instance
│   │   ├── utils.ts       # General utilities
│   │   ├── constants.ts   # App constants
│   │   ├── errors.ts      # Error classes
│   │   ├── api-response.ts # API response helpers
│   │   ├── validations/   # Zod schemas
│   │   │   ├── auth.ts
│   │   │   ├── store.ts
│   │   │   └── coupon.ts
│   │   └── utils/         # Utility functions
│   │       ├── slugify.ts
│   │       ├── date.ts
│   │       ├── password.ts
│   │       └── pagination.ts
│   ├── types/             # TypeScript type definitions
│   │   └── index.ts
│   └── middleware.ts      # Next.js middleware
├── .env                   # Environment variables
├── .env.example           # Environment variables template
├── next.config.mjs        # Next.js configuration
├── tailwind.config.ts     # Tailwind CSS configuration
├── tsconfig.json          # TypeScript configuration
└── package.json           # Dependencies and scripts
```

## 🗄️ Database Schema

The platform includes the following core models:

- **Users**: User accounts with role-based access (SUPER_ADMIN, STORE_OWNER, AFFILIATE, USER)
- **Stores**: Merchant stores with location and category associations
- **Coupons**: Discount coupons with various types and usage tracking
- **Categories**: Hierarchical category system
- **Locations**: Country → City → District hierarchy
- **Reviews**: Store reviews and ratings
- **Affiliates**: Affiliate link tracking system
- **Favorites**: User favorite coupons

All models include proper indexes for optimal query performance.

## 🧪 Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Database
npm run db:generate  # Generate Prisma Client
npm run db:push      # Push schema to database (without migrations)
npm run db:migrate   # Create and run migrations
npm run db:studio    # Open Prisma Studio
npm run db:seed      # Seed database with initial data
```

## 🎨 Adding shadcn/ui Components

To add shadcn/ui components:

```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog
# etc.
```

## 🔐 Security Notes

1. **Password Hashing**: Implement bcrypt for password hashing (see `src/lib/utils/password.ts`)
2. **Authentication**: Add NextAuth.js or similar for session management
3. **API Protection**: Implement middleware for protected routes
4. **Environment Variables**: Never commit `.env` file to version control

## 🚧 Next Steps

The foundation is now ready. Next steps for development:

1. Install bcrypt and implement password hashing
2. Set up authentication (NextAuth.js recommended)
3. Create API routes for CRUD operations
4. Build UI components for stores, coupons, and user management
5. Implement role-based access control
6. Add file upload functionality for images
7. Implement search and filtering
8. Add analytics and reporting features

## 📝 License

[Your License Here]

## 🤝 Contributing

[Your Contributing Guidelines Here]

<!-- Last deployment trigger: 2026-02-09 01:01:01 -->
