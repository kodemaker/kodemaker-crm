"use client";

import { http, HttpResponse } from "msw";
import { QuickCompanyDialog } from "@/components/dialogs/quick-company-dialog";
import { useFixtureHandlers } from "../../../mocks/msw-worker";

function DefaultQuickCompanyDialog() {
  const ready = useFixtureHandlers([
    http.post("/api/companies", async ({ request }) => {
      const body = (await request.json()) as { name: string };
      return HttpResponse.json({ id: 99, name: body.name }, { status: 201 });
    }),
  ]);

  if (!ready) return null;

  return (
    <QuickCompanyDialog
      open={true}
      onOpenChange={() => {}}
      onCreated={() => {}}
    />
  );
}

export default <DefaultQuickCompanyDialog />;
