import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { LeadsSection } from "./leads-section";
import type { ApiLead } from "../types/api";

vi.mock("@/components/dialogs/new-lead-dialog", () => ({
  NewLeadDialog: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="new-lead-dialog">{children}</div>
  ),
}));

describe("LeadsSection", () => {
  const mockLeads: ApiLead[] = [
    { id: 1, description: "First lead", status: "NEW" },
    { id: 2, description: "Second lead", status: "IN_PROGRESS" },
    { id: 3, description: "Third lead", status: "WON" },
    { id: 4, description: "Fourth lead", status: "LOST" },
    { id: 5, description: "Fifth lead", status: "BORTFALT" },
  ];

  it("renders leads with status badges", () => {
    render(<LeadsSection leads={mockLeads} />);
    expect(screen.getByText("Leads")).toBeDefined();
    expect(screen.getByText("First lead")).toBeDefined();
    expect(screen.getByText("Ny")).toBeDefined();
    expect(screen.getByText("Under arbeid")).toBeDefined();
    expect(screen.getByText("Vunnet")).toBeDefined();
    expect(screen.getByText("Tapt")).toBeDefined();
    expect(screen.getByText("Bortfalt")).toBeDefined();
  });

  it("renders stats row with counts", () => {
    render(<LeadsSection leads={mockLeads} />);
    expect(screen.getByText(/Ny: 1/)).toBeDefined();
    expect(screen.getByText(/Under arbeid: 1/)).toBeDefined();
    expect(screen.getByText(/Vunnet: 1/)).toBeDefined();
    expect(screen.getByText(/Tapt: 1/)).toBeDefined();
    expect(screen.getByText(/Bortfalt: 1/)).toBeDefined();
  });

  it("renders empty state when no leads", () => {
    render(<LeadsSection leads={[]} />);
    expect(screen.getByText("Ingen leads enda")).toBeDefined();
    expect(screen.getByText("Er det noe du kan gjøre for å endre dette?")).toBeDefined();
  });

  it("calls emptyStateAction.onClick when action button is clicked", async () => {
    const handleClick = vi.fn();
    render(
      <LeadsSection
        leads={[]}
        emptyStateAction={{ label: "Legg til lead", onClick: handleClick }}
      />
    );
    const button = screen.getByRole("button", { name: "Legg til lead" });
    await userEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("renders header action when provided", () => {
    render(
      <LeadsSection
        leads={mockLeads}
        headerAction={<div data-testid="header-action">Action</div>}
      />
    );
    expect(screen.getByTestId("header-action")).toBeDefined();
  });
});
