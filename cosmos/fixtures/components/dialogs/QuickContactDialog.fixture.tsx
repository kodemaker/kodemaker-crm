"use client";

import { http, HttpResponse } from "msw";
import { QuickContactDialog } from "@/components/dialogs/quick-contact-dialog";
import { useFixtureHandlers } from "../../../mocks/msw-worker";

function DefaultQuickContactDialog() {
  const ready = useFixtureHandlers([
    http.post("/api/contacts", async ({ request }) => {
      const body = (await request.json()) as { firstName: string; lastName: string };
      return HttpResponse.json(
        { id: 99, firstName: body.firstName, lastName: body.lastName },
        { status: 201 }
      );
    }),
  ]);

  if (!ready) return null;

  return (
    <QuickContactDialog
      open={true}
      onOpenChange={() => {}}
      onCreated={() => {}}
    />
  );
}

export default <DefaultQuickContactDialog />;
