"use client";

import { useState } from "react";
import { http, HttpResponse } from "msw";
import { LeadSelect, type LeadOption } from "@/components/selects/lead-select";
import { useFixtureHandlers } from "../../../mocks/msw-worker";

const mockLeads: LeadOption[] = [
  { id: 1, description: "Ny kunde som onsker konsultasjon om React", status: "NEW" },
  { id: 2, description: "Backend-utvikling for e-handelsplattform", status: "IN_PROGRESS" },
  { id: 3, description: "Modernisering av legacy-system", status: "IN_PROGRESS" },
  { id: 4, description: "Skymigrering til AWS", status: "WON" },
  { id: 5, description: "Mobilapp-utvikling", status: "LOST" },
];

function InteractiveLeadSelect() {
  const [value, setValue] = useState<LeadOption | null>(null);

  const ready = useFixtureHandlers([
    http.get("/api/leads", () => HttpResponse.json(mockLeads)),
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
    <div className="space-y-4 w-80">
      <LeadSelect
        value={value}
        onChange={setValue}
        allowCreate
        companyId={1}
      />
      <div className="text-sm text-muted-foreground">
        Valgt: {value ? `${value.description.slice(0, 30)}... (ID: ${value.id})` : "Ingen"}
      </div>
    </div>
  );
}

function PreselectedLeadSelect() {
  const [value, setValue] = useState<LeadOption | null>(mockLeads[0]);

  const ready = useFixtureHandlers([
    http.get("/api/leads", () => HttpResponse.json(mockLeads)),
  ]);

  if (!ready) return null;

  return (
    <div className="space-y-4 w-80">
      <LeadSelect value={value} onChange={setValue} />
      <div className="text-sm text-muted-foreground">
        Valgt: {value ? value.description.slice(0, 40) : "Ingen"}
      </div>
    </div>
  );
}

function WithClearLeadSelect() {
  const [value, setValue] = useState<LeadOption | null>(mockLeads[0]);

  const ready = useFixtureHandlers([
    http.get("/api/leads", () => HttpResponse.json(mockLeads)),
  ]);

  if (!ready) return null;

  return (
    <div className="space-y-4 w-80">
      <p className="text-sm text-muted-foreground">Med tøm-knapp</p>
      <LeadSelect value={value} onChange={setValue} allowClear />
      <div className="text-sm text-muted-foreground">
        Valgt: {value ? value.description.slice(0, 40) : "Ingen"}
      </div>
    </div>
  );
}

function NoCreateLeadSelect() {
  const [value, setValue] = useState<LeadOption | null>(null);

  const ready = useFixtureHandlers([
    http.get("/api/leads", () => HttpResponse.json(mockLeads)),
  ]);

  if (!ready) return null;

  return (
    <div className="space-y-4 w-80">
      <p className="text-sm text-muted-foreground">Uten "Lag ny" (mangler companyId)</p>
      <LeadSelect value={value} onChange={setValue} allowCreate />
      <div className="text-sm text-muted-foreground">
        Valgt: {value ? value.description.slice(0, 40) : "Ingen"}
      </div>
    </div>
  );
}

function EmptyLeadSelect() {
  const [value, setValue] = useState<LeadOption | null>(null);

  const ready = useFixtureHandlers([
    http.get("/api/leads", () => HttpResponse.json([])),
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
    <div className="space-y-4 w-80">
      <p className="text-sm text-muted-foreground">Ingen eksisterende leads</p>
      <LeadSelect value={value} onChange={setValue} allowCreate companyId={1} />
    </div>
  );
}

export default {
  default: <InteractiveLeadSelect />,
  preselected: <PreselectedLeadSelect />,
  withClear: <WithClearLeadSelect />,
  noCreate: <NoCreateLeadSelect />,
  empty: <EmptyLeadSelect />,
};
