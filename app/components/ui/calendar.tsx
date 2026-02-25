"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker, type DayPickerProps, UI, DayFlag, SelectionState, useDayPicker } from "react-day-picker";

import { cn } from "~/lib/utils";
import { buttonVariants } from "~/components/ui/button";

export type CalendarProps = DayPickerProps;

/** Encabezado compacto: [<] Mes Año [>] en una sola línea */
function MonthCaptionCompact(
  props: React.ComponentProps<"div"> & { calendarMonth?: { date: Date }; displayIndex?: number }
) {
  const { calendarMonth, displayIndex = 0, className, ...divProps } = props;
  const { previousMonth, nextMonth, goToMonth, months, formatters } = useDayPicker();
  const month =
    calendarMonth?.date ?? months[displayIndex]?.date ?? new Date();
  const monthLabel = month.toLocaleDateString("es-AR", { month: "long", year: "numeric" });

  return (
    <div
      {...divProps}
      className={cn("flex items-center justify-center gap-1.5 py-1.5 w-full", className)}
    >
      <button
        type="button"
        onClick={() => previousMonth && goToMonth(previousMonth)}
        disabled={!previousMonth}
        aria-label={previousMonth ? `Mes anterior` : undefined}
        className={cn(
          buttonVariants({ variant: "outline" }),
          "size-8 shrink-0 bg-transparent p-0 opacity-70 hover:opacity-100 border-border rounded-md disabled:opacity-40"
        )}
      >
        <ChevronLeft className="size-4" />
      </button>
      <span className="text-sm font-medium min-w-[7rem] text-center capitalize">
        {monthLabel}
      </span>
      <button
        type="button"
        onClick={() => nextMonth && goToMonth(nextMonth)}
        disabled={!nextMonth}
        aria-label={nextMonth ? `Mes siguiente` : undefined}
        className={cn(
          buttonVariants({ variant: "outline" }),
          "size-8 shrink-0 bg-transparent p-0 opacity-70 hover:opacity-100 border-border rounded-md disabled:opacity-40"
        )}
      >
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
}

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  components: propsComponents,
  ...restProps
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        [UI.Root]: "flex flex-col gap-4",
        [UI.Months]: "flex flex-col sm:flex-row gap-4",
        [UI.Month]: "flex flex-col gap-4",
        [UI.MonthCaption]: "",
        [UI.Nav]: "hidden",
        [UI.PreviousMonthButton]: cn(
          buttonVariants({ variant: "outline" }),
          "size-8 shrink-0 bg-transparent p-0 opacity-70 hover:opacity-100 border-border rounded-md"
        ),
        [UI.NextMonthButton]: cn(
          buttonVariants({ variant: "outline" }),
          "size-8 shrink-0 bg-transparent p-0 opacity-70 hover:opacity-100 border-border rounded-md"
        ),
        [UI.CaptionLabel]: "",
        [UI.Weekdays]: "border-b border-border",
        [UI.Weekday]: "text-muted-foreground w-[14.28%] p-1 text-center font-normal text-[0.8rem]",
        [UI.MonthGrid]: "w-full table-fixed border-collapse",
        [UI.Weeks]: "",
        [UI.Week]: "",
        [UI.Day]: "relative p-0.5 align-top text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected].day-range-end)]:rounded-r-md",
        [UI.DayButton]: cn(
          buttonVariants({ variant: "ghost" }),
          "size-9 w-full p-0 font-normal aria-selected:opacity-100"
        ),
        [SelectionState.selected]:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        [DayFlag.today]: "bg-accent text-accent-foreground",
        [DayFlag.outside]:
          "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        [DayFlag.disabled]: "text-muted-foreground opacity-50",
        [DayFlag.hidden]: "invisible",
        ...classNames,
      }}
      components={{
        MonthCaption: MonthCaptionCompact,
        Chevron: ({ orientation, ...rest }) => {
          const Icon = orientation === "left" ? ChevronLeft : ChevronRight;
          return <Icon className="size-4" {...rest} />;
        },
        ...propsComponents,
      }}
      {...restProps}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
