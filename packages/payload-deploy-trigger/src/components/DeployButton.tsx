"use client";

import React, { useState } from "react";
import { Button, toast } from "@payloadcms/ui";

export const DeployButton: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const handleDeploy = async () => {
    setLoading(true);

    // Start loading toast
    const toastId = toast.loading("Publishing changes...");

    try {
      const response = await fetch("/api/deploy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = (await response.json()) as { success: boolean; error?: string };

      if (data.success) {
        toast.success(
          "Published! All changes have been triggered for deployment. Please allow 2-5 minutes for the build process to complete and changes to appear publicly.",
          { id: toastId, duration: 8000 },
        );
      } else {
        // Handle specific error cases
        const errorMsg = data.error || "Failed to trigger deployment";

        if (response.status === 500 && errorMsg.includes("not configured")) {
          toast.error(
            "Deploy hook not configured. Please set DEPLOY_HOOK_URL environment variable.",
            { id: toastId, duration: 8000 },
          );
        } else if (response.status === 504) {
          toast.error("Deployment request timed out. The deployment may still be processing.", {
            id: toastId,
            duration: 6000,
          });
        } else if (response.status === 503) {
          toast.error("Unable to reach deployment service. Please try again later.", {
            id: toastId,
            duration: 6000,
          });
        } else if (response.status === 401) {
          toast.error("Unauthorized. Please refresh the page and try again.", {
            id: toastId,
            duration: 6000,
          });
        } else {
          toast.error(errorMsg, { id: toastId, duration: 6000 });
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Network error";
      toast.error(`Deployment failed: ${errorMessage}`, { id: toastId, duration: 6000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleDeploy} disabled={loading} buttonStyle="secondary" size="small">
      {loading ? "Publishing..." : "Publish Changes"}
    </Button>
  );
};
