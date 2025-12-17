import { POST } from "./route";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock auth to allow tests to run without a real session
vi.mock("@/lib/require-api-auth", () => ({
  requireApiAuth: vi.fn().mockResolvedValue({
    user: { id: "1", email: "test@kodemaker.no" },
  }),
}));

// Mock the database and dependencies
vi.mock("@/db/client", () => ({
  db: {
    select: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    transaction: vi.fn(),
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
  return { NextResponse: MockNextResponse };
});

const { db } = await vi.importMock<any>("@/db/client");

describe("/api/contacts/[id]/merge", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should validate merge request schema", async () => {
    const params = Promise.resolve({ id: "1" });
    const req = {
      json: vi.fn().mockResolvedValue({
        targetContactId: "invalid", // Should be number
      }),
    };

    const response = await POST(req as any, { params });
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toBeDefined();
  });

  it("should return 404 if source contact not found", async () => {
    db.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]), // No contact found
        }),
      }),
    });

    const params = Promise.resolve({ id: "999" });
    const req = {
      json: vi.fn().mockResolvedValue({
        targetContactId: 2,
        mergeEmailAddresses: true,
        deleteSourceContact: false,
      }),
    };

    const response = await POST(req as any, { params });
    expect(response.status).toBe(404);

    const data = await response.json();
    expect(data.error).toBe("Source contact not found");
  });

  it("should prevent merging contact with itself", async () => {
    // Mock contacts exist
    db.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi
            .fn()
            .mockResolvedValueOnce([
              {
                id: 1,
                firstName: "John",
                lastName: "Doe",
              },
            ])
            .mockResolvedValueOnce([
              {
                id: 1,
                firstName: "John",
                lastName: "Doe",
              },
            ]),
        }),
      }),
    });

    const params = Promise.resolve({ id: "1" });
    const req = {
      json: vi.fn().mockResolvedValue({
        targetContactId: 1, // Same as source
        mergeEmailAddresses: true,
        deleteSourceContact: false,
      }),
    };

    const response = await POST(req as any, { params });
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toBe("Cannot merge contact with itself");
  });

  it("should successfully merge contacts", async () => {
    // Mock transaction
    const mockTransaction = vi.fn().mockImplementation(async (callback) => {
      await callback({
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn(),
          }),
        }),
        delete: vi.fn().mockReturnValue({
          where: vi.fn(),
        }),
      });
    });

    db.transaction = mockTransaction;

    // Mock contacts exist and are different
    let callCount = 0;
    db.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockImplementation(() => {
            callCount++;
            if (callCount === 1) {
              return Promise.resolve([
                {
                  id: 1,
                  firstName: "John",
                  lastName: "Doe",
                },
              ]);
            } else {
              return Promise.resolve([
                {
                  id: 2,
                  firstName: "Jane",
                  lastName: "Smith",
                },
              ]);
            }
          }),
        }),
      }),
    });

    const params = Promise.resolve({ id: "1" });
    const req = {
      json: vi.fn().mockResolvedValue({
        targetContactId: 2,
        mergeEmailAddresses: true,
        mergeEmails: false,
        mergeLeads: false,
        mergeComments: false,
        mergeEvents: false,
        mergeFollowups: false,
        deleteSourceContact: false,
      }),
    };

    const response = await POST(req as any, { params });
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.message).toContain("Successfully merged");

    // Verify transaction was called
    expect(mockTransaction).toHaveBeenCalled();
  });

  it("should successfully merge comments when requested", async () => {
    // Mock transaction that tracks what gets merged
    const mockUpdateCalls: any[] = [];
    const mockTransaction = vi.fn().mockImplementation(async (callback) => {
      await callback({
        update: vi.fn().mockImplementation((table) => {
          const updateCall = { table };
          mockUpdateCalls.push(updateCall);
          return {
            set: vi.fn().mockReturnValue({
              where: vi.fn(),
            }),
          };
        }),
        delete: vi.fn().mockReturnValue({
          where: vi.fn(),
        }),
      });
    });

    db.transaction = mockTransaction;

    // Mock contacts exist and are different
    let callCount = 0;
    db.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockImplementation(() => {
            callCount++;
            if (callCount === 1) {
              return Promise.resolve([
                {
                  id: 1,
                  firstName: "John",
                  lastName: "Doe",
                },
              ]);
            } else {
              return Promise.resolve([
                {
                  id: 2,
                  firstName: "Jane",
                  lastName: "Smith",
                },
              ]);
            }
          }),
        }),
      }),
    });

    const params = Promise.resolve({ id: "1" });
    const req = {
      json: vi.fn().mockResolvedValue({
        targetContactId: 2,
        mergeEmailAddresses: false,
        mergeEmails: false,
        mergeLeads: false,
        mergeComments: true, // Only merge comments
        mergeEvents: false,
        mergeFollowups: false,
        deleteSourceContact: false,
      }),
    };

    const response = await POST(req as any, { params });
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.message).toContain("Successfully merged");

    // Verify transaction was called
    expect(mockTransaction).toHaveBeenCalled();

    // Should have called update once for comments
    expect(mockUpdateCalls).toHaveLength(1);
  });

  it("should update activityEvents contactId when mergeEvents is true", async () => {
    // Mock transaction that tracks what tables get updated
    const mockUpdateCalls: { table: any; setArgs: any }[] = [];
    const mockTransaction = vi.fn().mockImplementation(async (callback) => {
      await callback({
        update: vi.fn().mockImplementation((table) => {
          return {
            set: vi.fn().mockImplementation((setArgs) => {
              mockUpdateCalls.push({ table, setArgs });
              return {
                where: vi.fn(),
              };
            }),
          };
        }),
        delete: vi.fn().mockReturnValue({
          where: vi.fn(),
        }),
      });
    });

    db.transaction = mockTransaction;

    // Mock contacts exist and are different
    let callCount = 0;
    db.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockImplementation(() => {
            callCount++;
            if (callCount === 1) {
              return Promise.resolve([
                {
                  id: 1,
                  firstName: "John",
                  lastName: "Doe",
                },
              ]);
            } else {
              return Promise.resolve([
                {
                  id: 2,
                  firstName: "Jane",
                  lastName: "Smith",
                },
              ]);
            }
          }),
        }),
      }),
    });

    const params = Promise.resolve({ id: "1" });
    const req = {
      json: vi.fn().mockResolvedValue({
        targetContactId: 2,
        mergeEmailAddresses: false,
        mergeEmails: false,
        mergeLeads: false,
        mergeComments: false,
        mergeEvents: true, // Only merge events
        mergeFollowups: false,
        deleteSourceContact: false,
      }),
    };

    const response = await POST(req as any, { params });
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.success).toBe(true);

    // Verify transaction was called
    expect(mockTransaction).toHaveBeenCalled();

    // Should have called update once for activityEvents
    expect(mockUpdateCalls).toHaveLength(1);

    // Verify the contactId was set to targetContactId (2)
    expect(mockUpdateCalls[0].setArgs).toEqual({ contactId: 2 });
  });

  it("should merge all selected items in a single transaction", async () => {
    // Mock transaction that tracks all operations
    const mockUpdateCalls: { table: any }[] = [];
    const mockDeleteCalls: { table: any }[] = [];
    const mockTransaction = vi.fn().mockImplementation(async (callback) => {
      await callback({
        update: vi.fn().mockImplementation((table) => {
          mockUpdateCalls.push({ table });
          return {
            set: vi.fn().mockReturnValue({
              where: vi.fn(),
            }),
          };
        }),
        delete: vi.fn().mockImplementation((table) => {
          mockDeleteCalls.push({ table });
          return {
            where: vi.fn(),
          };
        }),
      });
    });

    db.transaction = mockTransaction;

    // Mock contacts exist and are different
    let callCount = 0;
    db.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockImplementation(() => {
            callCount++;
            if (callCount === 1) {
              return Promise.resolve([
                {
                  id: 1,
                  firstName: "John",
                  lastName: "Doe",
                },
              ]);
            } else {
              return Promise.resolve([
                {
                  id: 2,
                  firstName: "Jane",
                  lastName: "Smith",
                },
              ]);
            }
          }),
        }),
      }),
    });

    const params = Promise.resolve({ id: "1" });
    const req = {
      json: vi.fn().mockResolvedValue({
        targetContactId: 2,
        mergeEmailAddresses: true,
        mergeEmails: true,
        mergeLeads: true,
        mergeComments: true,
        mergeEvents: true,
        mergeFollowups: true,
        deleteSourceContact: true,
      }),
    };

    const response = await POST(req as any, { params });
    expect(response.status).toBe(200);

    // Verify transaction was called
    expect(mockTransaction).toHaveBeenCalled();

    // Should have called update for all 6 merge operations:
    // contactEmails, emails, leads, comments, activityEvents, followups
    expect(mockUpdateCalls).toHaveLength(6);

    // Should have called delete for the source contact
    expect(mockDeleteCalls).toHaveLength(1);
  });

  it("should not merge events when mergeEvents is false", async () => {
    const mockUpdateCalls: { table: any }[] = [];
    const mockTransaction = vi.fn().mockImplementation(async (callback) => {
      await callback({
        update: vi.fn().mockImplementation((table) => {
          mockUpdateCalls.push({ table });
          return {
            set: vi.fn().mockReturnValue({
              where: vi.fn(),
            }),
          };
        }),
        delete: vi.fn().mockReturnValue({
          where: vi.fn(),
        }),
      });
    });

    db.transaction = mockTransaction;

    // Mock contacts exist and are different
    let callCount = 0;
    db.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockImplementation(() => {
            callCount++;
            if (callCount === 1) {
              return Promise.resolve([
                {
                  id: 1,
                  firstName: "John",
                  lastName: "Doe",
                },
              ]);
            } else {
              return Promise.resolve([
                {
                  id: 2,
                  firstName: "Jane",
                  lastName: "Smith",
                },
              ]);
            }
          }),
        }),
      }),
    });

    const params = Promise.resolve({ id: "1" });
    const req = {
      json: vi.fn().mockResolvedValue({
        targetContactId: 2,
        mergeEmailAddresses: true,
        mergeEmails: false,
        mergeLeads: false,
        mergeComments: false,
        mergeEvents: false, // Events NOT merged
        mergeFollowups: false,
        deleteSourceContact: false,
      }),
    };

    const response = await POST(req as any, { params });
    expect(response.status).toBe(200);

    // Should only have called update for contactEmails (1 operation)
    expect(mockUpdateCalls).toHaveLength(1);
  });
});
