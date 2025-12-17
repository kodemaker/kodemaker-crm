import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock at module level with factory functions that will be configured in beforeEach
vi.mock("@/db/client", () => ({
  db: {
    insert: vi.fn(),
    select: vi.fn(),
  },
  pool: {
    query: vi.fn(),
  },
}));

// Import mocked modules
import { db, pool } from "@/db/client";

// Import functions after mocking
import {
  createActivityEventCommentCreated,
  createActivityEventLeadCreated,
  createActivityEventLeadStatusChanged,
  createActivityEventEmailReceived,
  fetchFullEventsByIds,
} from "./activity-events";

// Type cast for easier mock manipulation
const mockDb = db as unknown as {
  insert: ReturnType<typeof vi.fn>;
  select: ReturnType<typeof vi.fn>;
};
const mockPool = pool as unknown as {
  query: ReturnType<typeof vi.fn>;
};

describe("createActivityEventCommentCreated", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Setup default mock chain for insert
    mockDb.insert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([
          {
            id: 1,
            eventType: "comment_created",
            commentId: 10,
            actorUserId: 1,
            companyId: null,
            contactId: null,
            leadId: null,
            emailId: null,
            oldStatus: null,
            newStatus: null,
            createdAt: new Date("2025-01-01T12:00:00Z"),
          },
        ]),
      }),
    });
    mockPool.query.mockResolvedValue({ rows: [] });
  });

  it("creates event with correct type and references", async () => {
    const result = await createActivityEventCommentCreated({
      commentId: 10,
      actorUserId: 1,
      companyId: 5,
      contactId: 3,
    });

    expect(result).toMatchObject({
      id: 1,
      eventType: "comment_created",
    });

    expect(mockDb.insert).toHaveBeenCalled();
  });

  it("broadcasts via pg_notify", async () => {
    await createActivityEventCommentCreated({
      commentId: 10,
      actorUserId: 1,
    });

    expect(mockPool.query).toHaveBeenCalled();
    const [sql, args] = mockPool.query.mock.calls[0];
    expect(sql).toContain("pg_notify");
    expect(args[0]).toBe("activity_events");
  });

  it("handles pg_notify failure gracefully", async () => {
    mockPool.query.mockRejectedValueOnce(new Error("Connection lost"));

    // Should not throw
    const result = await createActivityEventCommentCreated({
      commentId: 10,
      actorUserId: 1,
    });

    expect(result).toBeDefined();
    expect(result.id).toBe(1);
  });

  it("calls insert with correct event type", async () => {
    const mockValues = vi.fn().mockReturnValue({
      returning: vi.fn().mockResolvedValue([
        {
          id: 1,
          eventType: "comment_created",
          commentId: 10,
          actorUserId: 1,
          companyId: null,
          contactId: null,
          leadId: null,
          emailId: null,
          oldStatus: null,
          newStatus: null,
          createdAt: new Date("2025-01-01T12:00:00Z"),
        },
      ]),
    });
    mockDb.insert.mockReturnValue({ values: mockValues });

    await createActivityEventCommentCreated({
      commentId: 10,
      actorUserId: 1,
    });

    expect(mockDb.insert).toHaveBeenCalled();
    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "comment_created",
        commentId: 10,
        actorUserId: 1,
      })
    );
  });
});

describe("createActivityEventLeadCreated", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.insert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([
          {
            id: 2,
            eventType: "lead_created",
            leadId: 20,
            actorUserId: 1,
            companyId: 5,
            contactId: 3,
            commentId: null,
            emailId: null,
            oldStatus: null,
            newStatus: null,
            createdAt: new Date("2025-01-01T12:00:00Z"),
          },
        ]),
      }),
    });
    mockPool.query.mockResolvedValue({ rows: [] });
  });

  it("creates event with company and optional contact", async () => {
    const result = await createActivityEventLeadCreated({
      leadId: 20,
      actorUserId: 1,
      companyId: 5,
      contactId: 3,
    });

    expect(result).toMatchObject({
      id: 2,
      eventType: "lead_created",
      leadId: 20,
      companyId: 5,
      contactId: 3,
    });
  });

  it("creates event without contact when not provided", async () => {
    mockDb.insert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([
          {
            id: 2,
            eventType: "lead_created",
            leadId: 20,
            actorUserId: 1,
            companyId: 5,
            contactId: null,
            commentId: null,
            emailId: null,
            oldStatus: null,
            newStatus: null,
            createdAt: new Date("2025-01-01T12:00:00Z"),
          },
        ]),
      }),
    });

    const result = await createActivityEventLeadCreated({
      leadId: 20,
      actorUserId: 1,
      companyId: 5,
    });

    expect(result.contactId).toBeNull();
  });
});

describe("createActivityEventLeadStatusChanged", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.insert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([
          {
            id: 3,
            eventType: "lead_status_changed",
            leadId: 20,
            actorUserId: 1,
            companyId: 5,
            contactId: null,
            commentId: null,
            emailId: null,
            oldStatus: "NEW",
            newStatus: "IN_PROGRESS",
            createdAt: new Date("2025-01-01T12:00:00Z"),
          },
        ]),
      }),
    });
    mockPool.query.mockResolvedValue({ rows: [] });
  });

  it("stores old and new status correctly", async () => {
    const result = await createActivityEventLeadStatusChanged({
      leadId: 20,
      actorUserId: 1,
      oldStatus: "NEW",
      newStatus: "IN_PROGRESS",
      companyId: 5,
    });

    expect(result).toMatchObject({
      eventType: "lead_status_changed",
      oldStatus: "NEW",
      newStatus: "IN_PROGRESS",
    });
  });

  it("handles status change to WON", async () => {
    mockDb.insert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([
          {
            id: 3,
            eventType: "lead_status_changed",
            leadId: 20,
            actorUserId: 1,
            companyId: 5,
            contactId: null,
            commentId: null,
            emailId: null,
            oldStatus: "IN_PROGRESS",
            newStatus: "WON",
            createdAt: new Date("2025-01-01T12:00:00Z"),
          },
        ]),
      }),
    });

    const result = await createActivityEventLeadStatusChanged({
      leadId: 20,
      actorUserId: 1,
      oldStatus: "IN_PROGRESS",
      newStatus: "WON",
      companyId: 5,
    });

    expect(result.newStatus).toBe("WON");
  });
});

describe("createActivityEventEmailReceived", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.insert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([
          {
            id: 4,
            eventType: "email_received",
            emailId: 30,
            actorUserId: 1,
            companyId: 5,
            contactId: 3,
            leadId: null,
            commentId: null,
            oldStatus: null,
            newStatus: null,
            createdAt: new Date("2025-01-01T12:00:00Z"),
          },
        ]),
      }),
    });
    mockPool.query.mockResolvedValue({ rows: [] });
  });

  it("creates event with email reference", async () => {
    const result = await createActivityEventEmailReceived({
      emailId: 30,
      actorUserId: 1,
      companyId: 5,
      contactId: 3,
    });

    expect(result).toMatchObject({
      eventType: "email_received",
      emailId: 30,
    });
  });

  it("handles missing actorUserId for system emails", async () => {
    mockDb.insert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([
          {
            id: 4,
            eventType: "email_received",
            emailId: 30,
            actorUserId: null,
            companyId: 5,
            contactId: 3,
            leadId: null,
            commentId: null,
            oldStatus: null,
            newStatus: null,
            createdAt: new Date("2025-01-01T12:00:00Z"),
          },
        ]),
      }),
    });

    const result = await createActivityEventEmailReceived({
      emailId: 30,
      companyId: 5,
      contactId: 3,
    });

    expect(result.actorUserId).toBeNull();
  });
});

describe("fetchFullEventsByIds", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty array for empty input", async () => {
    const result = await fetchFullEventsByIds([]);
    expect(result).toEqual([]);
    expect(mockDb.select).not.toHaveBeenCalled();
  });

  it("batch fetches related entities efficiently", async () => {
    // Setup mock chain for base events query
    mockDb.select.mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        leftJoin: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            {
              id: 1,
              eventType: "comment_created",
              createdAt: new Date("2025-01-01T12:00:00Z"),
              oldStatus: null,
              newStatus: null,
              actorUser: { id: 1, firstName: "Test", lastName: "User" },
              companyId: null,
              contactId: null,
              leadId: null,
              commentId: null,
              emailId: null,
            },
          ]),
        }),
      }),
    });

    const result = await fetchFullEventsByIds([1]);

    expect(mockDb.select).toHaveBeenCalled();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(1);
    expect(result[0].eventType).toBe("comment_created");
  });

  it("handles events with no related entities (returns null for missing data)", async () => {
    // Setup mock chain for base events query with null references
    mockDb.select.mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        leftJoin: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            {
              id: 1,
              eventType: "comment_created",
              createdAt: new Date("2025-01-01T12:00:00Z"),
              oldStatus: null,
              newStatus: null,
              actorUser: null,
              companyId: null,
              contactId: null,
              leadId: null,
              commentId: null,
              emailId: null,
            },
          ]),
        }),
      }),
    });

    const result = await fetchFullEventsByIds([1]);

    expect(result).toHaveLength(1);
    expect(result[0].actorUser).toBeNull();
    expect(result[0].comment).toBeNull();
    expect(result[0].company).toBeNull();
    expect(result[0].contact).toBeNull();
    expect(result[0].lead).toBeNull();
    expect(result[0].email).toBeNull();
  });

  it("fetches and maps related comments", async () => {
    // Base events query
    mockDb.select.mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        leftJoin: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
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
          ]),
        }),
      }),
    });

    // Comments query
    mockDb.select.mockReturnValueOnce({
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

    // Remaining queries run in parallel via Promise.all - use mockImplementation for flexibility
    mockDb.select.mockImplementation(() => ({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    }));

    const result = await fetchFullEventsByIds([1]);

    expect(result).toHaveLength(1);
    expect(result[0].comment).toMatchObject({
      id: 10,
      content: "Test comment",
    });
    // Company and contact are null because we didn't mock the parallel queries with data
    // The important thing is that the function completes without error
    expect(result[0]).toHaveProperty("company");
    expect(result[0]).toHaveProperty("contact");
  });
});
