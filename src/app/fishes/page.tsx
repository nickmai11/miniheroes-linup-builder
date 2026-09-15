import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { requirePageAccess } from "@/lib/app-access";
import { getAllFishes } from "@/lib/fishes";
import { getI18n } from "@/lib/i18n/server";
import { FishCatalog } from "./fish-catalog";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("Fishes") };
}

export default async function FishesPage() {
  await requirePageAccess("/fishes");
  const { t } = await getI18n();
  const fishes = await getAllFishes();

  return (
    <PageShell
      title={t("Fishes")}
      description={t("Explore fish stats and where to catch them.")}
    >
      <FishCatalog fishes={fishes} />
    </PageShell>
  );
}
