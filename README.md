# Secure Notes Web

Frontend application for the Secure Notes assessment (Care Guide BD).

## Stack

- React 19, TypeScript, Vite 7, Tailwind CSS 4
- React Hook Form, `@hookform/resolvers`, Zod

## Prerequisites

- **Node.js `22.12+`** within the Node 22 line (`"engines": { "node": "22.x" }`).

## Configuration

Copy `.env.example` to `.env` for local development:

- `.env.example` sets `VITE_API_URL=http://localhost:4000`
- Production / hosted backend URL: `https://secure-notes-api-2wze.onrender.com`

`VITE_API_URL` is validated as a URL in [`src/lib/api.ts`](src/lib/api.ts) and bundled at build time by Vite. Make sure the backend `CORS_ORIGINS` allows your frontend origin (`http://localhost:5173` locally, or your deployed Vercel origin in production).

## Setup and Commands

```bash
npm ci
npm run dev
```

- `npm ci` — install exact dependencies from `package-lock.json`.
- `npm run dev` — start the local Vite dev server on `http://localhost:5173` (`strictPort: true`).
- `npm run typecheck` — run TypeScript type checking (`tsc --noEmit`).
- `npm run build` — typecheck and build production static assets (`tsc --noEmit && vite build`).
- `npm run preview` — preview the production build locally.

Production build output is written to `dist/`.

## Session Handling

- JWT access tokens and session state are stored **in React memory only** (`src/App.tsx`), not in `localStorage`, `sessionStorage`, or cookies.
- **Refreshing or closing the browser tab clears the session and requires logging in again.**
- Active sessions also clear automatically when the token expires (`expiresIn`) or when an authenticated API request returns `401`.

## Application Workflows

### Public (unauthenticated)

- **Log in** and **Create account** (public registration creates normal `USER` accounts with name, email, password of at least 12 characters, and optional comma-separated interests).
- **Public posts**: browse cursor-paginated posts, expand/collapse long post content, and filter posts by clicking **View author's posts**.

### Authenticated user (`USER` and `ADMIN`)

- **My notes**: create, view details, edit, delete (with confirmation), and cursor-paginate personal private notes.
- **Public posts**: publish new public posts in addition to browsing and filtering by author.

### Administrator (`ADMIN` only)

- **Users**: browse cursor-paginated users, view user details, create normal users, edit user profile fields (`name`, `email`, `interests`; roles and passwords cannot be modified), and delete normal users (`ADMIN` accounts are protected from deletion; deleting a normal user removes their notes and posts).
- **All notes**: read-only cursor-paginated inspection of all users' notes.
- **Interests**: browse cursor-paginated interest groups with user counts and drill down into cursor-paginated members for a selected interest.

## Verification Status

- **Checks performed**:
  - `npm run typecheck` (`tsc --noEmit`) passed.
  - `npm run build` (`tsc --noEmit && vite build`) passed on Node `v22.12.0` and produced the `dist/` bundle.
  - Initial project setup checked API connectivity against the backend; backend endpoint behavior is tested in `secure-notes-api`.
- **Checks still pending**:
  - This repository does not include an automated browser or unit test suite.
  - Authenticated live-browser verification of all user, public post, and admin workflows against `https://secure-notes-api-2wze.onrender.com` (and post-deployment CORS verification on Vercel) is still pending.
