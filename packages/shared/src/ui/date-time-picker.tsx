'use client';

import { CalendarDays, Clock3, X } from 'lucide-react';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { DayPicker } from 'react-day-picker';
import { cn } from '../lib/utils';
import './date-time-picker.css';

export type DateTimePickerPlacement = 'auto' | 'below' | 'above';

export type DateTimePickerProps = Readonly<{
  /** Local datetime in `YYYY-MM-DDTHH:mm` (the same format a native `datetime-local` emits). */
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  /** Earliest selectable instant — days before it are disabled and earlier times hidden on that day. */
  min?: Date;
  disabled?: boolean;
  dir?: 'ltr' | 'rtl';
  placeholder?: string;
  ariaInvalid?: boolean;
  testId?: string;
  timeAriaLabel: string;
  /**
   * Popover placement relative to the trigger.
   * @default 'auto' — opens below unless there is insufficient viewport space, then above.
   */
  placement?: DateTimePickerPlacement;
  labels?: Readonly<{
    selectDate?: string;
    selectTime?: string;
    today?: string;
    clear?: string;
    hour?: string;
    minute?: string;
    period?: string;
  }>;
}>;

type Time12 = Readonly<{
  hour12: number;
  minute: number;
  period: 'AM' | 'PM';
}>;

type ResolvedPlacement = 'above' | 'below';

type PanelPosition = Readonly<{
  top: number;
  left: number;
  maxHeight: number;
  resolvedPlacement: ResolvedPlacement;
}>;

const HOURS_12 = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const;
const MINUTES = Array.from({ length: 60 }, (_, index) => index);
const PERIODS = ['AM', 'PM'] as const;
const PANEL_GAP_PX = 8;
const VIEWPORT_PADDING_PX = 8;
const PANEL_WIDTH_PX = 480;
const PANEL_ESTIMATED_HEIGHT_PX = 380;

function pad2(n: number): string {
  return n.toString().padStart(2, '0');
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function toTimeValue(date: Date): string {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

function toDateValue(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function parseValue(value: string): { date: Date | undefined; time: string } {
  if (!value) {
    return { date: undefined, time: '' };
  }
  const tIndex = value.indexOf('T');
  const datePart = tIndex === -1 ? value : value.slice(0, tIndex);
  const time = tIndex === -1 ? '' : value.slice(tIndex + 1);
  const [year, month, day] = datePart.split('-').map((part) => Number.parseInt(part, 10));
  if (year === undefined || month === undefined || day === undefined || Number.isNaN(year + month + day)) {
    return { date: undefined, time };
  }
  return { date: new Date(year, month - 1, day), time };
}

function compose(date: Date, time: string): string {
  return `${toDateValue(date)}T${time}`;
}

function parseTime24(time: string): Time12 | null {
  const [hoursRaw, minutesRaw] = time.split(':');
  const hours24 = Number.parseInt(hoursRaw ?? '', 10);
  const minute = Number.parseInt(minutesRaw ?? '', 10);
  if (Number.isNaN(hours24) || Number.isNaN(minute) || minute < 0 || minute > 59) {
    return null;
  }
  const period: 'AM' | 'PM' = hours24 >= 12 ? 'PM' : 'AM';
  const hour12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return { hour12, minute, period };
}

function toTime24({ hour12, minute, period }: Time12): string {
  let hours24 = hour12 % 12;
  if (period === 'PM') {
    hours24 += 12;
  }
  return `${pad2(hours24)}:${pad2(minute)}`;
}

function defaultTime12(): Time12 {
  return { hour12: 12, minute: 0, period: 'AM' };
}

function formatTimeLabel(time: string): string {
  const parsed = parseTime24(time);
  if (!parsed) {
    return time;
  }
  return `${parsed.hour12}:${pad2(parsed.minute)} ${parsed.period}`;
}

function compareTime24(a: string, b: string): number {
  return a.localeCompare(b);
}

function isTimeAllowed(time: string, minTime?: string): boolean {
  if (!minTime) {
    return true;
  }
  return compareTime24(time, minTime) >= 0;
}

function resolvePanelTop(
  triggerRect: DOMRect,
  panelHeight: number,
  placement: DateTimePickerPlacement,
): { top: number; resolvedPlacement: ResolvedPlacement } {
  const belowTop = triggerRect.bottom + PANEL_GAP_PX;
  const aboveTop = triggerRect.top - panelHeight - PANEL_GAP_PX;
  const spaceBelow = window.innerHeight - belowTop - VIEWPORT_PADDING_PX;
  const spaceAbove = triggerRect.top - VIEWPORT_PADDING_PX;

  if (placement === 'below') {
    return { top: belowTop, resolvedPlacement: 'below' };
  }
  if (placement === 'above') {
    return { top: Math.max(VIEWPORT_PADDING_PX, aboveTop), resolvedPlacement: 'above' };
  }

  if (spaceBelow >= panelHeight || spaceBelow >= spaceAbove) {
    return { top: belowTop, resolvedPlacement: 'below' };
  }
  return { top: Math.max(VIEWPORT_PADDING_PX, aboveTop), resolvedPlacement: 'above' };
}

const calendarClassNames = {
  months: 'relative w-full',
  month: 'space-y-2',
  month_caption: 'flex h-9 items-center justify-center px-9',
  caption_label: 'text-sm font-semibold text-foreground',
  nav: 'absolute inset-x-0 top-0 flex h-9 items-center justify-between',
  button_previous:
    'inline-flex size-8 items-center justify-center rounded-md border border-border bg-background text-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40',
  button_next:
    'inline-flex size-8 items-center justify-center rounded-md border border-border bg-background text-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40',
  chevron: 'size-4 fill-current',
  month_grid: 'w-full border-collapse',
  weekdays: 'flex',
  weekday: 'w-8 text-xs font-medium uppercase tracking-wide text-muted-foreground',
  week: 'mt-1 flex w-full',
  day: 'size-8 p-0 text-center text-sm',
  day_button:
    'inline-flex size-8 items-center justify-center rounded-md text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
  today: '[&>button]:border [&>button]:border-primary/40 [&>button]:font-semibold',
  selected: '[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary',
  outside: 'text-muted-foreground/35',
  disabled: 'text-muted-foreground/35 [&>button]:pointer-events-none [&>button]:opacity-40',
  hidden: 'invisible',
} as const;

type TimeColumnProps = Readonly<{
  label: string;
  options: readonly { value: string; label: string; disabled?: boolean }[];
  activeValue: string;
  onSelect: (value: string) => void;
  testIdPrefix?: string;
  scrollable?: boolean;
}>;

function TimeColumn({ label, options, activeValue, onSelect, testIdPrefix, scrollable = false }: TimeColumnProps) {
  const listRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!listRef.current) {
      return;
    }
    const active = listRef.current.querySelector('[data-active="true"]');
    active?.scrollIntoView({ block: 'nearest' });
  }, [activeValue]);

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <p className="mb-1.5 text-center text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <div
        ref={listRef}
        className={cn(
          'min-h-0 max-h-44 rounded-md border border-border bg-background',
          scrollable ? 'date-time-picker-scroll' : 'overflow-y-auto',
        )}
      >
        {options.map((option) => {
          const isActive = option.value === activeValue;
          return (
            <button
              key={option.value}
              type="button"
              disabled={option.disabled}
              data-active={isActive ? 'true' : 'false'}
              data-testid={testIdPrefix ? `${testIdPrefix}-${option.value}` : undefined}
              className={cn(
                'flex w-full items-center justify-center px-2 py-1.5 text-sm transition-colors',
                isActive
                  ? 'bg-primary font-medium text-primary-foreground'
                  : 'text-foreground hover:bg-accent/50 disabled:cursor-not-allowed disabled:opacity-40',
              )}
              onClick={() => onSelect(option.value)}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function DateTimePicker({
  value,
  onChange,
  onBlur,
  min,
  disabled = false,
  dir,
  placeholder,
  ariaInvalid = false,
  testId,
  timeAriaLabel,
  placement = 'auto',
  labels,
}: DateTimePickerProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<PanelPosition | null>(null);

  const copy = useMemo(
    () => ({
      selectDate: labels?.selectDate ?? 'Select date',
      selectTime: labels?.selectTime ?? 'Select time',
      today: labels?.today ?? 'Today',
      clear: labels?.clear ?? 'Clear',
      hour: labels?.hour ?? 'Hour',
      minute: labels?.minute ?? 'Min',
      period: labels?.period ?? 'AM/PM',
    }),
    [labels],
  );

  const { date: selectedDate, time: selectedTime } = useMemo(() => parseValue(value), [value]);
  const selectedTime12 = useMemo(() => parseTime24(selectedTime) ?? defaultTime12(), [selectedTime]);
  const minDay = useMemo(() => (min ? startOfDay(min) : undefined), [min]);
  const effectiveDay = selectedDate ?? minDay;
  const minTimeForDay =
    min && effectiveDay && isSameDay(effectiveDay, min) ? toTimeValue(min) : undefined;

  const close = useCallback(() => {
    setOpen(false);
    onBlur?.();
  }, [onBlur]);

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) {
      return;
    }
    const rect = trigger.getBoundingClientRect();
    const panelWidth = Math.min(PANEL_WIDTH_PX, window.innerWidth - VIEWPORT_PADDING_PX * 2);
    const left = Math.min(
      Math.max(VIEWPORT_PADDING_PX, rect.left),
      window.innerWidth - panelWidth - VIEWPORT_PADDING_PX,
    );
    const measuredHeight = panelRef.current?.offsetHeight ?? PANEL_ESTIMATED_HEIGHT_PX;
    const { top, resolvedPlacement } = resolvePanelTop(rect, measuredHeight, placement);
    const maxHeight =
      resolvedPlacement === 'below'
        ? Math.max(240, window.innerHeight - top - VIEWPORT_PADDING_PX)
        : Math.max(240, rect.top - VIEWPORT_PADDING_PX);

    setPosition({ top, left, maxHeight, resolvedPlacement });
  }, [placement]);

  const handleToggle = useCallback(() => {
    if (disabled) {
      return;
    }
    setOpen((current) => !current);
  }, [disabled]);

  useLayoutEffect(() => {
    if (open) {
      updatePosition();
    }
  }, [open, updatePosition, selectedDate, selectedTime12.hour12, selectedTime12.minute, selectedTime12.period]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!triggerRef.current?.contains(target) && !panelRef.current?.contains(target)) {
        close();
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close();
      }
    };
    const handleReposition = () => updatePosition();
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleReposition, true);
    window.addEventListener('resize', handleReposition);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleReposition, true);
      window.removeEventListener('resize', handleReposition);
    };
  }, [close, open, updatePosition]);

  const applyTime12 = useCallback(
    (next: Time12) => {
      const day = selectedDate ?? minDay ?? startOfDay(new Date());
      const nextTime = toTime24(next);
      if (!isTimeAllowed(nextTime, minTimeForDay)) {
        return;
      }
      onChange(compose(day, nextTime));
    },
    [minDay, minTimeForDay, onChange, selectedDate],
  );

  const handleDaySelect = useCallback(
    (day: Date | undefined) => {
      if (!day) {
        return;
      }
      const minTime = min && isSameDay(day, min) ? toTimeValue(min) : undefined;
      const current = parseTime24(selectedTime) ?? defaultTime12();
      const candidate = toTime24(current);
      const nextTime = isTimeAllowed(candidate, minTime) ? candidate : minTime ?? '00:00';
      onChange(compose(day, nextTime));
    },
    [min, onChange, selectedTime],
  );

  const handleHourSelect = useCallback(
    (hourValue: string) => {
      applyTime12({ ...selectedTime12, hour12: Number.parseInt(hourValue, 10) });
    },
    [applyTime12, selectedTime12],
  );

  const handleMinuteSelect = useCallback(
    (minuteValue: string) => {
      applyTime12({ ...selectedTime12, minute: Number.parseInt(minuteValue, 10) });
    },
    [applyTime12, selectedTime12],
  );

  const handlePeriodSelect = useCallback(
    (periodValue: string) => {
      if (periodValue === 'AM' || periodValue === 'PM') {
        applyTime12({ ...selectedTime12, period: periodValue });
      }
    },
    [applyTime12, selectedTime12],
  );

  const handleTodayClick = useCallback(() => {
    const today = startOfDay(new Date());
    if (minDay && today < minDay) {
      return;
    }
    const minTime = min && isSameDay(today, min) ? toTimeValue(min) : undefined;
    const current = parseTime24(selectedTime) ?? defaultTime12();
    const candidate = toTime24(current);
    onChange(compose(today, isTimeAllowed(candidate, minTime) ? candidate : minTime ?? '00:00'));
  }, [min, minDay, onChange, selectedTime]);

  const handleClearClick = useCallback(() => {
    onChange('');
    close();
  }, [close, onChange]);

  const hourOptions = useMemo(
    () =>
      HOURS_12.map((hour) => {
        const candidate = toTime24({ ...selectedTime12, hour12: hour });
        return {
          value: String(hour),
          label: String(hour),
          disabled: !isTimeAllowed(candidate, minTimeForDay),
        };
      }),
    [minTimeForDay, selectedTime12],
  );

  const minuteOptions = useMemo(
    () =>
      MINUTES.map((minute) => {
        const candidate = toTime24({ ...selectedTime12, minute });
        return {
          value: String(minute),
          label: pad2(minute),
          disabled: !isTimeAllowed(candidate, minTimeForDay),
        };
      }),
    [minTimeForDay, selectedTime12],
  );

  const periodOptions = useMemo(
    () =>
      PERIODS.map((period) => {
        const candidate = toTime24({ ...selectedTime12, period });
        return {
          value: period,
          label: period,
          disabled: !isTimeAllowed(candidate, minTimeForDay),
        };
      }),
    [minTimeForDay, selectedTime12],
  );

  const dateLabel = useMemo(() => {
    if (!selectedDate) {
      return null;
    }
    return selectedDate.toLocaleDateString(undefined, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }, [selectedDate]);

  const timeLabel = useMemo(() => (selectedTime ? formatTimeLabel(selectedTime) : null), [selectedTime]);

  const summaryLabel = useMemo(() => {
    if (!dateLabel || !timeLabel) {
      return placeholder ?? '';
    }
    return `${dateLabel} · ${timeLabel}`;
  }, [dateLabel, placeholder, timeLabel]);

  const panel =
    open && position && typeof document !== 'undefined'
      ? createPortal(
          <div
            ref={panelRef}
            dir={dir}
            role="dialog"
            aria-label={copy.selectDate}
            style={{ top: position.top, left: position.left, maxHeight: position.maxHeight, width: Math.min(PANEL_WIDTH_PX, window.innerWidth - VIEWPORT_PADDING_PX * 2) }}
            className="fixed z-60 flex flex-col overflow-hidden rounded-xl border-0 bg-card text-card-foreground shadow-sm"
          >
            <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{copy.selectDate}</p>
                <p className="truncate text-sm font-semibold text-foreground">{summaryLabel || placeholder}</p>
              </div>
              <button
                type="button"
                className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label={copy.clear}
                onClick={close}
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>

            <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[1fr_auto]">
              <div className="border-b border-border p-3 lg:border-b-0 lg:border-e">
                <DayPicker
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDaySelect}
                  disabled={minDay ? { before: minDay } : undefined}
                  defaultMonth={selectedDate ?? minDay ?? new Date()}
                  startMonth={minDay}
                  showOutsideDays
                  dir={dir}
                  classNames={calendarClassNames}
                />
              </div>

              <div className="flex w-full flex-col p-3 lg:w-56">
                <div className="mb-2 flex items-center gap-2">
                  <Clock3 className="size-4 text-muted-foreground" aria-hidden />
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{timeAriaLabel}</p>
                </div>
                <div className="grid min-h-0 grid-cols-3 gap-2" aria-label={timeAriaLabel}>
                  <TimeColumn
                    label={copy.hour}
                    options={hourOptions}
                    activeValue={String(selectedTime12.hour12)}
                    onSelect={handleHourSelect}
                    testIdPrefix={testId ? `${testId}-hour` : undefined}
                    scrollable
                  />
                  <TimeColumn
                    label={copy.minute}
                    options={minuteOptions}
                    activeValue={String(selectedTime12.minute)}
                    onSelect={handleMinuteSelect}
                    testIdPrefix={testId ? `${testId}-minute` : undefined}
                    scrollable
                  />
                  <TimeColumn
                    label={copy.period}
                    options={periodOptions}
                    activeValue={selectedTime12.period}
                    onSelect={handlePeriodSelect}
                    testIdPrefix={testId ? `${testId}-period` : undefined}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 border-t border-border px-4 py-3">
              <button
                type="button"
                className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                onClick={handleClearClick}
              >
                {copy.clear}
              </button>
              <button
                type="button"
                className="rounded-md bg-secondary px-3 py-1.5 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80"
                onClick={handleTodayClick}
              >
                {copy.today}
              </button>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        data-testid={testId}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-invalid={ariaInvalid}
        dir={dir}
        className={cn(
          'flex w-full items-center gap-3 rounded-lg border border-border bg-background px-3 py-2.5 text-start transition-colors hover:border-primary/40 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-70',
          open && 'border-primary/50 ring-2 ring-ring/30',
          ariaInvalid && 'border-destructive/50',
        )}
      >
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className={cn('truncate text-sm font-medium', !summaryLabel && 'text-muted-foreground')}>
            {summaryLabel || placeholder}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 text-muted-foreground">
          <CalendarDays className="size-4" aria-hidden />
          <Clock3 className="size-4" aria-hidden />
        </div>
      </button>
      {panel}
    </>
  );
}
