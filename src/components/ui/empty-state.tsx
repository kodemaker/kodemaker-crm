import * as React from "react";
import { cn } from "@/lib/utils";
import { Button, type buttonVariants } from "@/components/ui/button";
import type { LucideIcon } from "lucide-react";
import type { VariantProps } from "class-variance-authority";

interface EmptyStateProps {
  title: string;
  description: string;
  icons?: LucideIcon[];
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
    variant?: VariantProps<typeof buttonVariants>["variant"];
  };
  className?: string;
  size?: "sm" | "default" | "lg";
  layout?: "vertical" | "horizontal";
  noBorder?: boolean;
}

export function EmptyState({
  title,
  description,
  icons = [],
  action,
  className,
  size = "default",
  layout = "vertical",
  noBorder = false,
}: EmptyStateProps) {
  const sizeClasses = {
    sm: "p-6",
    default: "p-8",
    lg: "p-12",
  };

  const iconSizeClasses = {
    sm: "size-10",
    default: "size-12",
    lg: "size-14",
  };

  const innerIconSizeClasses = {
    sm: "size-5",
    default: "size-6",
    lg: "size-7",
  };

  // Horizontal layout - compact, single row on desktop, stacked on mobile
  if (layout === "horizontal") {
    return (
      <div
        className={cn(
          "bg-background",
          !noBorder && "border-border hover:border-border/80 border-2 border-dashed",
          "rounded-xl w-full",
          "group hover:bg-muted/30 transition-all duration-500 hover:duration-200",
          "flex flex-col items-center text-center gap-4 px-6 py-5",
          "sm:flex-row sm:text-left sm:gap-6",
          className
        )}
      >
        {/* Animated Icon Display - Horizontal */}
        {icons.length > 0 && (
          <div className="flex justify-center isolate shrink-0">
            {icons.length >= 3 ? (
              <>
                {/* Left icon */}
                <div
                  className={cn(
                    "bg-background grid place-items-center rounded-xl relative left-2 top-1 -rotate-6",
                    "shadow-lg ring-1 ring-border",
                    "group-hover:-translate-x-3 group-hover:-rotate-12 group-hover:-translate-y-0.5",
                    "transition-all duration-500 group-hover:duration-200",
                    "size-10"
                  )}
                >
                  {React.createElement(icons[0], {
                    className: "text-muted-foreground size-5",
                  })}
                </div>
                {/* Center icon */}
                <div
                  className={cn(
                    "bg-background grid place-items-center rounded-xl relative z-10",
                    "shadow-lg ring-1 ring-border",
                    "group-hover:-translate-y-1",
                    "transition-all duration-500 group-hover:duration-200",
                    "size-10"
                  )}
                >
                  {React.createElement(icons[1], {
                    className: "text-muted-foreground size-5",
                  })}
                </div>
                {/* Right icon */}
                <div
                  className={cn(
                    "bg-background grid place-items-center rounded-xl relative right-2 top-1 rotate-6",
                    "shadow-lg ring-1 ring-border",
                    "group-hover:translate-x-3 group-hover:rotate-12 group-hover:-translate-y-0.5",
                    "transition-all duration-500 group-hover:duration-200",
                    "size-10"
                  )}
                >
                  {React.createElement(icons[2], {
                    className: "text-muted-foreground size-5",
                  })}
                </div>
              </>
            ) : (
              /* Single icon */
              <div
                className={cn(
                  "bg-background grid place-items-center rounded-xl",
                  "shadow-lg ring-1 ring-border",
                  "group-hover:-translate-y-1",
                  "transition-all duration-500 group-hover:duration-200",
                  "size-10"
                )}
              >
                {React.createElement(icons[0], {
                  className: "text-muted-foreground size-5",
                })}
              </div>
            )}
          </div>
        )}

        {/* Content - Horizontal */}
        <div className="flex-1 min-w-0">
          <h3 className="text-foreground font-medium">{title}</h3>
          <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
        </div>

        {/* Action Button - Horizontal */}
        {action && (
          <Button
            onClick={action.onClick}
            variant={action.variant ?? "secondary"}
            className="shrink-0"
          >
            {action.icon && React.createElement(action.icon, { className: "size-4" })}
            {action.label}
          </Button>
        )}
      </div>
    );
  }

  // Vertical layout - original centered design
  return (
    <div
      className={cn(
        "bg-background text-center",
        !noBorder && "border-border hover:border-border/80 border-2 border-dashed",
        "rounded-xl w-full",
        "group hover:bg-muted/30 transition-all duration-500 hover:duration-200",
        sizeClasses[size],
        className
      )}
    >
      {/* Animated Icon Display */}
      {icons.length > 0 && (
        <div className="flex justify-center isolate mb-6">
          {icons.length >= 3 ? (
            <>
              {/* Left icon */}
              <div
                className={cn(
                  "bg-background grid place-items-center rounded-xl relative left-2.5 top-1.5 -rotate-6",
                  "shadow-lg ring-1 ring-border",
                  "group-hover:-translate-x-5 group-hover:-rotate-12 group-hover:-translate-y-0.5",
                  "transition-all duration-500 group-hover:duration-200",
                  iconSizeClasses[size]
                )}
              >
                {React.createElement(icons[0], {
                  className: cn("text-muted-foreground", innerIconSizeClasses[size]),
                })}
              </div>
              {/* Center icon */}
              <div
                className={cn(
                  "bg-background grid place-items-center rounded-xl relative z-10",
                  "shadow-lg ring-1 ring-border",
                  "group-hover:-translate-y-1",
                  "transition-all duration-500 group-hover:duration-200",
                  iconSizeClasses[size]
                )}
              >
                {React.createElement(icons[1], {
                  className: cn("text-muted-foreground", innerIconSizeClasses[size]),
                })}
              </div>
              {/* Right icon */}
              <div
                className={cn(
                  "bg-background grid place-items-center rounded-xl relative right-2.5 top-1.5 rotate-6",
                  "shadow-lg ring-1 ring-border",
                  "group-hover:translate-x-5 group-hover:rotate-12 group-hover:-translate-y-0.5",
                  "transition-all duration-500 group-hover:duration-200",
                  iconSizeClasses[size]
                )}
              >
                {React.createElement(icons[2], {
                  className: cn("text-muted-foreground", innerIconSizeClasses[size]),
                })}
              </div>
            </>
          ) : (
            /* Single icon */
            <div
              className={cn(
                "bg-background grid place-items-center rounded-xl",
                "shadow-lg ring-1 ring-border",
                "group-hover:-translate-y-1",
                "transition-all duration-500 group-hover:duration-200",
                iconSizeClasses[size]
              )}
            >
              {React.createElement(icons[0], {
                className: cn("text-muted-foreground", innerIconSizeClasses[size]),
              })}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <h3 className="text-foreground font-medium">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1 whitespace-pre-line max-w-sm mx-auto">
        {description}
      </p>

      {/* Action Button */}
      {action && (
        <Button
          onClick={action.onClick}
          variant={action.variant ?? "secondary"}
          className="mt-4"
        >
          {action.icon && React.createElement(action.icon, { className: "size-4" })}
          {action.label}
        </Button>
      )}
    </div>
  );
}
