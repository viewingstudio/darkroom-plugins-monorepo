import type { CollectionConfig } from "payload";
import { developerOnly } from "../access.js";

export const DeploymentHistory: CollectionConfig = {
  slug: "deployment-history",
  admin: {
    useAsTitle: "deployedAt",
    defaultColumns: ["deployedAt", "deployedBy", "status", "duration"],
    group: "System",
  },
  access: {
    // Only developers can read deployment history
    read: developerOnly,
    // Only the system (via API) can create deployment records
    create: () => true,
    // No one can update or delete deployment history (immutable audit log)
    update: () => false,
    delete: () => false,
  },
  fields: [
    {
      name: "deployedBy",
      type: "relationship",
      relationTo: "users",
      required: true,
      admin: {
        description: "User who triggered the deployment",
      },
    },
    {
      name: "deployedAt",
      type: "date",
      required: true,
      admin: {
        date: {
          pickerAppearance: "dayAndTime",
        },
      },
    },
    {
      name: "status",
      type: "select",
      required: true,
      options: [
        { label: "Success", value: "success" },
        { label: "Failed", value: "failed" },
        { label: "Timeout", value: "timeout" },
      ],
      admin: {
        description: "Deployment outcome",
      },
    },
    {
      name: "duration",
      type: "number",
      admin: {
        description: "Deployment duration in milliseconds",
      },
    },
    {
      name: "errorMessage",
      type: "textarea",
      admin: {
        description: "Error details if deployment failed",
        condition: (data) => data.status === "failed" || data.status === "timeout",
      },
    },
    {
      name: "webhookUrl",
      type: "text",
      admin: {
        description: "Deployment webhook URL used",
        readOnly: true,
      },
    },
  ],
  timestamps: true,
};
