import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { ContactCompaniesSection } from "./contact-companies-section";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe("ContactCompaniesSection", () => {
  it("renders previous companies", () => {
    const previousCompanies = [
      {
        id: 2,
        name: "Old Corp",
        startDate: "2020-01-01",
        endDate: "2023-12-31",
      },
      {
        id: 3,
        name: "Very Old Corp",
        startDate: "2018-01-01",
        endDate: "2019-12-31",
      },
    ];

    render(<ContactCompaniesSection previousCompanies={previousCompanies} />);

    expect(screen.getByText("Tidligere organisasjoner")).toBeDefined();
    expect(screen.getByText("Old Corp")).toBeDefined();
    expect(screen.getByText("Very Old Corp")).toBeDefined();
    expect(screen.getByText(/1\.1\.2020 - 31\.12\.2023/)).toBeDefined();
  });

  it("renders nothing when no previous companies", () => {
    const { container } = render(<ContactCompaniesSection previousCompanies={[]} />);

    expect(container.firstChild).toBeNull();
  });
});
