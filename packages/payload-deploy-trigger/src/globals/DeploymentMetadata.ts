import type { GlobalConfig } from "payload";

export const DeploymentMetadata: GlobalConfig = {
  slug: "deployment-metadata",
  label: "Deployment Metadata",
  admin: {
    group: "System",
    hidden: true, // Hidden from main nav, accessed programmatically
  },
  access: {
    read: () => true, // Public read - can be displayed on frontend
    update: ({ req }) => !!req.user, // Only authenticated users can trigger deployments
  },
  fields: [
    {
      name: "lastDeployedAt",
      type: "date",
      label: "Last Deployed At",
      admin: {
        description: "Timestamp of the last successful frontend deployment",
        readOnly: true,
      },
    },
    {
      name: "lastDeployedBy",
      type: "relationship",
      relationTo: "users",
      label: "Last Deployed By",
      admin: {
        description: "User who triggered the last deployment",
        readOnly: true,
      },
    },
  ],
};
