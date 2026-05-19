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

## Production Auth Checklist

- Set `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` to `https://mrcreativist.vercel.app`.
- Set `RESEND_API_KEY` and a verified `RESEND_FROM_EMAIL` so OTP and password reset emails reach users.
- In Firebase Console, add `mrcreativist.vercel.app` under Authentication -> Settings -> Authorized domains.
- Enable the Google provider in Firebase Authentication.
- Add `FIREBASE_SERVICE_ACCOUNT_JSON` only if server push notifications should be sent from the app.

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
