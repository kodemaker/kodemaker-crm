"use client";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatDateTimeWithoutSeconds, getInitials, useDueBgStyle } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CompletionCheckbox } from "@/components/completion-checkbox";
import { EntityReference } from "@/components/activity-log/entity-reference";
import { LeadReference } from "@/components/activity-log/lead-reference";
import type { LeadStatus } from "@/types/api";

export type FollowupItemData = {
  id: number;
  note: string;
  dueAt: string;
  completedAt?: string | null;
  createdAt: string;
  createdBy?: { firstName?: string | null; lastName?: string | null } | null;
  assignedTo?: { id: number; firstName: string; lastName: string } | null;
  company?: { id: number; name: string } | null;
  contact?: { id: number; firstName: string | null; lastName: string | null } | null;
  lead?: { id: number; description: string; status: LeadStatus } | null;
  contactEndDate?: string | null;
};

type FollowupItemProps = {
  followup: FollowupItemData;
  variant: "action" | "completed";
  onComplete?: (id: number) => void;
  showBadge?: boolean;
  entityLinks?: boolean;
  onClick?: () => void;
};

export function FollowupItem({
  followup,
  variant,
  onComplete,
  showBadge = true,
  entityLinks = false,
  onClick,
}: FollowupItemProps) {
  const dueBgStyle = useDueBgStyle();
  const isCompleted = !!followup.completedAt;
  const displayDate =
    variant === "completed"
      ? formatDate(followup.completedAt || followup.createdAt)
      : formatDateTimeWithoutSeconds(followup.completedAt || followup.createdAt);

  if (variant === "action") {
    return (
      <div
        className="p-3 relative cursor-pointer hover:bg-muted/50 transition-colors"
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
          <div onClick={(e) => e.stopPropagation()} className="flex-shrink-0">
            <CompletionCheckbox
              completed={isCompleted}
              disabled={isCompleted}
              onClick={() => {
                if (!isCompleted) {
                  onComplete?.(followup.id);
                }
              }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 text-xs text-muted-foreground mb-2.5">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="flex-1 min-w-0">
                  <span className="rounded" style={dueBgStyle(followup.dueAt)}>
                    Frist: {formatDate(followup.dueAt)}
                  </span>
                  {followup.createdBy && (
                    <>
                      {" "}
                      · Laget av: {followup.createdBy.firstName ?? ""}{" "}
                      {followup.createdBy.lastName ?? ""}
                    </>
                  )}
                  <EntityReference
                    contact={followup.contact}
                    company={followup.company}
                    contactEndDate={followup.contactEndDate}
                    entityLinks={entityLinks}
                  />
                  {followup.lead && (
                    <>
                      {" "}
                      · <LeadReference lead={followup.lead} />
                    </>
                  )}
                </div>
              </div>
              {showBadge && <Badge variant="secondary">Oppgave</Badge>}
            </div>
            <div className="whitespace-pre-wrap text-sm pr-10">{followup.note}</div>
          </div>
        </div>
        {followup.assignedTo && (
          <div className="absolute bottom-2 right-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <Avatar className="size-6">
                  <AvatarFallback className="text-[10px]">
                    {getInitials(followup.assignedTo.firstName, followup.assignedTo.lastName)}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>
                Tildelt: {followup.assignedTo.firstName} {followup.assignedTo.lastName}
              </TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>
    );
  }

  // variant === "completed"
  return (
    <div
      className="p-3 relative cursor-pointer hover:bg-muted/50 transition-colors"
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
        <div onClick={(e) => e.stopPropagation()} className="flex-shrink-0">
          <CompletionCheckbox completed={true} disabled={true} onClick={() => {}} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 text-xs text-muted-foreground mb-2.5">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="flex-1 min-w-0">
                <span className="text-xs text-muted-foreground">
                  {displayDate}
                  {followup.createdBy && (
                    <>
                      {" "}
                      · Laget av: {followup.createdBy.firstName ?? ""}{" "}
                      {followup.createdBy.lastName ?? ""}
                    </>
                  )}
                  <EntityReference
                    contact={followup.contact}
                    company={followup.company}
                    contactEndDate={followup.contactEndDate}
                    entityLinks={entityLinks}
                  />
                  {followup.lead && (
                    <>
                      {" "}
                      · <LeadReference lead={followup.lead} />
                    </>
                  )}
                </span>
              </div>
            </div>
            {showBadge && <Badge variant="secondary">Oppgave</Badge>}
          </div>
          <div className="whitespace-pre-wrap text-sm pr-10">{followup.note}</div>
        </div>
      </div>
      {followup.assignedTo && (
        <div className="absolute bottom-2 right-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <Avatar className="size-6">
                <AvatarFallback className="text-[10px]">
                  {getInitials(followup.assignedTo.firstName, followup.assignedTo.lastName)}
                </AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent>
              Tildelt: {followup.assignedTo.firstName} {followup.assignedTo.lastName}
            </TooltipContent>
          </Tooltip>
        </div>
      )}
    </div>
  );
}
