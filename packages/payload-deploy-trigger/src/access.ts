import type { Access } from "payload";

/**
 * Access control: Only authenticated users can trigger deployments
 */
export const authenticatedOnly: Access = ({ req: { user } }) => {
  return Boolean(user);
};

/**
 * Access control: Only users with developer role can view deployment history
 * Falls back to authenticated users if role field doesn't exist
 */
export const developerOnly: Access = ({ req: { user } }) => {
  if (!user) return false;

  // Check if user has role field
  if ("role" in user && user.role) {
    const roles = Array.isArray(user.role) ? user.role : [user.role];
    return roles.includes("developer");
  }

  // Fallback: allow all authenticated users if no role system
  return true;
};
