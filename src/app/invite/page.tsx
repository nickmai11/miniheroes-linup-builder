import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { KeyRound } from "lucide-react";
import { hasAppAccess } from "@/lib/app-access";
import { canEditContent } from "@/lib/editing";
import { invitationDestination } from "@/lib/invitation-policy";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { InvitationForm } from "./invitation-form";

export const metadata: Metadata = {
  title: "Invitation required",
  robots: { index: false, follow: false },
};

export default async function InvitePage(props: PageProps<"/invite">) {
  const params = await props.searchParams;
  const destination = invitationDestination(params.next);
  if (await hasAppAccess()) redirect(destination);
  const local = await canEditContent();
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-5 px-4 py-16">
      <Card>
        <CardHeader className="gap-3">
          <div className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-xl">
            <KeyRound className="size-6" aria-hidden />
          </div>
          <CardTitle>
            <h1 className="text-2xl">You’re invited</h1>
          </CardTitle>
          <CardDescription>
            Enter your invitation code to explore Mini Heroes Library. This
            browser will remember your access.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InvitationForm
            initialCode={typeof params.ic === "string" ? params.ic : ""}
            destination={destination}
          />
        </CardContent>
      </Card>
      {local && (
        <Link
          href="/invitations/new"
          className="text-muted-foreground self-center text-sm underline underline-offset-4"
        >
          Generate an invitation code
        </Link>
      )}
    </main>
  );
}
