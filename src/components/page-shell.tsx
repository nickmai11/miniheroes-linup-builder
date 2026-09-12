import type { ReactNode } from "react";

/** Consistent page container with a title row. */
export function PageShell({
  title,
  description,
  actions,
  children,
  width = "max-w-6xl",
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  width?: string;
}) {
  return (
    <main
      className={`mx-auto flex w-full ${width} flex-col gap-6 px-4 py-8 sm:px-6`}
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">{title}</h1>
          {description && (
            <p className="text-muted-foreground text-sm">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      {children}
    </main>
  );
}
