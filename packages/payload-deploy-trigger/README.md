# payload-deploy-trigger

A Payload CMS plugin for triggering deployments via webhooks (Cloudflare, Vercel, Netlify, etc.).

## Features

- **One-Click Deployments**: Trigger deployments directly from the Payload Admin UI
- **Dashboard Widget**: Shows deployment status, history, and quick deploy button
- **Action Button**: Deploy from anywhere in the admin panel
- **Deployment History**: Audit log of all deployments with status tracking
- **Cooldown Protection**: Prevents accidental duplicate deployments (30s default)
- **Error Handling**: Comprehensive error tracking and logging
- **Security**: Environment-based webhook URL configuration

## Installation

```bash
pnpm add payload-deploy-trigger
```

## Usage

### Basic Setup

Add the plugin to your Payload config:

```typescript
import { payloadDeployTrigger } from "payload-deploy-trigger";
import { buildConfig } from "payload";

export default buildConfig({
  // ... your config
  plugins: [
    payloadDeployTrigger({
      deployHookUrl: process.env.DEPLOY_HOOK_URL,
    }),
  ],
});
```

### Environment Variables

Set your deployment webhook URL in your environment:

```bash
DEPLOY_HOOK_URL=https://api.cloudflare.com/client/v4/pages/webhooks/deploy_hooks/your-hook-id
```

**Important**: Never commit webhook URLs to your repository. Always use environment variables.

### Configuration Options

```typescript
payloadDeployTrigger({
  // Webhook URL (defaults to process.env.DEPLOY_HOOK_URL)
  deployHookUrl: process.env.DEPLOY_HOOK_URL,

  // Timeout for webhook requests in milliseconds (default: 10000)
  timeoutMs: 10000,

  // Show deployment widget in dashboard (default: true)
  showDashboardWidget: true,

  // Show deploy button in actions (default: true)
  showActionButton: true,

  // Disable the plugin (default: false)
  disabled: false,
});
```

## Features in Detail

### Dashboard Widget

The plugin automatically adds a deployment widget to your dashboard that shows:

- Last deployment timestamp
- Quick deploy button
- Deployment history (last 5 deployments)
- Cooldown timer

### Action Button

A "Publish Changes" button is added to the admin actions menu, allowing you to trigger deployments from any page.

### Deployment History

All deployments are logged in the `deployment-history` collection with:

- User who triggered the deployment
- Timestamp
- Status (success, failed, timeout)
- Duration
- Error messages (if failed)

**Access**: Only users with the `developer` role can view deployment history.

### Deployment Metadata

The `deployment-metadata` global tracks:

- Last successful deployment timestamp
- User who triggered the last deployment

**Access**: Public read access (can be displayed on frontend), authenticated users can trigger deployments.

## Webhook Providers

This plugin works with any webhook-based deployment service:

### Cloudflare Pages

```bash
DEPLOY_HOOK_URL=https://api.cloudflare.com/client/v4/pages/webhooks/deploy_hooks/YOUR_HOOK_ID
```

### Vercel

```bash
DEPLOY_HOOK_URL=https://api.vercel.com/v1/integrations/deploy/YOUR_HOOK_ID
```

### Netlify

```bash
DEPLOY_HOOK_URL=https://api.netlify.com/build_hooks/YOUR_HOOK_ID
```

## Security

- **Environment-only configuration**: Webhook URLs are never stored in the database
- **Authentication required**: Only logged-in users can trigger deployments
- **Access control**: Deployment history is restricted to developers
- **Rate limiting**: Client-side cooldown prevents accidental duplicate deployments
- **Masked logging**: Webhook URLs are partially masked in deployment history

## Error Handling

The plugin provides comprehensive error handling with user-friendly messages:

### Missing Deploy Hook

If `DEPLOY_HOOK_URL` is not configured, users will see:

- **Error message**: "Deploy hook not configured. Please set DEPLOY_HOOK_URL environment variable."
- **Status code**: 500
- **Action**: Set the environment variable and restart your server

### Error Scenarios

- **401 Unauthorized**: User not authenticated (should not occur in admin panel)
- **500 Configuration Error**: Missing webhook URL - prompts to set `DEPLOY_HOOK_URL`
- **503 Service Unavailable**: Deployment service unreachable - suggests trying again later
- **504 Gateway Timeout**: Request exceeded timeout (default 10s) - deployment may still be processing
- **Network Errors**: Connection issues - displays specific error message

### Error Display

- **Toast notifications**: All errors show as toast messages with appropriate duration (6-8 seconds)
- **Error state**: DeployWidget displays persistent error message below the button
- **Deployment history**: Failed deployments are logged with error details for debugging

### Error Recovery

- Errors clear automatically on next successful deployment
- Users can retry immediately after cooldown period expires
- Network errors suggest checking connection and retrying

## Development

This plugin is part of a monorepo. To develop locally:

```bash
# Install dependencies
pnpm install

# Build the plugin
cd packages/payload-deploy-trigger
pnpm build

# Start dev server
cd ../../dev
pnpm dev
```

## TypeScript

The plugin exports TypeScript types:

```typescript
import type { PayloadDeployTriggerConfig, DeploymentStatus } from "payload-deploy-trigger";
```

## Roadmap (Future Versions)

- UI-based webhook configuration
- Multiple webhook support (deploy to multiple environments)
- Automatic retry logic
- Build status verification
- Email/Slack notifications
- Conditional deployments

## License

MIT
