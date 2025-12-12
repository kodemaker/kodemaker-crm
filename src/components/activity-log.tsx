"use client";
import { useMemo, useRef, useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { CalendarPlus, ChevronsUpDown, MessageSquarePlus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { DatePicker } from "@/components/ui/date-picker";
import { EmailItem } from "@/components/activity-log/email-item";
import { CommentItem } from "@/components/activity-log/comment-item";
import { FollowupItem } from "@/components/activity-log/followup-item";
import { LeadSelector } from "@/components/activity-log/lead-selector";
import type { ApiEmail, LeadStatus } from "@/types/api";
import { EditFollowupDialog } from "@/components/dialogs/edit-followup-dialog";
import { EditCommentDialog } from "@/components/dialogs/edit-comment-dialog";
import type { FollowupItemData } from "@/components/activity-log/followup-item";
import { getDefaultDueDate } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { useEffect } from "react";

type FollowupItemType = {
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

type CommentItem = {
  id: number;
  content: string;
  createdAt: string;
  createdBy?: { firstName?: string | null; lastName?: string | null } | null;
  company?: { id: number; name: string } | null;
  contact?: { id: number; firstName: string | null; lastName: string | null } | null;
  lead?: { id: number; description: string; status: LeadStatus } | null;
  contactEndDate?: string | null;
};

type ActivityItem =
  | { type: "followup"; data: FollowupItemType }
  | { type: "comment"; data: CommentItem }
  | { type: "email"; data: ApiEmail };

type ActivityLogProps = {
  contactId?: number;
  companyId?: number;
  contactIds?: number[];
  initialEmails?: ApiEmail[];
};

type User = {
  id: number;
  firstName: string;
  lastName: string;
};

type Lead = {
  id: number;
  description: string;
  status: LeadStatus;
};

function buildQueryParams(contactId?: number, companyId?: number, contactIds?: number[]) {
  const followupParams = contactId
    ? `contactId=${contactId}&all=1`
    : companyId
      ? `companyId=${companyId}&all=1`
      : "all=1";

  const commentParams = contactId
    ? `contactId=${contactId}`
    : companyId
      ? `companyId=${companyId}`
      : null;

  const emailParams = contactId
    ? `contactId=${contactId}`
    : companyId
      ? `companyId=${companyId}`
      : contactIds && contactIds.length > 0
        ? `contactIds=${contactIds.join(",")}`
        : null;

  return { followupParams, commentParams, emailParams };
}

export function ActivityLog({
  contactId,
  companyId,
  contactIds,
  initialEmails = [],
}: ActivityLogProps) {
  const [activeTab, setActiveTab] = useState<"followup" | "comment">("followup");
  const [newComment, setNewComment] = useState("");
  const [newFollowupNote, setNewFollowupNote] = useState("");
  const [newFollowupDue, setNewFollowupDue] = useState<Date | null>(getDefaultDueDate());
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userPopoverOpen, setUserPopoverOpen] = useState(false);
  const [userQuery, setUserQuery] = useState("");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [leadPopoverOpen, setLeadPopoverOpen] = useState(false);
  const [leadQuery, setLeadQuery] = useState("");
  const [editFollowupOpen, setEditFollowupOpen] = useState(false);
  const [editCommentOpen, setEditCommentOpen] = useState(false);
  const [selectedFollowup, setSelectedFollowup] = useState<FollowupItemData | null>(null);
  const [selectedComment, setSelectedComment] = useState<CommentItem | null>(null);
  const { mutate: globalMutate } = useSWRConfig();
  const hasSetDefaultUser = useRef(false);

  const { followupParams, commentParams, emailParams } = buildQueryParams(
    contactId,
    companyId,
    contactIds
  );

  const { data: openFollowups, mutate: mutateOpenFollowups } = useSWR<FollowupItemType[]>(
    `/api/followups?${followupParams}`
  );

  const { data: completedFollowups, mutate: mutateCompletedFollowups } = useSWR<FollowupItemType[]>(
    `/api/followups?${followupParams}&completed=1`
  );

  const { data: comments, mutate: mutateComments } = useSWR<CommentItem[]>(
    commentParams ? `/api/comments?${commentParams}` : null
  );

  const { data: fetchedEmails, mutate: mutateEmails } = useSWR<ApiEmail[]>(
    emailParams ? `/api/emails?${emailParams}` : null,
    { fallbackData: initialEmails }
  );

  const { data: users } = useSWR<User[]>(`/api/users`);
  const { data: session } = useSession();

  const leadsEndpoint = contactId
    ? `/api/leads?contactId=${contactId}`
    : companyId
      ? `/api/leads?companyId=${companyId}`
      : null;
  const { data: leads } = useSWR<Lead[]>(leadsEndpoint);

  const emails = fetchedEmails ?? initialEmails;

  // Pre-select current user
  useEffect(() => {
    if (users && session?.user?.id && !selectedUser && !hasSetDefaultUser.current) {
      const currentUserId = Number(session.user.id);
      const currentUser = users.find((u) => u.id === currentUserId);
      if (currentUser) {
        setSelectedUser(currentUser);
        hasSetDefaultUser.current = true;
      }
    }
  }, [users, session?.user?.id, selectedUser]);

  async function saveComment() {
    const body = {
      content: newComment,
      ...(contactId ? { contactId } : {}),
      ...(companyId ? { companyId } : {}),
      ...(selectedLead ? { leadId: selectedLead.id } : {}),
    };
    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      setNewComment("");
      setSelectedLead(null);
      if (commentParams) {
        await mutateComments(undefined, { revalidate: true });
        await globalMutate(`/api/comments?${commentParams}`);
      }
      if (emailParams) {
        await mutateEmails(undefined, { revalidate: true });
      }
    }
  }

  async function saveFollowup() {
    if (!newFollowupDue) return;
    const body = {
      note: newFollowupNote,
      dueAt: newFollowupDue.toISOString(),
      ...(contactId ? { contactId } : {}),
      ...(companyId ? { companyId } : {}),
      ...(selectedUser ? { assignedToUserId: selectedUser.id } : {}),
      ...(selectedLead ? { leadId: selectedLead.id } : {}),
    };
    const res = await fetch("/api/followups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      setNewFollowupNote("");
      setNewFollowupDue(getDefaultDueDate());
      setSelectedUser(null);
      setSelectedLead(null);
      await mutateOpenFollowups(undefined, { revalidate: true });
      await globalMutate(`/api/followups?${followupParams}`);
      if (emailParams) {
        await mutateEmails(undefined, { revalidate: true });
      }
    }
  }

  async function completeFollowup(followupId: number) {
    const res = await fetch(`/api/followups/${followupId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completedAt: new Date().toISOString() }),
    });
    if (res.ok) {
      await mutateOpenFollowups(undefined, { revalidate: true });
      await mutateCompletedFollowups(undefined, { revalidate: true });
      await globalMutate(`/api/followups?${followupParams}`);
      await globalMutate(`/api/followups?${followupParams}&completed=1`);
      if (emailParams) {
        await mutateEmails(undefined, { revalidate: true });
      }
    }
  }

  const recentActivities = useMemo(() => {
    const items: ActivityItem[] = [];

    if (Array.isArray(completedFollowups)) {
      for (const f of completedFollowups) {
        items.push({ type: "followup", data: f });
      }
    }

    if (Array.isArray(comments)) {
      for (const c of comments) {
        items.push({ type: "comment", data: c });
      }
    }

    if (Array.isArray(emails)) {
      for (const e of emails) {
        items.push({ type: "email", data: e });
      }
    }

    return items.sort((a, b) => {
      const dateA =
        a.type === "followup"
          ? a.data.completedAt || a.data.createdAt
          : a.type === "comment"
            ? a.data.createdAt
            : a.data.createdAt;
      const dateB =
        b.type === "followup"
          ? b.data.completedAt || b.data.createdAt
          : b.type === "comment"
            ? b.data.createdAt
            : b.data.createdAt;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });
  }, [completedFollowups, comments, emails]);

  const filteredUsers = useMemo(() => {
    if (!users || !userQuery) return users ?? [];
    const query = userQuery.toLowerCase();
    return users.filter(
      (u) =>
        u.firstName.toLowerCase().includes(query) ||
        u.lastName.toLowerCase().includes(query) ||
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(query)
    );
  }, [users, userQuery]);

  const filteredLeads = useMemo(() => {
    if (!leads || !leadQuery) return leads ?? [];
    const query = leadQuery.toLowerCase();
    return leads.filter((l) => l.description.toLowerCase().includes(query));
  }, [leads, leadQuery]);

  return (
    <section className="bg-muted rounded-lg p-4">
      <h2 className="text-lg font-medium mb-4">Aktivitetslogg</h2>
      <div className="bg-background rounded p-4">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "followup" | "comment")}>
          <TabsList>
            <TabsTrigger value="followup">Oppfølging</TabsTrigger>
            <TabsTrigger value="comment">Kommentar</TabsTrigger>
          </TabsList>
          <TabsContent value="followup" className="mt-4">
            <div className="space-y-3">
              <Textarea
                rows={3}
                placeholder="Notat…"
                value={newFollowupNote}
                onChange={(e) => setNewFollowupNote(e.target.value)}
              />
              <div className="flex flex-col sm:flex-row items-start gap-3">
                <div className="w-full sm:flex-1">
                  <label className="block text-xs text-muted-foreground mb-1">Frist</label>
                  <DatePicker
                    value={newFollowupDue}
                    onValueChange={(date) => setNewFollowupDue(date ?? null)}
                    placeholder="Velg dato"
                  />
                </div>
                <div className="w-full sm:flex-1">
                  <label className="block text-xs text-muted-foreground mb-1">Tildel</label>
                  <Popover open={userPopoverOpen} onOpenChange={setUserPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between text-sm font-normal"
                      >
                        {selectedUser
                          ? `${selectedUser.firstName} ${selectedUser.lastName}`
                          : "Velg bruker…"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)]">
                      <Command>
                        <CommandInput
                          autoFocus
                          placeholder="Søk bruker…"
                          value={userQuery}
                          onValueChange={setUserQuery}
                          onKeyDown={(e) => {
                            if (e.key === "Escape" || e.key === "Tab") {
                              setUserPopoverOpen(false);
                            }
                          }}
                        />
                        <CommandList>
                          <CommandEmpty>Ingen treff</CommandEmpty>
                          <CommandItem
                            value=""
                            onSelect={() => {
                              setSelectedUser(null);
                              setUserPopoverOpen(false);
                            }}
                          >
                            Ingen
                          </CommandItem>
                          {filteredUsers?.map((u) => (
                            <CommandItem
                              key={u.id}
                              value={`${u.firstName} ${u.lastName}`}
                              onSelect={() => {
                                setSelectedUser(u);
                                setUserPopoverOpen(false);
                              }}
                            >
                              {u.firstName} {u.lastName}
                            </CommandItem>
                          ))}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              {leadsEndpoint && (
                <LeadSelector
                  leads={filteredLeads}
                  selectedLead={selectedLead}
                  onSelect={setSelectedLead}
                  open={leadPopoverOpen}
                  onOpenChange={setLeadPopoverOpen}
                  query={leadQuery}
                  onQueryChange={setLeadQuery}
                />
              )}
              <div className="flex justify-end">
                <Button
                  onClick={saveFollowup}
                  disabled={!newFollowupNote.trim() || !newFollowupDue}
                  size="sm"
                >
                  <CalendarPlus className="h-4 w-4 mr-1.5" />
                  Lagre oppfølgning
                </Button>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="comment" className="mt-4">
            <div className="space-y-3">
              <Textarea
                rows={3}
                placeholder="Skriv en kommentar…"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />
              {leadsEndpoint && (
                <LeadSelector
                  leads={filteredLeads}
                  selectedLead={selectedLead}
                  onSelect={setSelectedLead}
                  open={leadPopoverOpen}
                  onOpenChange={setLeadPopoverOpen}
                  query={leadQuery}
                  onQueryChange={setLeadQuery}
                />
              )}
              <div className="flex justify-end">
                <Button onClick={saveComment} disabled={!newComment.trim()} size="sm">
                  <MessageSquarePlus className="h-4 w-4 mr-1.5" />
                  Lagre kommentar
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <div className="mt-6 space-y-6">
        <div className="bg-background rounded p-4">
          <h3 className="text-sm font-medium mb-2">Krever handling:</h3>
          {openFollowups === undefined ? (
            <div className="p-3 text-sm text-muted-foreground">Laster…</div>
          ) : !Array.isArray(openFollowups) || openFollowups.length === 0 ? (
            <div className="border rounded p-3 text-sm text-muted-foreground">Ingen</div>
          ) : (
            <div className="border rounded divide-y">
              {openFollowups.map((f) => (
                <FollowupItem
                  key={f.id}
                  followup={f}
                  variant="action"
                  onComplete={completeFollowup}
                  onClick={() => {
                    setSelectedFollowup(f);
                    setEditFollowupOpen(true);
                  }}
                />
              ))}
            </div>
          )}
        </div>

        <div className="bg-background rounded p-4">
          <h3 className="text-sm font-medium mb-2">Siste nytt:</h3>
          {recentActivities.length === 0 ? (
            <div className="border rounded p-3 text-sm text-muted-foreground">Ingen</div>
          ) : (
            <div className="border rounded divide-y">
              {recentActivities.map((item) => {
                if (item.type === "comment") {
                  return (
                    <CommentItem
                      key={`comment-${item.data.id}`}
                      id={item.data.id}
                      content={item.data.content}
                      createdAt={item.data.createdAt}
                      createdBy={item.data.createdBy}
                      company={item.data.company}
                      contact={item.data.contact}
                      lead={item.data.lead}
                      contactEndDate={item.data.contactEndDate}
                      showTime={false}
                      onClick={() => {
                        setSelectedComment(item.data);
                        setEditCommentOpen(true);
                      }}
                    />
                  );
                }

                if (item.type === "followup") {
                  return (
                    <FollowupItem
                      key={`followup-${item.data.id}`}
                      followup={item.data}
                      variant="completed"
                      onClick={() => {
                        setSelectedFollowup(item.data);
                        setEditFollowupOpen(true);
                      }}
                    />
                  );
                }

                if (item.type === "email") {
                  return <EmailItem key={`email-${item.data.id}`} email={item.data} />;
                }

                return null;
              })}
            </div>
          )}
        </div>
      </div>

      <EditFollowupDialog
        followup={selectedFollowup}
        open={editFollowupOpen}
        onOpenChange={(open) => {
          setEditFollowupOpen(open);
          if (!open) {
            setSelectedFollowup(null);
          }
        }}
      />

      <EditCommentDialog
        comment={selectedComment}
        open={editCommentOpen}
        onOpenChange={(open) => {
          setEditCommentOpen(open);
          if (!open) {
            setSelectedComment(null);
          }
        }}
      />
    </section>
  );
}
