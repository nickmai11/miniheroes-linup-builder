import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { canEditContent } from "@/lib/editing";
import { PageShell } from "@/components/page-shell";
import { InvitationGenerator } from "./invitation-generator";

export const metadata: Metadata = {
  title: "Generate invitation",
  robots: { index: false, follow: false },
};

export default async function NewInvitationPage() {
  if (!(await canEditContent())) notFound();
  return (
    <PageShell
      title="Invitation codes"
      description="Generate a code and share it with someone you’d like to invite."
      width="max-w-2xl"
    >
      <InvitationGenerator />
    </PageShell>
  );
}
