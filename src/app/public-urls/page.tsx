import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { canEditLocally } from "@/lib/local-editing";
import { getPublicUrls } from "@/lib/public-urls";
import { PageShell } from "@/components/page-shell";
import { PublicUrlManager } from "./public-url-manager";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Public URLs",
  robots: { index: false, follow: false },
};

export default async function PublicUrlsPage() {
  if (!(await canEditLocally())) notFound();
  const urls = await getPublicUrls();
  return (
    <PageShell
      title="Public URLs"
      description="Choose which pages anyone can open without an invitation code."
      width="max-w-3xl"
    >
      <PublicUrlManager initialPaths={urls.map(({ path }) => path)} />
    </PageShell>
  );
}
