"use client";

import { Badge } from "@/components/ui/badge";
import { formatDateTimeWithoutSeconds, truncateText } from "@/lib/utils";
import type { ApiActivityEvent, LeadStatus } from "@/types/api";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

type LeadEventItemProps = {
  event: ApiActivityEvent;
};

function getStatusBadgeVariant(
  status: LeadStatus
): "default" | "primary" | "tertiary" | "destructive" | "bortfalt" {
  switch (status) {
    case "NEW":
      return "default";
    case "IN_PROGRESS":
      return "tertiary";
    case "WON":
      return "primary"; // chart-2/turquoise per DESIGN_SYSTEM.md
    case "LOST":
      return "destructive";
    case "BORTFALT":
      return "bortfalt";
    default:
      return "default";
  }
}

function getShortStatusLabel(status: LeadStatus): string {
  const labels: Record<LeadStatus, string> = {
    NEW: "Ny",
    IN_PROGRESS: "Under arbeid",
    LOST: "Tapt",
    WON: "Vunnet",
    BORTFALT: "Bortfalt",
  };
  return labels[status] ?? status;
}

export function LeadEventItem({ event }: LeadEventItemProps) {
  const router = useRouter();
  const isStatusChange = event.eventType === "lead_status_changed";
  const isNewLead = event.eventType === "lead_created";

  const handleClick = () => {
    if (event.lead) {
      router.push(`/leads/${event.lead.id}`);
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
                </span>
              </div>
            </div>
            <Badge variant="secondary">Lead</Badge>
          </div>

          {/* Lead description */}
          {event.lead && (
            <div className="text-sm mb-2">{truncateText(event.lead.description, 150)}</div>
          )}

          {/* Status section - bottom left */}
          <div className="flex justify-start">
            {/* Status change display */}
            {isStatusChange && event.oldStatus && event.newStatus && (
              <div className="flex items-center gap-2">
                <span className="text-sm">Statusendring:</span>
                <Badge variant={getStatusBadgeVariant(event.oldStatus)}>
                  {getShortStatusLabel(event.oldStatus)}
                </Badge>
                <ArrowRight className="h-3 w-3" />
                <Badge variant={getStatusBadgeVariant(event.newStatus)}>
                  {getShortStatusLabel(event.newStatus)}
                </Badge>
              </div>
            )}

            {/* New lead status display */}
            {isNewLead && event.lead && (
              <div className="flex items-center gap-2">
                <span className="text-sm">Status:</span>
                <Badge variant={getStatusBadgeVariant(event.lead.status)}>
                  {getShortStatusLabel(event.lead.status)}
                </Badge>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
