# Inventory Management System Frontend - Integration PRD

## Purpose

This document is the implementation contract for a separate frontend repository that consumes the Inventory Management System backend. It describes the currently implemented backend behavior and the frontend responsibilities needed for a secure cookie-authenticated application.

## Product Goal

Build an authenticated inventory-management interface for `ADMIN` and `STAFF` users. The frontend must manage categories, products, stock operations, low-stock monitoring, and user visibility according to the backend's role rules.

## Backend Connection

| Setting | Local value |
| --- | --- |
| API base URL | `http://localhost:8080` |
| Health endpoint | `GET /api/health` |
| OpenAPI specification | `GET /v3/api-docs` |
| Swagger UI | `http://localhost:8080/swagger-ui.html` |
| Allowed local frontend origins | `http://localhost:5173`, `http://localhost:3000`, `http://127.0.0.1:5173` |

The frontend must use a configurable API base URL, for example `VITE_API_BASE_URL`, rather than hard-coding localhost in application code.

## Authentication Contract

The backend uses cookie-based authentication. It does not return access or refresh tokens in JSON.

| Cookie | Attributes | Scope | Purpose |
| --- | --- | --- | --- |
| `access_token` | `HttpOnly`, `SameSite=Lax`, configurable `Secure` | `/` | Authenticates protected API requests; expires after 15 minutes by default |
| `refresh_token` | `HttpOnly`, `SameSite=Lax`, configurable `Secure` | `/api/auth` | Refreshes the access session; expires after 7 days by default |
| `XSRF-TOKEN` | Readable by JavaScript | `/` | CSRF token that must be mirrored in the `X-XSRF-TOKEN` request header |

JavaScript must never try to read, store, or attach access/refresh tokens. The browser sends those cookies automatically when requests include credentials.

### Required Client Request Behavior

Every API request must use credentials:

```ts
fetch(`${apiBaseUrl}/api/products`, {
  credentials: 'include',
});
```

For `POST`, `PUT`, `PATCH`, and `DELETE`, include the `X-XSRF-TOKEN` header using the value of the readable `XSRF-TOKEN` cookie:

```ts
fetch(`${apiBaseUrl}/api/products`, {
  method: 'POST',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
    'X-XSRF-TOKEN': readCookie('XSRF-TOKEN'),
  },
  body: JSON.stringify(product),
});
```

On application startup, call `GET /api/auth/csrf` with `credentials: 'include'` to initialize the CSRF cookie. Login and registration do not require a CSRF header. Refresh and logout do require it.

### Authentication Endpoints

| Method | Path | Request body | Success response |
| --- | --- | --- | --- |
| GET | `/api/auth/csrf` | None | `{ "headerName": "X-XSRF-TOKEN" }`; initializes CSRF cookie |
| POST | `/api/auth/register` | `{ name, email, password, role? }` | `201`; sets auth cookies; returns `{ id, name, email, role }` |
| POST | `/api/auth/login` | `{ email, password }` | `200`; sets auth cookies; returns `{ id, name, email, role }` |
| POST | `/api/auth/refresh` | None | `200`; requires CSRF; updates auth cookies; returns `{ "message": "Access token refreshed" }` |
| POST | `/api/auth/logout` | None | `200`; requires CSRF; clears cookies; returns `{ "message": "Logged out successfully" }` |

Suggested session behavior:

1. Initialize CSRF when the app starts.
2. Present the login page when protected API calls return `401`.
3. On a `401`, attempt one `POST /api/auth/refresh` with the CSRF header, then retry the original request once if refresh succeeds.
4. If refresh fails, clear in-memory user state and route to login.
5. On logout, call the logout endpoint before clearing frontend state.

## Roles and UI Access

| Capability | ADMIN | STAFF |
| --- | --- | --- |
| View products, categories, and low-stock list | Yes | Yes |
| Adjust stock in/out | Yes | Yes |
| Create, edit, or delete products | Yes | No |
| Create, edit, or delete categories | Yes | No |
| View users | Yes | No |

The frontend should hide unavailable actions for `STAFF`, but backend authorization remains the source of enforcement. Always handle `403` responses gracefully.

## API Resource Contract

| Resource | Endpoints |
| --- | --- |
| Products | `GET /api/products?search=&categoryId=`, `GET /api/products/{id}`, `POST /api/products`, `PUT /api/products/{id}`, `DELETE /api/products/{id}`, `POST /api/products/{id}/stock/in`, `POST /api/products/{id}/stock/out`, `GET /api/products/low-stock` |
| Categories | `GET /api/categories`, `GET /api/categories/{id}`, `POST /api/categories`, `PUT /api/categories/{id}`, `DELETE /api/categories/{id}` |
| Users | `GET /api/users`, `GET /api/users/{id}` |

### Core Data Shapes

```ts
type Role = 'ADMIN' | 'STAFF';

type AuthSession = {
  id: number;
  name: string;
  email: string;
  role: Role;
};

type Product = {
  id: number;
  name: string;
  description: string | null;
  sku: string;
  price: number;
  quantity: number;
  minimumStock: number;
  lowStock: boolean;
  categoryId: number | null;
  categoryName: string;
  createdAt: string;
  updatedAt: string;
};

type ProductRequest = {
  name: string;
  description?: string;
  sku: string;
  price: number;
  quantity?: number;
  minimumStock: number;
  categoryId: number;
};

type Category = {
  id: number;
  name: string;
  description: string | null;
  productCount: number;
};
```

## Required Screens

| Screen | Required behavior |
| --- | --- |
| Login | Authenticate with email/password; retain only returned user details in client state; never persist tokens |
| Inventory dashboard | Show product summary and low-stock products |
| Product list | Search by name/SKU, filter by category, and navigate to product detail/edit views |
| Product form | Admin-only create/edit form with server validation messages |
| Stock operation | Admin/Staff stock-in and stock-out actions with positive quantity validation and insufficient-stock errors |
| Category management | Category list for all users; admin-only create/edit/delete actions |
| User list | Admin-only user list |

## Error Handling

The API returns errors shaped like:

```ts
type ApiError = {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
  validationErrors?: Record<string, string>;
};
```

Map `validationErrors` to field-level form messages. Treat `400` as a request/business-rule error, `401` as session recovery/login, `403` as a permission error, `404` as a missing resource, and `500` as a recoverable system error.

## Production Requirements

1. Serve the backend over HTTPS and set `COOKIE_SECURE=true`.
2. Use explicit production frontend origins in `app.cors.allowed-origins`; do not use wildcard origins with credentials.
3. Keep `COOKIE_SAME_SITE=Lax` unless a cross-site deployment requires a reviewed change. A cross-site cookie requires `SameSite=None`, `Secure=true`, and continued CSRF protection.
4. Do not log request headers, cookies, or authentication responses containing sensitive values.
5. Deploy the frontend and API on the same site where possible to simplify cookie behavior.

## Frontend Completion Checklist

- [ ] Configurable API base URL is implemented.
- [ ] Every API request uses `credentials: 'include'`.
- [ ] CSRF initialization and header injection are implemented.
- [ ] No access or refresh token is stored in local storage, session storage, state persistence, or logs.
- [ ] Login, refresh-once, logout, `401`, and `403` flows are handled.
- [ ] `ADMIN` and `STAFF` UI permissions are applied.
- [ ] Form validation errors are displayed from `validationErrors`.
- [ ] Production deployment uses HTTPS, `COOKIE_SECURE=true`, and explicit allowed origins.
