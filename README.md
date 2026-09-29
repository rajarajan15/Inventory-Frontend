# StockWise Frontend

React 19 + Vite frontend for the StockWise multi-organization inventory backend (`../Inventory-Backend`).

## Run locally

1. Copy `.env.example` to `.env` and set `VITE_API_BASE_URL` if the API is not at `http://localhost:8080`.
2. Start the backend, then run `npm install` (first time) and `npm run dev`. The app runs at `http://localhost:5173`,
   which must match the backend's `FRONTEND_BASE_URL` because email links point here.

| Script | Purpose |
| --- | --- |
| `npm run dev` | Development server with hot reload |
| `npm run lint` | ESLint (including React hooks rules) |
| `npm test` | Unit tests (Vitest + Testing Library) |
| `npm run build` | Production build with Content-Security-Policy |
| `npm run check` | Lint, test and build, as CI does (`.github/workflows/ci.yml`) |

Dependencies are pinned to exact versions; update them deliberately and commit `package-lock.json`.

## Areas and routes

| Area | Routes | Who |
| --- | --- | --- |
| Public | `/` landing, `/request-access` subscription request, `/invite/:token` accept invitation | Anyone |
| Super admin portal | `/platform/login`, `/platform/requests`, `/platform/organizations[/:id]` | StockWise owner only |
| Organization portal | `/o/:slug/login`, `/o/:slug/register`, `/o/:slug` dashboard, `/products`, `/categories`, `/users` | Members of that organization |

Each portal is a separate lazily loaded bundle (`src/areas`), so visitors of one area never download the other.

## Code structure

| Folder | Contents |
| --- | --- |
| `src/areas` | Route trees for the super admin and organization portals |
| `src/features/*` | One folder per feature (components, hooks) |
| `src/shared/api` | The only place that calls the backend: sessions, token refresh, `ApiError` |
| `src/shared/hooks` | `useAsync` (loading/error/reload, ignores out-of-date responses), `useDebouncedValue` |
| `src/shared/components` | Layout, form fields, alerts, pagination, `ErrorBoundary` |

Data loading goes through `useAsync`, which discards responses that arrive after the inputs changed (for example
while typing in search) and keeps the previous data visible while reloading.

## Authentication

Tokens are sent as `Authorization: Bearer <accessToken>`. The super admin session and the organization session are stored
separately (`stockwise_platform_session`, `stockwise_org_session` in `localStorage`), so a token is only ever sent to its own
area. An organization session is only used on the portal whose slug matches it. On `401` the client refreshes the token once
(parallel requests share one refresh) via `/api/auth/refresh`, then signs out of that area. Sign-ins and sign-outs in one
tab are reflected in all other tabs.

## Errors

Server messages are shown as-is with a heading based on the status (see `src/shared/utils/errorUtils.js`); field errors
appear next to their inputs. A rendering error shows a recovery screen instead of a blank page.

## Security

- **XSS:** React escapes all rendered text, and the app never uses `dangerouslySetInnerHTML`. Production builds
  (`npm run build`) include a Content-Security-Policy that allows only same-origin scripts, Google Fonts and the
  configured API origin. When hosting, also send `Content-Security-Policy: frame-ancestors 'none'` and
  `X-Content-Type-Options: nosniff` as HTTP headers.
- **CSRF:** there is no cookie authentication; tokens are sent only in the `Authorization` header.
- **Secrets:** only `VITE_API_BASE_URL` is read at build time. Never put secrets in `VITE_*` variables, because they are
  embedded in the public bundle.

See `FRONTEND_INTEGRATION_PRD.md` for the full backend contract.
