# Page loading boundaries

Keep each page and its `loading.tsx` together in a leaf route segment. When a
page also has child URLs, put the parent page and its fallback in a route group:
`(home)`, `(list)`, or `(details)`. Route groups do not change public URLs, and
all pages continue to share the root layout.

Next.js wraps both a segment's page and its descendants with that segment's
loading boundary. Automatic prefetching stops at the first loading boundary.
A home or list skeleton above a detail route can therefore appear before the
detail skeleton, making navigation look like it loads twice. Do not add a
catch-all `src/app/loading.tsx` or put list loading files above detail routes.

The About fallback intentionally renders its static content while access is
checked. Other pages use their own skeleton. Button pending states and the
build-import dialog's loading state belong to those interactions and do not
add page loading boundaries.

`tests/loading-routes.test.mjs` checks every page for exactly one loading
boundary and verifies that route organization preserves the public URLs.
