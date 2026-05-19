# MR Creativist Next.js

Clean Next.js App Router rewrite of the legacy PHP project.

## Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Auth.js / NextAuth v5 credentials auth
- MongoDB Atlas
- Mongoose
- Vitest + React Testing Library

## Quick Start

1. Copy `.env.example` to `.env.local`.
2. Set `MONGODB_URI`, `MONGODB_DB`, `AUTH_SECRET`, `NEXTAUTH_SECRET`, and `NEXTAUTH_URL`.
3. Run `npm install`.
4. Seed MongoDB with `npm run db:seed`.
5. Start the app with `npm run dev`.

Seeded admin credentials:

- Email: `admin@mrcreativist.com`
- Password: `MrCreativist@12!2026@`

## Structure

The project intentionally contains no PHP files or legacy MVC structure. All app code lives in the modern Next.js layout:

- `app/` for routes, layouts, server actions, and route handlers
- `components/` for reusable UI, forms, and layout primitives
- `lib/` for auth-adjacent utilities, database access, validation, and API helpers
- `models/` for Mongoose schemas
- `scripts/seed.js` for MongoDB seed data
- `types/` for shared TypeScript declarations
- `hooks/` for client hooks
