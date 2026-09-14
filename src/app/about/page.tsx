import { getI18n } from "@/lib/i18n/server";
import { requirePageAccess } from "@/lib/app-access";
import type { Metadata } from "next";
import { AboutContent } from "./about-content";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();

  return {
    title: t("About"),
    description: t(
      "Mini Heroes Library is a place to explore heroes, build teams, and share lineup ideas for Mini Heroes: Magic Throne. Created by ✨Cmajor✨.",
    ),
  };
}

export default async function AboutPage() {
  await requirePageAccess();
  return <AboutContent />;
}
