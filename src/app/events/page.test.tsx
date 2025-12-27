import { act, render, screen, waitFor } from "@testing-library/react";
import { EventsClient } from "./events-client";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ApiActivityEvent, PaginatedResponse } from "@/types/api";
import { SessionProvider } from "next-auth/react";

let mockPaginatedData: PaginatedResponse<ApiActivityEvent> | undefined = undefined;
let mockIsLoading = true;

// Mock regular useSWR for pagination (we no longer use useSWRInfinite)
vi.mock("swr", () => ({
  default: (url: string | null) => {
    if (url === "/api/companies") {
      return { data: [], isLoading: false };
    }
    if (url === "/api/contacts") {
      return { data: [], isLoading: false };
    }
    if (url === "/api/users") {
      return { data: [], isLoading: false };
    }
    // For activity-events pagination
    if (url && url.includes("/api/activity-events")) {
      return {
        data: mockPaginatedData,
        isLoading: mockIsLoading,
        isValidating: false,
        error: undefined,
        mutate: vi.fn(),
      };
    }
    return { data: undefined, isLoading: false };
  },
  useSWRConfig: () => ({ mutate: vi.fn() }),
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe("EventsPage SSE highlight", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockPaginatedData = undefined;
    mockIsLoading = true;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not highlight initial items, highlights SSE items then removes after 10s", async () => {
    const initialEvents: ApiActivityEvent[] = [
      {
        id: 2,
        eventType: "comment_created",
        createdAt: new Date().toISOString(),
        actorUser: { id: 1, firstName: "Test", lastName: "User" },
        oldStatus: null,
        newStatus: null,
        comment: {
          id: 1,
          content: "Init two comment",
          createdAt: new Date().toISOString(),
          companyId: 1,
          contactId: 1,
          leadId: null,
        },
        lead: null,
        email: null,
        company: { id: 1, name: "Test Company" },
        contact: { id: 1, firstName: "John", lastName: "Doe" },
      },
      {
        id: 1,
        eventType: "comment_created",
        createdAt: new Date().toISOString(),
        actorUser: { id: 1, firstName: "Test", lastName: "User" },
        oldStatus: null,
        newStatus: null,
        comment: {
          id: 2,
          content: "Init one comment",
          createdAt: new Date().toISOString(),
          companyId: 1,
          contactId: 1,
          leadId: null,
        },
        lead: null,
        email: null,
        company: { id: 1, name: "Test Company" },
        contact: { id: 1, firstName: "John", lastName: "Doe" },
      },
    ];

    // Set up paginated response format (single page response)
    mockPaginatedData = {
      items: initialEvents,
      hasMore: false,
      totalCount: initialEvents.length,
    };
    mockIsLoading = false;

    const esInstances: any[] = [];
    const OriginalES = (global as any).EventSource;
    (global as any).EventSource = class {
      url: string;
      onmessage?: (ev: any) => void;
      onerror?: (ev: any) => void;
      constructor(url: string) {
        this.url = url;
        esInstances.push(this);
      }
      close() {}
    };

    try {
      render(
        <SessionProvider session={null}>
          <EventsClient />
        </SessionProvider>
      );

      // Initial items should render and not be highlighted
      expect(screen.getByText("Init two comment")).toBeDefined();
      const initItem = screen.getByText("Init two comment").closest("[class*='border-b']");
      expect(initItem?.className).not.toContain("bg-green-50");

      // Simulate SSE push of a newer event
      const newEvent: ApiActivityEvent = {
        id: 3,
        eventType: "comment_created",
        createdAt: new Date().toISOString(),
        actorUser: { id: 1, firstName: "Test", lastName: "User" },
        oldStatus: null,
        newStatus: null,
        comment: {
          id: 3,
          content: "Live event comment",
          createdAt: new Date().toISOString(),
          companyId: 1,
          contactId: 1,
          leadId: null,
        },
        lead: null,
        email: null,
        company: { id: 1, name: "Test Company" },
        contact: { id: 1, firstName: "John", lastName: "Doe" },
      };

      // Trigger message
      expect(esInstances.length).toBeGreaterThan(0);
      await act(async () => {
        esInstances[0].onmessage?.({ data: JSON.stringify(newEvent) });
      });

      const liveText = await screen.findByText("Live event comment");
      const liveRow = liveText.closest("[class*='border-b']");
      expect(liveRow?.className).toContain("bg-green-50");

      // After 10s highlight is removed
      await act(async () => {
        vi.advanceTimersByTime(10000);
      });
      await waitFor(() => {
        const updated = screen.getByText("Live event comment").closest("[class*='border-b']");
        expect(updated?.className).not.toContain("bg-green-50");
      });
    } finally {
      (global as any).EventSource = OriginalES;
    }
  });
});
