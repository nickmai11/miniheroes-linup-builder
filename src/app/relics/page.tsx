import { getI18n } from "@/lib/i18n/server";
import { requirePageAccess } from "@/lib/app-access";
import type { Metadata } from "next";
import { RelicGroups } from "./relic-groups";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("Relics") };
}

export default async function RelicsPage() {
  await requirePageAccess();
  return <RelicGroups />;
}
