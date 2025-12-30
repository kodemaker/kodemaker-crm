"use client";

import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { DateRange } from "react-day-picker";

type DateRangePickerProps = {
  value?: { from?: Date; to?: Date };
  onValueChange?: (range: { from?: Date; to?: Date } | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  align?: "start" | "center" | "end";
};

export function DateRangePicker({
  value,
  onValueChange,
  placeholder = "Velg periode",
  disabled = false,
  className,
  align = "start",
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);

  const formatRange = () => {
    if (!value?.from && !value?.to) return null;
    if (value.from && value.to) {
      return `${formatDate(value.from.toISOString())} – ${formatDate(value.to.toISOString())}`;
    }
    if (value.from) {
      return `Fra ${formatDate(value.from.toISOString())}`;
    }
    return null;
  };

  const handleSelect = (range: DateRange | undefined) => {
    onValueChange?.(range ? { from: range.from, to: range.to } : undefined);
    // Close popover when a complete range is selected (two different dates)
    if (range?.from && range?.to && range.from.getTime() !== range.to.getTime()) {
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "justify-start text-left font-normal",
            !value?.from && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {formatRange() || placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align={align}>
        <Calendar
          mode="range"
          selected={value as DateRange}
          onSelect={handleSelect}
          numberOfMonths={1}
        />
      </PopoverContent>
    </Popover>
  );
}
