export default function Loading() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading page"
      className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6"
    >
      <p role="status" className="text-muted-foreground text-sm">
        Loading…
      </p>
      <div aria-hidden="true" className="space-y-6 motion-safe:animate-pulse">
        <div className="bg-muted h-8 w-48 rounded-md" />
        <div className="bg-muted h-10 w-full max-w-sm rounded-md" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="bg-muted h-44 rounded-xl" />
          ))}
        </div>
      </div>
    </main>
  );
}
