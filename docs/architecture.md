# Architecture Overview

## Multi-Tenancy Strategy

- Shared DB / Shared Schema
- Strict tenantId isolation in all transactional tables
- Super admin users can operate cross-tenant for governance tasks

## Service Design

- API App (NestJS): source of truth for auth, inventory, and POS writes
- Redis: cache and fast operational state reads
- WebSocket: realtime tenant room updates
- FastAPI: future demand forecast and analytics endpoints

## Data Integrity Rules

- Stock is updated only through stock_ledger write events
- Purchase posting and POS checkout are transactional
- Idempotency keys prevent duplicate critical writes
- Audit logs capture sensitive actions

## Core Domain Flow

1. Tenant registers with pending status
2. Super admin approves tenant and activates trial/subscription
3. Tenant admin creates products/suppliers and posts purchases
4. Cashier creates orders and checks out payments
5. Stock ledger and product balances are updated automatically
