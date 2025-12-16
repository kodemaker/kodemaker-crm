"use client";

import type { ApiActivityEvent } from "@/types/api";
import { CommentEventItem } from "./comment-event-item";
import { LeadEventItem } from "./lead-event-item";
import { EmailEventItem } from "./email-event-item";

type ActivityEventItemProps = {
  event: ApiActivityEvent;
  isNew?: boolean;
};

export function ActivityEventItem({ event, isNew }: ActivityEventItemProps) {
  const content = (() => {
    switch (event.eventType) {
      case "comment_created":
        return <CommentEventItem event={event} />;
      case "lead_created":
      case "lead_status_changed":
        return <LeadEventItem event={event} />;
      case "email_received":
        return <EmailEventItem event={event} />;
      default:
        return null;
    }
  })();

  if (!content) return null;

  return (
    <div
      className={`border-b last:border-b-0 transition-colors duration-1000 ${
        isNew ? "bg-green-50 dark:bg-green-950/20" : ""
      }`}
    >
      {content}
    </div>
  );
}
