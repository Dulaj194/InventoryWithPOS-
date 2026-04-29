# API Overview

Base URL: /api/v1

## Health

- GET /health

## Auth

- POST /auth/login
- POST /auth/register-tenant
- GET /auth/profile
- POST /auth/users

## Tenants

- GET /tenants
- GET /tenants/pending
- PATCH /tenants/:id/approve
- PATCH /tenants/:id/reject
- GET /tenants/me/profile

## Inventory

- GET /inventory/categories
- POST /inventory/categories
- GET /inventory/products
- POST /inventory/products
- GET /inventory/suppliers
- POST /inventory/suppliers
- POST /inventory/purchases
- GET /inventory/purchases
- GET /inventory/stock-ledger

## POS

- POST /pos/orders
- POST /pos/orders/:id/checkout
- GET /pos/orders
- GET /pos/orders/:id

## Settings Requests

- POST /settings-requests
- GET /settings-requests
- PATCH /settings-requests/:id/review
