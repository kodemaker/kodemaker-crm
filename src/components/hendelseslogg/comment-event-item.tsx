"use client";

import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDateTimeWithoutSeconds, getLeadStatusLabel, truncateText } from "@/lib/utils";
import type { ApiActivityEvent } from "@/types/api";
import { useRouter } from "next/navigation";

type CommentEventItemProps = {
  event: ApiActivityEvent;
};

export function CommentEventItem({ event }: CommentEventItemProps) {
  const router = useRouter();

  const handleClick = () => {
    // Navigate to the entity the comment belongs to
    if (event.comment?.leadId) {
      router.push(`/leads/${event.comment.leadId}`);
    } else if (event.comment?.contactId) {
      router.push(`/contacts/${event.comment.contactId}`);
    } else if (event.comment?.companyId) {
      router.push(`/customers/${event.comment.companyId}`);
    }
  };

  return (
    <div
      className="p-3 cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0" style={{ width: "22px" }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2.5 text-xs text-muted-foreground">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="flex-1 min-w-0">
                <span className="text-xs text-muted-foreground">
                  {formatDateTimeWithoutSeconds(event.createdAt)}
                  {event.actorUser && (
                    <>
                      {" "}
                      · Laget av: {event.actorUser.firstName} {event.actorUser.lastName}
                    </>
                  )}
                  {(event.contact || event.company) && (
                    <>
                      {" "}
                      · Om:{" "}
                      {event.contact && (
                        <span
                          className="hover:underline cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/contacts/${event.contact!.id}`);
                          }}
                        >
                          {event.contact.firstName} {event.contact.lastName}
                        </span>
                      )}
                      {event.contact && event.company && " / "}
                      {event.company && (
                        <span
                          className="hover:underline cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/customers/${event.company!.id}`);
                          }}
                        >
                          {event.company.name}
                        </span>
                      )}
                    </>
                  )}
                  {event.lead && event.comment?.leadId && (
                    <>
                      {" "}
                      ·{" "}
                      {event.lead.description.length > 50 ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <a
                              className="hover:underline"
                              href={`/leads/${event.lead.id}`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {getLeadStatusLabel(event.lead.status)}: {truncateText(event.lead.description, 50)}
                            </a>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{event.lead.description}</p>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <a
                          className="hover:underline"
                          href={`/leads/${event.lead.id}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {getLeadStatusLabel(event.lead.status)}: {event.lead.description}
                        </a>
                      )}
                    </>
                  )}
                </span>
              </div>
            </div>
            <Badge>Kommentar</Badge>
          </div>
          {event.comment && (
            <div className="whitespace-pre-wrap text-sm">{event.comment.content}</div>
          )}
        </div>
      </div>
    </div>
  );
}
