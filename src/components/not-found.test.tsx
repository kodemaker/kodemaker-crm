import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { NotFound } from "./not-found";

describe("NotFound", () => {
  it("renders 404 text", () => {
    render(<NotFound />);

    expect(screen.getByText("404")).toBeDefined();
    expect(screen.getByText("Siden finnes ikke")).toBeDefined();
  });

  it("renders navigation button", () => {
    render(<NotFound />);

    const link = screen.getByRole("link", { name: /Gå til forsiden/ });
    expect(link).toBeDefined();
    expect(link.getAttribute("href")).toBe("/events");
  });

  it("renders description text", () => {
    render(<NotFound />);

    expect(
      screen.getByText(/Siden du leter etter eksisterer ikke/)
    ).toBeDefined();
  });
});
