"use client";

import React, { useState, useEffect } from "react";
import { Button, toast, Collapsible } from "@payloadcms/ui";
import type { DeploymentHistoryDoc, DeploymentMetadataDoc } from "../types.js";

export function DeployWidget() {
  const [loading, setLoading] = useState(false);
  const [lastDeployed, setLastDeployed] = useState<string | null>(null);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [deploymentHistory, setDeploymentHistory] = useState<DeploymentHistoryDoc[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Fetch deployment metadata and history on mount
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch deployment metadata
        const metadataResponse = await fetch("/api/globals/deployment-metadata");
        if (metadataResponse.ok) {
          const data = (await metadataResponse.json()) as DeploymentMetadataDoc;
          setLastDeployed(data.lastDeployedAt || null);
        }

        // Fetch deployment history
        const historyResponse = await fetch(
          "/api/deployment-history?limit=5&sort=-deployedAt&depth=1",
        );
        if (historyResponse.ok) {
          const historyData = (await historyResponse.json()) as { docs: DeploymentHistoryDoc[] };
          setDeploymentHistory(historyData.docs || []);
        }
      } catch (err) {
        console.error("Failed to fetch deployment data:", err);
      }
    }

    fetchData();
  }, []);

  const handleDeploy = async () => {
    // Check cooldown
    if (cooldownRemaining > 0) {
      toast.error(`Please wait ${cooldownRemaining} seconds before deploying again`);
      return;
    }

    setLoading(true);
    setError(null);

    // Start loading toast
    const toastId = toast.loading("Publishing changes...");

    try {
      const response = await fetch("/api/deploy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = (await response.json()) as {
        success: boolean;
        timestamp?: string;
        error?: string;
      };

      if (data.success) {
        setLastDeployed(data.timestamp || null);
        toast.success(
          "Published! Please wait a few moments for the changes to appear on the website.",
          { id: toastId },
        );

        // Refresh deployment history
        try {
          const historyResponse = await fetch(
            "/api/deployment-history?limit=5&sort=-deployedAt&depth=1",
          );
          if (historyResponse.ok) {
            const historyData = (await historyResponse.json()) as { docs: DeploymentHistoryDoc[] };
            setDeploymentHistory(historyData.docs || []);
          }
        } catch (historyErr) {
          console.error("Failed to refresh deployment history:", historyErr);
        }

        // Set 30-second cooldown
        setCooldownRemaining(30);
        const interval = setInterval(() => {
          setCooldownRemaining((prev) => {
            if (prev <= 1) {
              clearInterval(interval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        // Handle specific error cases
        const errorMsg = data.error || "Failed to trigger deployment";
        setError(errorMsg);

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
        } else {
          toast.error(errorMsg, { id: toastId, duration: 6000 });
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Network error";
      setError(errorMessage);
      toast.error(`Deployment failed: ${errorMessage}`, { id: toastId, duration: 6000 });
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp: string | null) => {
    if (!timestamp) return "Never deployed";

    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;

    return date.toLocaleDateString();
  };

  return (
    <div
      style={{
        background: "var(--theme-elevation-50)",
        border: "1px solid var(--theme-elevation-200)",
        borderRadius: "var(--border-radius-m)",
        padding: "var(--base)",
        marginBottom: "var(--base)",
      }}
    >
      <h3
        style={{
          margin: "0 0 var(--base) 0",
          fontSize: "1.125rem",
          fontWeight: 600,
        }}
      >
        Frontend Deployment
      </h3>

      <p
        style={{
          margin: "0 0 var(--base) 0",
          fontSize: "0.875rem",
          color: "var(--theme-elevation-700)",
        }}
      >
        Last deployed: <strong>{formatTimestamp(lastDeployed)}</strong>
      </p>

      <Button
        onClick={handleDeploy}
        disabled={loading || cooldownRemaining > 0}
        buttonStyle="primary"
        size="medium"
      >
        {loading ?
          "Publishing..."
        : cooldownRemaining > 0 ?
          `Wait ${cooldownRemaining}s`
        : "Publish Changes"}
      </Button>

      {error && (
        <p
          style={{
            marginTop: "var(--base)",
            fontSize: "0.875rem",
            color: "var(--theme-error-500)",
            padding: "calc(var(--base) / 2)",
            background: "var(--theme-error-50)",
            borderRadius: "var(--border-radius-s)",
            border: "1px solid var(--theme-error-200)",
          }}
        >
          <strong>Error:</strong> {error}
        </p>
      )}

      {cooldownRemaining > 0 && (
        <p
          style={{
            marginTop: "var(--base)",
            fontSize: "0.75rem",
            color: "var(--theme-elevation-600)",
          }}
        >
          Cooldown active to prevent accidental duplicate deployments
        </p>
      )}

      {deploymentHistory.length > 0 && (
        <Collapsible
          initCollapsed={true}
          header={
            <h4
              style={{
                margin: "0",
                fontSize: "0.875rem",
                fontWeight: 600,
              }}
            >
              Recent Deployments ({deploymentHistory.length})
            </h4>
          }
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "calc(var(--base) / 2)" }}>
            {deploymentHistory.map((deployment) => (
              <div
                key={deployment.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: "0.75rem",
                  padding: "calc(var(--base) / 2)",
                  background: "var(--theme-elevation-100)",
                  borderRadius: "var(--border-radius-s)",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "calc(var(--base) / 2)" }}
                >
                  <span
                    style={{
                      display: "inline-block",
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background:
                        deployment.status === "success" ? "var(--theme-success-500)"
                        : deployment.status === "timeout" ? "var(--theme-warning-500)"
                        : "var(--theme-error-500)",
                    }}
                  />
                  <span style={{ color: "var(--theme-elevation-800)" }}>
                    {formatTimestamp(deployment.deployedAt)}
                  </span>
                  {deployment.duration && (
                    <span style={{ color: "var(--theme-elevation-600)" }}>
                      ({(deployment.duration / 1000).toFixed(1)}s)
                    </span>
                  )}
                </div>
                <span style={{ color: "var(--theme-elevation-600)" }}>
                  {(
                    typeof deployment.deployedBy === "object" &&
                    "email" in deployment.deployedBy &&
                    deployment.deployedBy.email
                  ) ?
                    deployment.deployedBy.email.split("@")[0]
                  : "Unknown"}
                </span>
              </div>
            ))}
          </div>
        </Collapsible>
      )}
    </div>
  );
}
