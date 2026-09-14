import "server-only";

import { isAdmin } from "@/lib/admin-access";

export const EDITING_ERROR = "Sign in as admin to make changes.";

export async function canEditContent(): Promise<boolean> {
  return isAdmin();
}

export async function requireEditing(): Promise<void> {
  if (!(await canEditContent())) throw new Error(EDITING_ERROR);
}
