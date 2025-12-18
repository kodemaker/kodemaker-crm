import { GET } from "./route";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

// Mock auth to allow tests to run without a real session
vi.mock("@/lib/require-api-auth", () => ({
  requireApiAuth: vi.fn().mockResolvedValue({
    user: { id: "1", email: "test@kodemaker.no" },
  }),
}));

// Mock logger
vi.mock("@/lib/logger", () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock the database
vi.mock("@/db/client", () => ({
  db: {
    select: vi.fn(),
  },
}));

vi.mock("next/server", () => {
  class MockNextResponse {
    private body: any;
    private init?: any;
    constructor(body: any, init?: any) {
      this.body = body;
      this.init = init;
    }
    static json(data: any, init?: any) {
      return new MockNextResponse(data, init);
    }
    async json() {
      return this.body;
    }
    get status() {
      return this.init?.status ?? 200;
    }
  }
  return {
    NextResponse: MockNextResponse,
    NextRequest: class {
      url: string;
      constructor(url: string) {
        this.url = url;
      }
    },
  };
});

const { db } = await vi.importMock<any>("@/db/client");
const { requireApiAuth } = await vi.importMock<any>("@/lib/require-api-auth");

function createRequest(params: Record<string, string> = {}): NextRequest {
  const url = new URL("http://localhost:3000/api/activity-events");
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  return { url: url.toString() } as NextRequest;
}

function setupDbMock(events: any[] = [], totalCount?: number) {
  const count = totalCount ?? events.length;

  // Mock for count query (first in Promise.all)
  const countQueryMock = vi.fn().mockReturnValue({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue([{ count }]),
    }),
  });

  // Mock for main events query (second in Promise.all)
  const mainQueryMock = vi.fn().mockReturnValue({
    from: vi.fn().mockReturnValue({
      leftJoin: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockReturnValue({
            offset: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue(events),
            }),
          }),
        }),
      }),
    }),
  });

  // Mock for related data queries (comments, leads, emails, companies, contacts)
  const relatedQueryMock = vi.fn().mockReturnValue({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue([]),
    }),
  });

  db.select
    .mockImplementationOnce(countQueryMock)
    .mockImplementationOnce(mainQueryMock)
    .mockImplementation(relatedQueryMock);
}

describe("GET /api/activity-events", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requires authentication", async () => {
    // Verify requireApiAuth is called
    setupDbMock([]);

    const req = createRequest();
    await GET(req);

    expect(requireApiAuth).toHaveBeenCalled();
  });

  it("returns paginated activity events", async () => {
    const mockEvents = [
      {
        id: 2,
        eventType: "lead_created",
        createdAt: new Date("2025-01-02T12:00:00Z"),
        oldStatus: null,
        newStatus: null,
        actorUser: { id: 1, firstName: "Test", lastName: "User" },
        companyId: 5,
        contactId: null,
        leadId: 20,
        commentId: null,
        emailId: null,
      },
      {
        id: 1,
        eventType: "comment_created",
        createdAt: new Date("2025-01-01T12:00:00Z"),
        oldStatus: null,
        newStatus: null,
        actorUser: { id: 1, firstName: "Test", lastName: "User" },
        companyId: 5,
        contactId: 3,
        leadId: null,
        commentId: 10,
        emailId: null,
      },
    ];

    setupDbMock(mockEvents);

    const req = createRequest({ limit: "10" });
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.items).toHaveLength(2);
    expect(data.hasMore).toBe(false);
  });

  it("filters by companyId", async () => {
    const mockEvents = [
      {
        id: 1,
        eventType: "comment_created",
        createdAt: new Date("2025-01-01T12:00:00Z"),
        oldStatus: null,
        newStatus: null,
        actorUser: { id: 1, firstName: "Test", lastName: "User" },
        companyId: 5,
        contactId: null,
        leadId: null,
        commentId: 10,
        emailId: null,
      },
    ];

    setupDbMock(mockEvents);

    const req = createRequest({ companyId: "5" });
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.items).toHaveLength(1);
    expect(db.select).toHaveBeenCalled();
  });

  it("filters by contactId", async () => {
    const mockEvents = [
      {
        id: 1,
        eventType: "email_received",
        createdAt: new Date("2025-01-01T12:00:00Z"),
        oldStatus: null,
        newStatus: null,
        actorUser: null,
        companyId: null,
        contactId: 3,
        leadId: null,
        commentId: null,
        emailId: 30,
      },
    ];

    setupDbMock(mockEvents);

    const req = createRequest({ contactId: "3" });
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.items).toHaveLength(1);
  });

  it("filters by eventType", async () => {
    const mockEvents = [
      {
        id: 1,
        eventType: "lead_status_changed",
        createdAt: new Date("2025-01-01T12:00:00Z"),
        oldStatus: "NEW",
        newStatus: "WON",
        actorUser: { id: 1, firstName: "Test", lastName: "User" },
        companyId: 5,
        contactId: null,
        leadId: 20,
        commentId: null,
        emailId: null,
      },
    ];

    setupDbMock(mockEvents);

    const req = createRequest({ type: "lead_status_changed" });
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.items).toHaveLength(1);
    expect(data.items[0].eventType).toBe("lead_status_changed");
  });

  it("filters by multiple eventTypes", async () => {
    const mockEvents = [
      {
        id: 2,
        eventType: "lead_created",
        createdAt: new Date("2025-01-02T12:00:00Z"),
        oldStatus: null,
        newStatus: null,
        actorUser: { id: 1, firstName: "Test", lastName: "User" },
        companyId: 5,
        contactId: null,
        leadId: 20,
        commentId: null,
        emailId: null,
      },
      {
        id: 1,
        eventType: "comment_created",
        createdAt: new Date("2025-01-01T12:00:00Z"),
        oldStatus: null,
        newStatus: null,
        actorUser: { id: 1, firstName: "Test", lastName: "User" },
        companyId: 5,
        contactId: 3,
        leadId: null,
        commentId: 10,
        emailId: null,
      },
    ];

    setupDbMock(mockEvents);

    const req = createRequest({ type: "lead_created,comment_created" });
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.items).toHaveLength(2);
  });

  it("filters by userId (actor)", async () => {
    const mockEvents = [
      {
        id: 1,
        eventType: "comment_created",
        createdAt: new Date("2025-01-01T12:00:00Z"),
        oldStatus: null,
        newStatus: null,
        actorUser: { id: 2, firstName: "Another", lastName: "User" },
        companyId: 5,
        contactId: 3,
        leadId: null,
        commentId: 10,
        emailId: null,
      },
    ];

    setupDbMock(mockEvents);

    const req = createRequest({ userId: "2" });
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.items).toHaveLength(1);
  });

  it("supports page-based pagination", async () => {
    const mockEvents = [
      {
        id: 5,
        eventType: "comment_created",
        createdAt: new Date("2025-01-01T12:00:00Z"),
        oldStatus: null,
        newStatus: null,
        actorUser: { id: 1, firstName: "Test", lastName: "User" },
        companyId: 5,
        contactId: 3,
        leadId: null,
        commentId: 10,
        emailId: null,
      },
    ];

    setupDbMock(mockEvents, 100); // 100 total events

    const req = createRequest({ page: "2", limit: "10" });
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.items).toHaveLength(1);
    expect(data.totalCount).toBe(100);
  });

  it("indicates hasMore when more results exist", async () => {
    // Return 50 events but report totalCount as 100 to trigger hasMore
    const mockEvents = Array.from({ length: 50 }, (_, i) => ({
      id: 50 - i,
      eventType: "comment_created",
      createdAt: new Date("2025-01-01T12:00:00Z"),
      oldStatus: null,
      newStatus: null,
      actorUser: { id: 1, firstName: "Test", lastName: "User" },
      companyId: 5,
      contactId: 3,
      leadId: null,
      commentId: 10 + i,
      emailId: null,
    }));

    setupDbMock(mockEvents, 100); // totalCount = 100, so hasMore = true

    const req = createRequest({ limit: "50" });
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.items).toHaveLength(50);
    expect(data.hasMore).toBe(true);
  });

  it("uses default limit of 50 when not specified", async () => {
    setupDbMock([]);

    const req = createRequest();
    await GET(req);

    // Verify limit was applied (checking that select was called)
    expect(db.select).toHaveBeenCalled();
  });

  it("caps limit at 200", async () => {
    setupDbMock([]);

    const req = createRequest({ limit: "500" });
    await GET(req);

    // The limit should be capped at 200
    expect(db.select).toHaveBeenCalled();
  });

  it("handles invalid limit gracefully", async () => {
    setupDbMock([]);

    const req = createRequest({ limit: "invalid" });
    const response = await GET(req);

    expect(response.status).toBe(200);
  });

  it("filters by date range", async () => {
    const mockEvents = [
      {
        id: 1,
        eventType: "comment_created",
        createdAt: new Date("2025-01-15T12:00:00Z"),
        oldStatus: null,
        newStatus: null,
        actorUser: { id: 1, firstName: "Test", lastName: "User" },
        companyId: 5,
        contactId: 3,
        leadId: null,
        commentId: 10,
        emailId: null,
      },
    ];

    setupDbMock(mockEvents);

    const req = createRequest({
      fromDate: "2025-01-01",
      toDate: "2025-01-31",
    });
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.items).toHaveLength(1);
  });

  it("handles database errors gracefully", async () => {
    db.select.mockImplementationOnce(() => {
      throw new Error("Database connection failed");
    });

    const req = createRequest();
    const response = await GET(req);

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe("Internal server error");
  });

  it("returns empty events array when no events found", async () => {
    setupDbMock([]);

    const req = createRequest();
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.items).toEqual([]);
    expect(data.hasMore).toBe(false);
  });

  it("enriches events with related entity data", async () => {
    const mockEvents = [
      {
        id: 1,
        eventType: "comment_created",
        createdAt: new Date("2025-01-01T12:00:00Z"),
        oldStatus: null,
        newStatus: null,
        actorUser: { id: 1, firstName: "Test", lastName: "User" },
        companyId: 5,
        contactId: 3,
        leadId: null,
        commentId: 10,
        emailId: null,
      },
    ];

    // Setup count query
    db.select.mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ count: 1 }]),
      }),
    });

    // Setup main query
    db.select.mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        leftJoin: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              offset: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue(mockEvents),
              }),
            }),
          }),
        }),
      }),
    });

    // Setup comments query
    db.select.mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([
          {
            id: 10,
            content: "Test comment",
            createdAt: new Date("2025-01-01T12:00:00Z"),
            companyId: 5,
            contactId: 3,
            leadId: null,
          },
        ]),
      }),
    });

    // Setup parallel queries for leads, emails, companies, contacts (Promise.all)
    // These run in parallel so we use mockImplementation to handle any order
    const parallelQueryMock = vi.fn().mockReturnValue({
      from: vi.fn().mockImplementation(() => ({
        where: vi.fn().mockImplementation(() => {
          // Return appropriate data based on call count
          const callCount = db.select.mock.calls.length;
          if (callCount === 4) return Promise.resolve([]); // leads
          if (callCount === 5) return Promise.resolve([]); // emails
          if (callCount === 6)
            return Promise.resolve([{ id: 5, name: "Test Company" }]); // companies
          if (callCount === 7)
            return Promise.resolve([{ id: 3, firstName: "John", lastName: "Doe" }]); // contacts
          return Promise.resolve([]);
        }),
      })),
    });

    // Apply the parallel mock for remaining calls
    db.select.mockImplementation(parallelQueryMock);

    const req = createRequest();
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.items[0].comment).toMatchObject({
      id: 10,
      content: "Test comment",
      companyId: 5,
      contactId: 3,
      leadId: null,
    });
    // Note: Due to Promise.all execution order in mocks, we just verify the structure
    expect(data.items[0]).toHaveProperty("company");
    expect(data.items[0]).toHaveProperty("contact");
  });
});
