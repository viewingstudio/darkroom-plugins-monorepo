import type { Config } from 'payload'
import { DeploymentHistory } from './collections/DeploymentHistory.js'
import { DeploymentMetadata } from './globals/DeploymentMetadata.js'
import { createDeployHandler } from './endpoints/deployHandler.js'

export type { DeploymentStatus } from './types.js'

export type PayloadDeployTriggerConfig = {
  /**
   * Webhook URL for triggering deployments (typically from environment variable)
   */
  deployHookUrl?: string
  /**
   * Cooldown period in seconds between deployments (default: 30)
   */
  cooldownSeconds?: number
  /**
   * Timeout in milliseconds for webhook requests (default: 10000)
   */
  timeoutMs?: number
  /**
   * Show deployment widget in dashboard (default: true)
   */
  showDashboardWidget?: boolean
  /**
   * Show deploy button in actions (default: true)
   */
  showActionButton?: boolean
  /**
   * Disable the plugin
   */
  disabled?: boolean
}

export const payloadDeployTrigger =
  (pluginOptions: PayloadDeployTriggerConfig = {}) =>
  (config: Config): Config => {
    if (pluginOptions.disabled) {
      return config
    }

    const {
      deployHookUrl,
      timeoutMs = 10000,
      showDashboardWidget = true,
      showActionButton = true,
    } = pluginOptions

    // Add collections
    const collections = config.collections || []
    collections.push(DeploymentHistory)

    // Add globals
    const globals = config.globals || []
    globals.push(DeploymentMetadata)

    // Add custom endpoint
    const endpoints = config.endpoints || []
    endpoints.push({
      path: '/deploy',
      method: 'post',
      handler: createDeployHandler(deployHookUrl, timeoutMs),
    })

    // Add admin components and dependencies
    const adminComponents = config.admin?.components || {}
    const adminDependencies = config.admin?.dependencies || {}

    if (showDashboardWidget) {
      const beforeDashboard = adminComponents.beforeDashboard || []
      beforeDashboard.push('@kurto/payload-deploy-trigger/components/DeployWidget#DeployWidget')
      adminComponents.beforeDashboard = beforeDashboard
    }

    if (showActionButton) {
      const actions = adminComponents.actions || []
      actions.push('@kurto/payload-deploy-trigger/components/DeployButton#DeployButton')
      adminComponents.actions = actions
    }

    return {
      ...config,
      collections,
      globals,
      endpoints,
      admin: {
        ...config.admin,
        components: adminComponents,
        dependencies: adminDependencies,
      },
    }
  }
