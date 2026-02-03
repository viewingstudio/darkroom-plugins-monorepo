import type { PayloadHandler } from "payload";
import type { DeploymentStatus } from "../types.js";

export const createDeployHandler = (deployHookUrl?: string, timeoutMs = 10000): PayloadHandler => {
  return async (req) => {
    const startTime = Date.now();
    let deploymentStatus: DeploymentStatus = "failed";
    let errorMessage: string | undefined;

    try {
      const { payload, user } = req;

      // Check authentication
      if (!user) {
        return Response.json(
          { success: false, error: "Unauthorized: You must be logged in to trigger deployments" },
          { status: 401 },
        );
      }

      // Get the deploy hook URL (from plugin config or environment)
      const webhookUrl = deployHookUrl || process.env.DEPLOY_HOOK_URL;

      if (!webhookUrl) {
        return Response.json(
          {
            success: false,
            error:
              "Deploy hook URL not configured. Please set DEPLOY_HOOK_URL environment variable or configure it in the plugin options.",
          },
          { status: 500 },
        );
      }

      // Trigger the deployment webhook with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const webhookResponse = await fetch(webhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!webhookResponse.ok) {
          const statusText = webhookResponse.statusText || "Unknown error";
          throw new Error(
            `Deployment webhook failed (${webhookResponse.status}): ${statusText}. Please try again or contact support.`,
          );
        }
      } catch (fetchError) {
        clearTimeout(timeoutId);

        if (fetchError instanceof Error && fetchError.name === "AbortError") {
          deploymentStatus = "timeout";
          errorMessage = "Deployment request timed out";
          throw new Error(
            "Deployment request timed out. The deployment may still be processing. Please wait a moment before trying again.",
          );
        }
        throw fetchError;
      }

      // Update the deployment metadata with current timestamp
      const now = new Date();
      const duration = Date.now() - startTime;
      deploymentStatus = "success";

      // Mask webhook URL for logging (show only domain)
      const maskedUrl = webhookUrl.replace(/^(https?:\/\/[^/]+).*/, "$1/*****");

      await payload.updateGlobal({
        slug: "deployment-metadata",
        data: {
          lastDeployedAt: now.toISOString(),
          lastDeployedBy: user.id,
        },
        user,
        overrideAccess: false,
        req,
      });

      // Log successful deployment to history
      await payload.create({
        collection: "deployment-history",
        data: {
          deployedBy: user.id,
          deployedAt: now.toISOString(),
          status: deploymentStatus,
          duration,
          webhookUrl: maskedUrl,
        },
        req,
      });

      return Response.json({
        success: true,
        timestamp: now.toISOString(),
        message: "Published! Please wait a few moments for the changes to appear on the website.",
      });
    } catch (error) {
      console.error("Deployment error:", error);

      // Determine appropriate status code and error message
      let statusCode = 500;
      let finalErrorMessage = "An unexpected error occurred while triggering deployment";

      if (error instanceof Error) {
        finalErrorMessage = error.message;
        errorMessage = error.message;

        // Network/timeout errors
        if (error.message.includes("timed out") || error.message.includes("timeout")) {
          statusCode = 504;
          deploymentStatus = "timeout";
        } else if (error.message.includes("network") || error.message.includes("fetch")) {
          statusCode = 503;
          finalErrorMessage =
            "Unable to reach deployment service. Please check your connection and try again.";
        }
      }

      // Log failed deployment to history
      try {
        const { payload, user } = req;

        if (user) {
          const duration = Date.now() - startTime;
          const webhookUrl = deployHookUrl || process.env.DEPLOY_HOOK_URL;
          const maskedUrl =
            webhookUrl ? webhookUrl.replace(/^(https?:\/\/[^/]+).*/, "$1/*****") : undefined;

          await payload.create({
            collection: "deployment-history",
            data: {
              deployedBy: user.id,
              deployedAt: new Date().toISOString(),
              status: deploymentStatus,
              duration,
              errorMessage: errorMessage || finalErrorMessage,
              webhookUrl: maskedUrl,
            },
            req,
          });
        }
      } catch (logError) {
        console.error("Failed to log deployment error:", logError);
      }

      return Response.json(
        {
          success: false,
          error: finalErrorMessage,
        },
        { status: statusCode },
      );
    }
  };
};
