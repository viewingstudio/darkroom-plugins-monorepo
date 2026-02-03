# Payload CMS Plugins Monorepo Setup

Transform the existing `payload-access` plugin template into a pnpm workspace monorepo with two plugins (`payload-access` for RBAC and `payload-deploy-trigger`) plus a shared dev playground, following Payload v3 plugin standards.

## Approach

Since you've already installed the Payload plugin template at `payload-access/`, we'll:

1. Move it to `packages/payload-access/`
2. Create the monorepo structure around it
3. Add `packages/payload-deploy-trigger/` as a minimal placeholder
4. Create a shared `dev/` environment that imports both plugins locally

## Monorepo Structure

```
windsurf-project/
├── pnpm-workspace.yaml
├── package.json (root)
├── tsconfig.json (base)
├── .gitignore
├── README.md
├── packages/
│   ├── payload-access/          # RBAC plugin (moved from root)
│   │   ├── src/
│   │   │   ├── index.ts         # Main plugin export
│   │   │   ├── types.ts         # Plugin config types
│   │   │   ├── helpers.ts       # isDeveloper, isAdmin, isEditor
│   │   │   ├── hooks/
│   │   │   │   └── beforeValidate.ts
│   │   │   └── access/
│   │   │       └── users.ts
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── README.md
│   └── payload-deploy-trigger/  # Deploy trigger (placeholder)
│       ├── src/
│       │   └── index.ts
│       ├── package.json
│       ├── tsconfig.json
│       └── README.md
└── dev/                          # Shared playground
    ├── app/                      # Next.js app dir
    ├── collections/
    │   └── Users.ts              # Users with role field
    ├── payload.config.ts         # Imports both plugins
    ├── package.json
    ├── tsconfig.json
    └── .env.example
```

## Key Implementation Details

### `packages/payload-access` - RBAC Plugin

**Plugin Configuration:**

```typescript
export type PayloadAccessConfig = {
  developerEmails?: string[]; // Force these emails to developer role
  disabled?: boolean;
};
```

**Core Logic:**

1. **Users Collection Modification:**
   - Add `role` field: multi-select with options `['developer', 'admin', 'editor']`
   - Default role: `'editor'`

2. **`beforeValidate` Hook:**
   - If total user count === 0 → force `role = ['developer']`
   - If email in `developerEmails` → force `role = ['developer']`

3. **Access Control (users collection):**
   - **Read:** All authenticated users can read
   - **Create:** Only developers and admins
   - **Update:**
     - Developers: can update anyone
     - Admins: can update anyone EXCEPT developers
     - Editors: can only update themselves
     - Prevent admins from adding 'developer' to any user's roles
   - **Delete:**
     - Developers: can delete anyone
     - Admins: can delete anyone EXCEPT developers
     - Editors: cannot delete anyone

4. **Exported Helpers:**

```typescript
export const isDeveloper = (user: User): boolean
export const isAdmin = (user: User): boolean
export const isEditor = (user: User): boolean
```

### `packages/payload-deploy-trigger` - Placeholder

Minimal plugin structure:

```typescript
export const payloadDeployTrigger = (config: Config): Config => {
  // TODO: Implement deploy trigger functionality
  return config;
};
```

### `dev/` - Shared Playground

**Database:** SQLite using `@payloadcms/db-sqlite`

**Payload Config:**

```typescript
import { sqliteAdapter } from "@payloadcms/db-sqlite";
import { payloadAccess } from "payload-access";
import { payloadDeployTrigger } from "payload-deploy-trigger";

export default buildConfig({
  db: sqliteAdapter({
    client: {
      url: process.env.DATABASE_URL || "file:./dev.db",
    },
  }),
  plugins: [
    payloadAccess({
      developerEmails: ["dev@example.com"],
    }),
    payloadDeployTrigger(),
  ],
  // ... rest of config
});
```

## Package.json Configurations

### Root `package.json`

```json
{
  "name": "payload-plugins-monorepo",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "pnpm --filter dev dev",
    "build": "pnpm -r --filter './packages/*' build",
    "clean": "pnpm -r clean",
    "lint": "pnpm -r lint"
  },
  "devDependencies": {
    "typescript": "^5.7.3"
  },
  "engines": {
    "node": "^18.20.2 || >=20.9.0",
    "pnpm": "^9 || ^10"
  }
}
```

### Plugin `package.json` (following template pattern)

```json
{
  "name": "payload-access",
  "version": "0.0.1",
  "type": "module",
  "exports": {
    ".": {
      "import": "./src/index.ts",
      "types": "./src/index.ts"
    }
  },
  "publishConfig": {
    "exports": {
      ".": {
        "import": "./dist/index.js",
        "types": "./dist/index.d.ts"
      }
    },
    "main": "./dist/index.js",
    "types": "./dist/index.d.ts"
  },
  "scripts": {
    "build": "pnpm copyfiles && pnpm build:types && pnpm build:swc",
    "build:swc": "swc ./src -d ./dist --config-file .swcrc --strip-leading-paths",
    "build:types": "tsc --outDir dist --rootDir ./src",
    "clean": "rimraf {dist,*.tsbuildinfo}"
  },
  "peerDependencies": {
    "payload": "^3.37.0"
  }
}
```

### Dev `package.json`

```json
{
  "name": "dev",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "next dev --turbo",
    "build": "next build",
    "generate:types": "cross-env PAYLOAD_CONFIG_PATH=./payload.config.ts payload generate:types"
  },
  "dependencies": {
    "payload-access": "workspace:*",
    "payload-deploy-trigger": "workspace:*",
    "payload": "3.37.0",
    "@payloadcms/db-sqlite": "3.37.0",
    "@payloadcms/richtext-lexical": "3.37.0",
    "@payloadcms/next": "3.37.0",
    "next": "15.4.11",
    "react": "19.2.1",
    "react-dom": "19.2.1",
    "sharp": "0.34.2"
  }
}
```

## TypeScript Configuration

Following the template's pattern with `module: "NodeNext"` and `moduleResolution: "nodenext"` for proper ESM support.

## Implementation Steps

1. **Create monorepo structure:**
   - Add `pnpm-workspace.yaml`
   - Create root `package.json`
   - Move `payload-access/` to `packages/payload-access/`

2. **Refactor `payload-access` plugin:**
   - Remove example collections/endpoints
   - Add Users collection field modification
   - Implement `beforeValidate` hook with first-user and developer-email logic
   - Implement access control functions
   - Create and export helper functions

3. **Create `payload-deploy-trigger` placeholder:**
   - Minimal plugin structure
   - Basic package.json and tsconfig

4. **Create shared `dev/` environment:**
   - Next.js + Payload setup
   - SQLite database configuration
   - Users collection with role field
   - Import both plugins locally
   - Update `.env.example` for SQLite

5. **Test RBAC implementation:**
   - Create first user (should auto-become developer)
   - Test developer email enforcement
   - Test access restrictions for each role

## Notes

- **Multi-select roles:** Using array of roles `['developer', 'admin']` is best practice for flexibility
- **SQLite for dev:** Matches your Cloudflare D1 deployment target
- **No additional roles needed:** Developer/Admin/Editor covers headless CMS use case
- **Payload v3:** Using latest stable (3.37.0) with Next.js 15 integration
