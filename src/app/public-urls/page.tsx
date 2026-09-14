import { getI18n } from "@/lib/i18n/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { canEditContent } from "@/lib/editing";
import { getPublicUrls } from "@/lib/public-urls";
import { PageShell } from "@/components/page-shell";
import { PublicUrlManager } from "./public-url-manager";

export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();

  return {
    title: t("Public URLs"),
    robots: { index: false, follow: false },
  };
}

export default async function PublicUrlsPage() {
  const { t } = await getI18n();

  if (!(await canEditContent())) notFound();
  const urls = await getPublicUrls();
  return (
    <PageShell
      title={t("Public URLs")}
      description={t(
        "Choose which pages anyone can open without an invitation code.",
      )}
      width="max-w-3xl"
    >
      <PublicUrlManager initialPaths={urls.map(({ path }) => path)} />
    </PageShell>
  );
}
