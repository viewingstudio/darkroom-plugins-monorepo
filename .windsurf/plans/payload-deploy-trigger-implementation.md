# Payload Deploy Trigger Plugin Implementation

Implement a production-ready deployment trigger plugin for Payload CMS with robust error handling and security (v1: simple, focused implementation).

## Architecture Overview

### Plugin Configuration Strategy (v1 Scope)

- **Environment-only**: `DEPLOY_HOOK_URL` from environment variable (secure, never in repo)
- **Single webhook**: One deployment target per environment
- **Configurable**: Cooldown periods and timeout settings
- **No retry logic**: Manual retry only (we can't verify build success)
- **No notifications**: Keep it simple for v1

### Component Auto-Registration

Plugin automatically injects components into Payload config (no manual setup required):

- Dashboard widget (`DeployWidget`) - shows deployment status, history, and trigger button
- Action button (`DeployButton`) - quick deploy from any admin page
- Collections/Globals registered automatically

## Implementation Plan

### 1. Core Plugin Structure

**File: `src/index.ts`**

- Define simple plugin config interface:
  ```typescript
  {
    deployHookUrl?: string           // Webhook URL (from env)
    cooldownSeconds?: number         // Deploy cooldown (default: 30)
    timeoutMs?: number              // Webhook timeout (default: 10000)
    showDashboardWidget?: boolean   // Show widget (default: true)
    showActionButton?: boolean      // Show action button (default: true)
    disabled?: boolean              // Disable plugin
  }
  ```
- Auto-inject components into `config.admin.components`
- Auto-register collections (`deployment-history`) and globals (`deployment-metadata`)
- Register custom endpoint `/api/deploy` via `config.endpoints`

### 2. Missing Files to Create

**File: `src/access.ts`**

- Export `authenticatedOnly` for deployment triggers (simple user check)
- Export `developerOnly` for deployment history (check for developer role)
- Standalone implementations (no external dependencies)

**File: `src/endpoints/deployHandler.ts`**

- Implement `PayloadHandler` for `/api/deploy` endpoint
- Enhanced error handling with specific error types:
  - `UnauthorizedError` (401)
  - `ConfigurationError` (500) - missing webhook URL
  - `WebhookError` (503) - webhook failed
  - `TimeoutError` (504) - request timeout
- Transaction-safe operations (pass `req` to all nested operations)
- Atomic deployment logging (success/failure recorded in same transaction)
- Simple webhook POST with timeout (no retry logic)

**File: `src/types.ts`**

- Export all TypeScript types for plugin config
- Export deployment status types ('success' | 'failed' | 'timeout')
- Export component prop types

### 3. Enhanced Collections & Globals

**Update: `src/globals/DeploymentMetadata.ts`**

- Keep existing structure (public read, auth update)
- Add `lastDeployedBy` relationship field (optional)
- Keep simple and focused

**Update: `src/collections/DeploymentHistory.ts`**

- Fix missing `developerOnly` import from `src/access.ts`
- Keep existing fields (deployedBy, deployedAt, status, duration, errorMessage, webhookUrl)
- No additional fields needed for v1

### 4. Component Updates

**Update: `src/components/DeployWidget.tsx`**

- Fix missing type imports (use generic types to avoid payload-types dependency)
- Keep existing functionality (loading states, cooldown, history)
- Manual retry via button (user clicks again after cooldown)
- Clean up and improve error messaging

**Update: `src/components/DeployButton.tsx`**

- Fix missing type imports (use generic types)
- Keep simple - no confirmation dialog for v1
- Better error messaging

### 5. Error Handling Strategy

**Structured Error Types:**

```typescript
class DeploymentError extends Error {
  statusCode: number;
  deploymentStatus: "failed" | "timeout";
  retryable: boolean;
}
```

**Error Scenarios:**

1. **No authentication** → 401, clear message
2. **Missing webhook URL** → 500, guide to configuration
3. **Webhook timeout** → 504, log as 'timeout', suggest retry
4. **Webhook failure** → 503, log HTTP status, show error details
5. **Network error** → 503, generic network message
6. **Database error** → 500, log but don't expose details

**Logging Strategy:**

- Always log to `deployment-history` (even failures)
- Include error details in `errorMessage` field
- Never expose sensitive data (webhook URLs partially masked in logs)
- Console.error for debugging (server-side only)

### 6. Security Considerations

- **Webhook URL**: Never expose in API responses (mask in logs: `https://*****.cloudflare.com`)
- **Access Control**: Enforce `overrideAccess: false` in all Local API calls with user context
- **Rate Limiting**: Cooldown enforced client + server side
- **CSRF Protection**: Use Payload's built-in CSRF for POST endpoints
- **No Database Storage**: Webhook URL only from environment (never stored in DB)

### 7. Testing & Installation

**Install in dev environment:**

1. Build plugin: `cd packages/payload-deploy-trigger && pnpm build`
2. Verify plugin is already in `dev/src/payload.config.ts`
3. Update plugin config with options:
   ```typescript
   payloadDeployTrigger({
     deployHookUrl: process.env.DEPLOY_HOOK_URL,
     cooldownSeconds: 30,
     timeoutMs: 10000,
   });
   ```
4. Generate types: `cd dev && pnpm generate:types`
5. Test deployment flow

**Validation:**

- TypeScript compilation: `pnpm tsc --noEmit`
- Component rendering in admin UI
- Deploy endpoint authentication
- Error handling for missing webhook URL
- Deployment history logging
- Cooldown enforcement

## Extension Points for Future (v2+)

- **UI Configuration**: Admin panel for webhook URL management
- **Multiple webhooks**: Deploy to staging + production simultaneously
- **Retry logic**: Auto-retry with exponential backoff
- **Build status polling**: Check deployment status via provider API
- **Notifications**: Email/Slack notifications on deploy success/failure
- **Conditional deploys**: Only deploy if certain collections changed

## Files to Create/Modify

**Create:**

- `src/access.ts`
- `src/endpoints/deployHandler.ts`
- `src/types.ts`

**Modify:**

- `src/index.ts` - implement plugin logic (auto-register everything)
- `src/globals/DeploymentMetadata.ts` - minor updates (optional lastDeployedBy)
- `src/collections/DeploymentHistory.ts` - fix missing import
- `src/components/DeployWidget.tsx` - fix type imports
- `src/components/DeployButton.tsx` - fix type imports
- `README.md` - update documentation with usage examples

**Export Structure:**

- Main export: `payloadDeployTrigger` function
- Type exports: `PayloadDeployTriggerConfig`, `DeploymentStatus`, etc.
- No helper exports needed (self-contained plugin)

## v1 Scope Summary

✅ **Included:**

- Environment-only webhook URL configuration
- Single webhook support
- Manual retry (user clicks deploy button again)
- Basic error handling and logging
- Deployment history tracking
- Client-side cooldown (30s default)
- Dashboard widget and action button

❌ **Excluded (Future):**

- UI-based webhook configuration
- Multiple webhook providers
- Automatic retry logic
- Email/Slack notifications
- Build status verification
