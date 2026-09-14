import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { KeyRound } from "lucide-react";
import { hasAppAccess } from "@/lib/app-access";
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
  title: "Invitation access",
  robots: { index: false, follow: false },
};

export default async function InvitePage(props: PageProps<"/invite">) {
  const params = await props.searchParams;
  const destination = invitationDestination(params.next);
  if (await hasAppAccess()) redirect(destination);
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-5 px-4 py-16">
      <Card>
        <CardHeader className="gap-3">
          <div className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-xl">
            <KeyRound className="size-6" aria-hidden />
          </div>
          <CardTitle>
            <h1 className="text-2xl">Access the full library</h1>
          </CardTitle>
          <CardDescription>
            Enter an invitation code to view pages that aren’t public. This
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
    </main>
  );
}
