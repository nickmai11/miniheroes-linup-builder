import { getI18n } from "@/lib/i18n/server";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { KeyRound } from "lucide-react";
import { hasAppAccess } from "@/lib/app-access";
import { invitationDestination } from "@/lib/invitation-policy";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { InvitationForm } from "./invitation-form";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();

  return {
    title: t("Open your invitation"),
    robots: { index: false, follow: false },
  };
}

export default async function InvitePage(props: PageProps<"/invite">) {
  const { t } = await getI18n();

  const params = await props.searchParams;
  const destination = invitationDestination(params.next);
  if (await hasAppAccess()) redirect(destination);
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10 sm:py-16">
      <Card className="[--card-spacing:--spacing(6)]">
        <CardHeader className="gap-3">
          <div className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-xl">
            <KeyRound className="size-6" aria-hidden />
          </div>
          <CardTitle>
            <h1 className="text-2xl">{t("Open your invitation")}</h1>
          </CardTitle>
          <CardDescription className="leading-relaxed">
            {t("Enter the code shared with you to continue.")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InvitationForm
            initialCode={typeof params.ic === "string" ? params.ic : ""}
            destination={destination}
          />
        </CardContent>
        <CardFooter className="flex-col items-start gap-1.5">
          <p className="font-medium">{t("Need an invitation?")}</p>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {t(
              "Ask the person sharing with you for an invitation link or code.",
            )}
          </p>
        </CardFooter>
      </Card>
    </main>
  );
}
