import "server-only";

import { headers } from "next/headers";
import { isLocalEditingAllowed } from "@/lib/local-edit-policy";
import { isAdmin } from "@/lib/admin-access";

export const EDITING_ERROR = "Sign in as admin to make changes.";

export async function canEditContent(): Promise<boolean> {
  if (await isAdmin()) return true;
  return isLocalEditingAllowed(await headers(), process.env.NODE_ENV);
}

export async function requireEditing(): Promise<void> {
  if (!(await canEditContent())) throw new Error(EDITING_ERROR);
}
