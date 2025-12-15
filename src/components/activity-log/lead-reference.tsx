"use client";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getLeadStatusLabel, truncateText } from "@/lib/utils";
import type { LeadStatus } from "@/types/api";

type LeadReferenceProps = {
  lead: { id: number; description: string; status: LeadStatus };
};

const TRUNCATE_LENGTH = 50;

export function LeadReference({ lead }: LeadReferenceProps) {
  const isTruncated = lead.description.length > TRUNCATE_LENGTH;
  const linkContent = (
    <a
      className="hover:underline"
      href={`/leads/${lead.id}`}
      onClick={(e) => e.stopPropagation()}
    >
      {getLeadStatusLabel(lead.status)}: {truncateText(lead.description, TRUNCATE_LENGTH)}
    </a>
  );

  if (!isTruncated) {
    return linkContent;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
      <TooltipContent>
        <p>{lead.description}</p>
      </TooltipContent>
    </Tooltip>
  );
}
