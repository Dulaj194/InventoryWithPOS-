# Super Admin Workflow

## Registration Control

1. Tenant submits registration via auth endpoint
2. Tenant status remains PENDING
3. Super admin reviews pending queue
4. Super admin APPROVE or REJECT action updates tenant status

## Approval Effects

- Tenant status -> ACTIVE
- Latest subscription activated and trial window refreshed
- Realtime notification emitted

## Rejection Effects

- Tenant status -> REJECTED
- Active or trial subscriptions cancelled
- Realtime notification emitted

## Settings Governance

- Tenant admin submits settings request
- Super admin reviews and approves/rejects
- On approval, tenant feature flags are updated immediately
