"use client";
import useSWR, { useSWRConfig } from "swr";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronsUpDown, Save, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { FollowupItemData } from "@/components/activity-log/followup-item";
import { Switch } from "@/components/ui/switch";

type User = {
  id: number;
  firstName: string;
  lastName: string;
};

export interface EditFollowupDialogProps {
  followup: FollowupItemData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete?: () => void | Promise<void>;
  onUpdate?: () => void | Promise<void>;
}

function parseDate(dateString: string): Date | null {
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
}

export function EditFollowupDialog({ followup, open, onOpenChange, onDelete, onUpdate }: EditFollowupDialogProps) {
  const schema = z.object({
    note: z.string().min(1, "Notat er påkrevd"),
    dueAt: z.date({ message: "Frist er påkrevd" }),
    assignedToUserId: z.number().int().optional().nullable(),
    isCompleted: z.boolean(),
  });

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      note: "",
      dueAt: undefined,
      assignedToUserId: null,
      isCompleted: false,
    },
  });

  const [userPopoverOpen, setUserPopoverOpen] = useState(false);
  const [userQuery, setUserQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { mutate: globalMutate } = useSWRConfig();

  const { data: users } = useSWR<User[]>(`/api/users`);

  const filteredUsers =
    users?.filter(
      (u) =>
        !userQuery ||
        u.firstName.toLowerCase().includes(userQuery.toLowerCase()) ||
        u.lastName.toLowerCase().includes(userQuery.toLowerCase()) ||
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(userQuery.toLowerCase())
    ) ?? [];

  useEffect(() => {
    if (followup && open) {
      const dueDate = parseDate(followup.dueAt);
      form.reset({
        note: followup.note,
        dueAt: dueDate ?? undefined,
        assignedToUserId: followup.assignedTo?.id ?? null,
        isCompleted: !!followup.completedAt,
      });
      setSelectedUser(
        followup.assignedTo
          ? {
              id: followup.assignedTo.id,
              firstName: followup.assignedTo.firstName,
              lastName: followup.assignedTo.lastName,
            }
          : null
      );
    }
  }, [followup, open, form]);

  async function onSubmit(values: z.infer<typeof schema>) {
    if (!followup) return;

    const wasCompleted = !!followup.completedAt;
    const isNowCompleted = values.isCompleted;

    const body: Record<string, unknown> = {
      note: values.note,
      dueAt: values.dueAt.toISOString(),
      assignedToUserId: values.assignedToUserId ?? null,
    };

    // Only update completedAt if the completion status changed
    // This preserves the original completedAt timestamp when just editing the note
    if (wasCompleted !== isNowCompleted) {
      body.completedAt = isNowCompleted ? new Date().toISOString() : null;
    }
    // If status didn't change, don't send completedAt to preserve the original timestamp

    const res = await fetch(`/api/followups/${followup.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      toast.error("Kunne ikke oppdatere oppfølging");
      return;
    }

    toast.success("Oppfølging oppdatert");
    // Invalidate all followup-related cache keys
    await globalMutate((key) => typeof key === "string" && key.startsWith("/api/followups"));
    // Refresh recent activities list
    if (onUpdate) {
      await onUpdate();
    }
    onOpenChange(false);
  }

  async function handleDelete() {
    if (!followup) return;

    if (!confirm("Er du sikker på at du vil slette denne oppfølgingen? Dette kan ikke angres.")) {
      return;
    }

    setIsDeleting(true);
    const res = await fetch(`/api/followups/${followup.id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      toast.error("Kunne ikke slette oppfølging");
      setIsDeleting(false);
      return;
    }

    toast.success("Oppfølging slettet");
    // Invalidate all followup-related cache keys
    await globalMutate((key) => typeof key === "string" && key.startsWith("/api/followups"));
    // Refresh recent activities list
    if (onDelete) {
      await onDelete();
    }
    setIsDeleting(false);
    onOpenChange(false);
  }

  if (!followup) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Rediger oppfølging</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notat</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={5}
                      className="resize-none max-h-[40vh] overflow-auto"
                      placeholder="Notat..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dueAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Frist</FormLabel>
                  <FormControl>
                    <DatePicker
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Velg dato"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="assignedToUserId"
              render={() => (
                <FormItem>
                  <FormLabel>Tildel</FormLabel>
                  <Popover open={userPopoverOpen} onOpenChange={setUserPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button type="button" variant="outline" className="w-full justify-between">
                        {selectedUser
                          ? `${selectedUser.firstName} ${selectedUser.lastName}`
                          : "Velg bruker..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)]">
                      <Command>
                        <CommandInput
                          autoFocus
                          placeholder="Søk bruker..."
                          value={userQuery}
                          onValueChange={setUserQuery}
                        />
                        <CommandList>
                          <CommandEmpty>Ingen treff</CommandEmpty>
                          <CommandItem
                            value=""
                            onSelect={() => {
                              setSelectedUser(null);
                              form.setValue("assignedToUserId", null);
                              setUserPopoverOpen(false);
                            }}
                          >
                            Ingen
                          </CommandItem>
                          {filteredUsers.map((u) => (
                            <CommandItem
                              key={u.id}
                              value={`${u.firstName} ${u.lastName}`}
                              onSelect={() => {
                                setSelectedUser(u);
                                form.setValue("assignedToUserId", u.id);
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
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isCompleted"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-3">
                    <FormLabel>Fullført</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-between gap-2 mt-6">
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
                className="inline-flex items-center gap-1.5"
              >
                <Trash2 className="h-4 w-4" /> Slett
              </Button>
              <Button type="submit" className="inline-flex items-center gap-1.5">
                <Save className="h-4 w-4" /> Lagre
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
