import "server-only";

import { headers } from "next/headers";
import { isLocalEditingAllowed } from "@/lib/local-edit-policy";

export const LOCAL_EDITING_ERROR = "Changes are only allowed on localhost.";

export async function canEditLocally(): Promise<boolean> {
  if (process.env.NODE_ENV !== "development") return false;
  return isLocalEditingAllowed(await headers(), process.env.NODE_ENV);
}

export async function requireLocalEditing(): Promise<void> {
  if (!(await canEditLocally())) throw new Error(LOCAL_EDITING_ERROR);
}
