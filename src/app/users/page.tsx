import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminId } from "@/lib/admin-access";
import { getManagedUsers } from "@/lib/user-management";
import { getI18n } from "@/lib/i18n/server";
import { PageShell } from "@/components/page-shell";
import { UserManager } from "./user-manager";

export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("Users"), robots: { index: false, follow: false } };
}

export default async function UsersPage() {
  if (!(await getAdminId())) notFound();
  const { t } = await getI18n();
  const users = await getManagedUsers();
  return (
    <PageShell
      title={t("Users")}
      description={t("Manage nicknames and access for registered users.")}
      actions={
        <Link
          href="/invitations/new"
          className="text-primary text-sm font-medium underline underline-offset-4"
        >
          {t("Invite a user")}
        </Link>
      }
    >
      <UserManager initialUsers={users} />
    </PageShell>
  );
}
