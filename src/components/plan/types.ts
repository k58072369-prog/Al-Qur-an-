// ─── Shared Types for Plan Components ────────────────────────────────────────

export type DayTask = {
  id: string;
  label: string;
  icon: any;
  color: string;
};

export type SurahSegment = {
  surahId: number;
  nameAr: string;
  pages: number[];
};

export type DayItem = {
  dayIndex: number;
  pageNumbers: number[];
  ranges: { start: number; end: number }[];
  surahSegments: SurahSegment[];
  surahLabel: string;
  isCurrent: boolean;
  isCompleted: boolean;
  completionPct: number;
  tasks: DayTask[];
  date?: string;
  isLocked?: boolean;
};

// ─── Weekly Calendar Types ────────────────────────────────────────────────────

export type WeekCalendarDay =
  | { type: "active"; item: DayItem; dow: number; isToday?: boolean }
  | { type: "rest"; dow: number; isToday?: boolean };

export type WeekGroup = {
  weekNumber: number;
  days: WeekCalendarDay[];
  isCurrentWeek: boolean;
  completedCount: number;
  totalActiveCount: number;
};
