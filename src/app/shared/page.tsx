import Link from "next/link";
import { requirePageAccess } from "@/lib/app-access";
import { getSharedItems } from "@/lib/content-sharing";
import { getI18n } from "@/lib/i18n/server";
import { PageShell } from "@/components/page-shell";

export async function generateMetadata() {
  return { title: (await getI18n()).t("Shared with me") };
}
export default async function SharedPage() {
  await requirePageAccess("/shared");
  const { t, gameLabel } = await getI18n();
  const items = await getSharedItems();
  return (
    <PageShell title={t("Shared with me")} width="max-w-4xl">
      {items.length === 0 ? (
        <p className="text-muted-foreground">
          {t("No lineups or builds have been shared with you yet.")}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((item) => (
            <li key={`${item.kind}:${item.id}`}>
              <Link
                href={item.href}
                className="hover:bg-muted flex flex-col gap-1 rounded-lg border p-4"
              >
                <span className="text-muted-foreground text-xs">
                  {t(item.kind === "lineup" ? "Lineup" : "Build")}
                  {item.heroName
                    ? ` · ${gameLabel("hero", item.heroName)}`
                    : ""}
                </span>
                <span className="font-medium">{item.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  );
}
