"use client";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatDateTimeWithoutSeconds } from "@/lib/utils";
import { EntityReference } from "@/components/activity-log/entity-reference";
import { LeadReference } from "@/components/activity-log/lead-reference";
import type { LeadStatus } from "@/types/api";

type CommentItemProps = {
  id: number;
  content: string;
  createdAt: string;
  createdBy?: { firstName?: string | null; lastName?: string | null } | null;
  company?: { id: number; name: string } | null;
  contact?: { id: number; firstName: string | null; lastName: string | null } | null;
  lead?: { id: number; description: string; status: LeadStatus } | null;
  contactEndDate?: string | null;
  onClick?: () => void;
  showTime?: boolean;
};

export function CommentItem({
  content,
  createdAt,
  createdBy,
  company,
  contact,
  lead,
  contactEndDate,
  onClick,
  showTime = true,
}: CommentItemProps) {
  const displayDate = showTime ? formatDateTimeWithoutSeconds(createdAt) : formatDate(createdAt);
  return (
    <div
      className="p-3 cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0" style={{ width: "22px" }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 text-xs text-muted-foreground mb-2.5">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="flex-1 min-w-0">
                <span className="text-xs text-muted-foreground">
                  {displayDate}
                  {createdBy && (
                    <>
                      {" "}
                      · Laget av: {createdBy.firstName ?? ""} {createdBy.lastName ?? ""}
                    </>
                  )}
                  <EntityReference
                    contact={contact}
                    company={company}
                    contactEndDate={contactEndDate}
                    entityLinks={false}
                  />
                  {lead && (
                    <>
                      {" "}
                      · <LeadReference lead={lead} />
                    </>
                  )}
                </span>
              </div>
            </div>
            <Badge>Kommentar</Badge>
          </div>
          <div className="whitespace-pre-wrap text-sm">{content}</div>
        </div>
      </div>
    </div>
  );
}
