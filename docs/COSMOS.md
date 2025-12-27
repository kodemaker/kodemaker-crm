# React Cosmos Setup

This directory contains React Cosmos fixtures and configuration for browsing and testing UI components.

## Quick Start

```bash
npm run cosmos
```

This will start the Cosmos dev server at `http://localhost:5002` where you can browse all component fixtures.

## Directory Structure

```
cosmos/
├── fixtures/            # Component fixtures
│   ├── ui/             # 1-1 with `src/components/ui/*`
│   └── components/     # App-level fixtures from `src/components/*`
├── mocks/              # Mock implementations for Next.js modules
│   ├── next.tsx        # next/navigation hooks (usePathname, useRouter)
│   ├── next-auth.tsx   # next-auth/react mocks
│   ├── next-image.tsx  # next/image mock
│   └── next-link.tsx   # next/link mock
├── decorators.tsx      # Global decorators (providers, styles)
└── README.md           # This file
```

## Adding New Fixtures

### UI Component Fixture (1-1 with `src/components/ui`)

For every component in `src/components/ui/Component.tsx` there should be a
matching fixture in `cosmos/fixtures/ui/Component.fixture.tsx`.

Example:

```tsx
// cosmos/fixtures/ui/Button.fixture.tsx
import { Button } from "@/components/ui/button";

export default {
  default: <Button>Standard</Button>,
  destructive: <Button variant="destructive">Slett</Button>,
};
```

Keep fixtures small and focused: 3–6 variants that reflect real usage in the
app is usually enough.

### App Component Fixture

Create fixtures for key app-level components in `cosmos/fixtures/components/`.
These should use realistic props and Norwegian copy.

```tsx
// cosmos/fixtures/components/PageBreadcrumbs.fixture.tsx
import { PageBreadcrumbs } from "@/components/page-breadcrumbs";

export default {
  customer: (
    <PageBreadcrumbs
      items={[
        { label: "Organisasjoner", href: "/customers" },
        { label: "Kodemaker", href: "/customers/1" },
        { label: "Detaljer" },
      ]}
    />
  ),
};
```

## Mock Modules

The project uses Next.js-specific modules that don't work in Cosmos. Mocks in
`cosmos/mocks/` make these imports safe:

- **next/image** → Regular `<img>` tag
- **next/link** → Regular `<a>` tag
- **next/navigation** → Mock hooks (`usePathname`, `useRouter`)
- **next-auth/react** → Mock session provider

These are automatically aliased via `vite.config.ts`, so components can keep
their normal imports.

## API mocking (MSW)

- Cosmos now starts Mock Service Worker automatically via `cosmos/decorators.tsx`.
- Default API responses live in `cosmos/mocks/handlers.ts` with shared mock data in
  `cosmos/mocks/state.ts`.
- For fixture-specific responses, use `useFixtureHandlers` from
  `cosmos/mocks/msw-worker`:

```tsx
import { http, HttpResponse } from "msw";
import { useFixtureHandlers } from "../mocks/msw-worker";

function LoadingFixture() {
  useFixtureHandlers([http.get("/api/followups", () => HttpResponse.json([]))]);
  return <YourComponent />;
}
```

- Handlers reset between fixtures; the shared mock state is reset whenever
  handlers reset.
- Vitest reuses the same handlers via `vitest.setup.ts` (`mswServer`) so tests and
  fixtures stay aligned.

## Global Decorators

All fixtures are wrapped with `cosmos/decorators.tsx` which:

- Imports `src/app/globals.css`
- Wraps children in the real `Providers` component from `src/components/providers`
- Uses a `max-w-6xl` layout similar to the Next.js `RootLayout`

## Exporting Static Site

To export a static version of Cosmos:

```bash
npm run cosmos:export
```

This creates a `cosmos-export/` directory with a static site you can deploy.

## Troubleshooting

### Components not rendering

- Check that all Next.js imports are properly mocked.
- Verify decorators are wrapping components correctly.
- Check browser console for errors.

### Styles not loading

- Ensure `globals.css` is imported in `decorators.tsx`.
- Verify Tailwind CSS is processing correctly in `vite.config.ts`.

### Type errors

- Make sure `tsconfig.json` includes the `cosmos/` directory.
- Check that path aliases (`@/*`) are configured correctly.

### Keeping fixtures in sync

- When you add or change a component in `src/components/ui`, add or update the
  matching fixture in `cosmos/fixtures/ui`.
- For new app-level components that are reused across pages, prefer adding a
  fixture in `cosmos/fixtures/components` so they are easy to browse in Cosmos.

