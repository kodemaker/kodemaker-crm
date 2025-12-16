"use client";

import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { formatDateTimeWithoutSeconds } from "@/lib/utils";
import type { ApiActivityEvent } from "@/types/api";
import { useRouter } from "next/navigation";

type EmailEventItemProps = {
  event: ApiActivityEvent;
};

export function EmailEventItem({ event }: EmailEventItemProps) {
  const router = useRouter();

  return (
    <div className="p-3">
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
                      · Avsender: {event.actorUser.firstName} {event.actorUser.lastName}
                    </>
                  )}
                  {event.contact && (
                    <>
                      {" "}
                      · Mottaker:{" "}
                      <span
                        className="hover:underline cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/contacts/${event.contact!.id}`);
                        }}
                      >
                        {event.contact.firstName} {event.contact.lastName}
                      </span>
                    </>
                  )}
                  {event.company && (
                    <>
                      {" "}
                      ·{" "}
                      <span
                        className="hover:underline cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/customers/${event.company!.id}`);
                        }}
                      >
                        {event.company.name}
                      </span>
                    </>
                  )}
                </span>
              </div>
            </div>
            <Badge variant="primary">E-post</Badge>
          </div>
          {event.email && (
            <Accordion type="single" collapsible>
              <AccordionItem value={`email-${event.email.id}`} className="border-none">
                <AccordionTrigger className="group hover:no-underline text-left font-normal py-0 h-auto">
                  <div className="flex-1 min-w-0">
                    {event.email.subject && (
                      <div className="font-medium mb-1 text-sm">{event.email.subject}</div>
                    )}
                    <div
                      className="whitespace-pre-wrap break-all text-sm group-data-[state=open]:hidden"
                      style={{
                        maxHeight: "4.5em",
                        overflow: "hidden",
                      }}
                    >
                      {event.email.content}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-0">
                  <div className="whitespace-pre-wrap break-all text-sm">{event.email.content}</div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
        </div>
      </div>
    </div>
  );
}
