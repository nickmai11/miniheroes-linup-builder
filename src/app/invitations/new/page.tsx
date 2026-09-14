import { getI18n } from "@/lib/i18n/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { canEditContent } from "@/lib/editing";
import { PageShell } from "@/components/page-shell";
import { InvitationGenerator } from "./invitation-generator";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();

  return {
    title: t("Generate invitation"),
    robots: { index: false, follow: false },
  };
}

export default async function NewInvitationPage() {
  const { t } = await getI18n();

  if (!(await canEditContent())) notFound();
  return (
    <PageShell
      title={t("Invitation codes")}
      description={t(
        "Generate a code and share it with someone you’d like to invite.",
      )}
      width="max-w-2xl"
    >
      <InvitationGenerator />
    </PageShell>
  );
}
