export type DeploymentStatus = "success" | "failed" | "timeout";

export type PayloadDeployTriggerConfig = {
  /**
   * Webhook URL for triggering deployments (typically from environment variable)
   */
  deployHookUrl?: string;
  /**
   * Cooldown period in seconds between deployments (default: 30)
   */
  cooldownSeconds?: number;
  /**
   * Timeout in milliseconds for webhook requests (default: 10000)
   */
  timeoutMs?: number;
  /**
   * Show deployment widget in dashboard (default: true)
   */
  showDashboardWidget?: boolean;
  /**
   * Show deploy button in actions (default: true)
   */
  showActionButton?: boolean;
  /**
   * Disable the plugin
   */
  disabled?: boolean;
};

/**
 * Generic types for components to avoid payload-types dependency
 */
export type DeploymentHistoryDoc = {
  id: string;
  deployedBy: string | { id: string; email?: string };
  deployedAt: string;
  status: DeploymentStatus;
  duration?: number;
  errorMessage?: string;
  webhookUrl?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type DeploymentMetadataDoc = {
  id: string;
  lastDeployedAt?: string;
  lastDeployedBy?: string | { id: string; email?: string };
  updatedAt?: string;
};
