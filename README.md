# Payload CMS Plugins Monorepo

A monorepo containing Payload CMS plugins for role-based access control and deployment triggers.

## Packages

- **`payload-access`**: Role-Based Access Control (RBAC) plugin with 3-tier system (Developer, Admin, Editor)
- **`payload-deploy-trigger`**: Deployment trigger plugin (coming soon)

## Development

This monorepo uses pnpm workspaces.

### Setup

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
```

### Project Structure

```
.
├── packages/
│   ├── payload-access/       # RBAC plugin
│   └── payload-deploy-trigger/  # Deploy trigger plugin
└── dev/                      # Shared development playground
```

## Requirements

- Node.js >= 18.20.2 or >= 20.9.0
- pnpm >= 9

## License

MIT
