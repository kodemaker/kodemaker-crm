"use client";

import { http, HttpResponse } from "msw";
import { QuickLeadDialog } from "@/components/dialogs/quick-lead-dialog";
import { useFixtureHandlers } from "../../../mocks/msw-worker";

function DefaultQuickLeadDialog() {
  const ready = useFixtureHandlers([
    http.post("/api/leads", async ({ request }) => {
      const body = (await request.json()) as { description: string };
      return HttpResponse.json(
        { id: 99, description: body.description, status: "NEW" },
        { status: 201 }
      );
    }),
  ]);

  if (!ready) return null;

  return (
    <QuickLeadDialog
      open={true}
      onOpenChange={() => {}}
      onCreated={() => {}}
      companyId={1}
    />
  );
}

export default <DefaultQuickLeadDialog />;
