import { ActivityLog } from "@/components/activity-log";
import { http, HttpResponse } from "msw";
import { INITIAL_MOCK_STATE } from "../../mocks/state";
import { useFixtureHandlers } from "../../mocks/msw-worker";
import { paginate } from "../../mocks/fixture-helpers";

function DefaultActivityLog() {
  const ready = useFixtureHandlers([
    http.get("/api/followups", () => HttpResponse.json(paginate(INITIAL_MOCK_STATE.followups))),
    http.get("/api/recent-activities", () =>
      HttpResponse.json(
        paginate([
          ...INITIAL_MOCK_STATE.completedFollowups.map((f) => ({
            id: `followup-${f.id}`,
            type: "followup" as const,
            createdAt: f.completedAt || f.createdAt,
            createdBy: f.createdBy || null,
            company: f.company || null,
            contact: f.contact || null,
            lead: f.lead || null,
            contactEndDate: null,
            followup: {
              id: f.id,
              note: f.note,
              dueAt: f.dueAt,
              completedAt: f.completedAt || "",
              assignedTo: f.assignedTo || null,
            },
          })),
          ...INITIAL_MOCK_STATE.comments.map((c) => ({
            id: `comment-${c.id}`,
            type: "comment" as const,
            createdAt: c.createdAt,
            createdBy: c.createdBy || null,
            company: c.company || null,
            contact: c.contact || null,
            lead: null,
            contactEndDate: null,
            comment: { id: c.id, content: c.content },
          })),
          ...INITIAL_MOCK_STATE.emails.map((e) => ({
            id: `email-${e.id}`,
            type: "email" as const,
            createdAt: e.createdAt,
            createdBy: e.sourceUser || null,
            company: null,
            contact: e.recipientContact || null,
            lead: null,
            contactEndDate: null,
            email: { id: e.id, subject: e.subject || null, content: e.content },
          })),
        ])
      )
    ),
    http.get("/api/users", () => HttpResponse.json(INITIAL_MOCK_STATE.users)),
  ]);
  if (!ready) return null;
  return <ActivityLog contactId={1} companyId={1} />;
}

function EmptyActivityLog() {
  const ready = useFixtureHandlers([
    http.get("/api/followups", () => HttpResponse.json(paginate([]))),
    http.get("/api/recent-activities", () => HttpResponse.json(paginate([]))),
    http.get("/api/users", () => HttpResponse.json([])),
  ]);
  if (!ready) return null;
  return <ActivityLog contactId={1} />;
}

export default {
  default: <DefaultActivityLog />,
  empty: <EmptyActivityLog />,
};
