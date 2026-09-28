# Stockwise Inventory Frontend

React + Vite frontend for the Inventory Management System backend.

## Run locally

1. Copy `.env.example` to `.env` and set `VITE_API_BASE_URL` if the API is not at `http://localhost:8080`.
2. Start the backend, then run `npm run dev`.

The client uses cookie-authenticated requests (`credentials: 'include'`) and initializes the backend CSRF cookie on startup. It never stores access or refresh tokens in browser storage.
