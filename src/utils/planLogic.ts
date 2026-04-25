import { MushafEdition } from "../data/mushafEditions";
import { SURAHS } from "../data/quranMeta";
import { toArabicNumerals } from "./helpers";

export interface SurahSegment {
  surahId: number;
  nameAr: string;
  pages: number[];
}

export function buildRanges(pages: number[]): { start: number; end: number }[] {
  if (!pages.length) return [];
  const res: { start: number; end: number }[] = [];
  let s = pages[0],
    e = pages[0];
  for (let i = 1; i < pages.length; i++) {
    if (pages[i] === e + 1) {
      e = pages[i];
    } else {
      res.push({ start: s, end: e });
      s = pages[i];
      e = pages[i];
    }
  }
  res.push({ start: s, end: e });
  return res;
}

export function formatRanges(ranges: { start: number; end: number }[]): string {
  return ranges
    .map((r) =>
      r.start === r.end
        ? toArabicNumerals(r.start)
        : `${toArabicNumerals(r.start)}-${toArabicNumerals(r.end)}`,
    )
    .join(" و ");
}

export function getSurahSegments(
  pages: number[],
  edition: MushafEdition,
): SurahSegment[] {
  const pageSet = new Set(pages);
  const segments: SurahSegment[] = [];

  const surahEntries = Object.entries(edition.surahPages)
    .map(([id, [s, e]]) => ({ id: Number(id), startPage: s, endPage: e }))
    .sort((a, b) => a.id - b.id);

  surahEntries.forEach(({ id, startPage, endPage }) => {
    const surahPages: number[] = [];
    for (let p = startPage; p <= endPage; p++) {
      if (pageSet.has(p)) surahPages.push(p);
    }
    if (surahPages.length > 0) {
      const surahMeta = SURAHS.find((s) => s.id === id);
      segments.push({
        surahId: id,
        nameAr: surahMeta?.nameAr ?? `سورة ${id}`,
        pages: surahPages,
      });
    }
  });

  return segments;
}

export function buildWeeklyCalendar(
  plan: any,
  roadmap: any[],
  settingsActiveDays: number[],
): any[] {
  const isDaily = plan?.planMode === 'daily';
  const activeDows = new Set<number>(
    isDaily
      ? [0, 1, 2, 3, 4, 5, 6]
      : (plan?.activeDaysOfWeek ?? settingsActiveDays ?? [0, 1, 2, 3, 4]),
  );

  if (activeDows.size === 0) return [];

  // Parse the plan start date — handle timezone-safe parsing
  const rawDate = plan.startDate ?? new Date().toISOString().split('T')[0];
  const [y, m, d] = rawDate.split('-').map(Number);
  const startDate = new Date(y, m - 1, d);
  const startDow = startDate.getDay(); // 0=Sun..6=Sat

  const groups: any[] = [];
  let roadmapIdx = 0;
  let calDay = 0;

  while (roadmapIdx < roadmap.length) {
    const weekDays: any[] = [];
    let weekHasActive = false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 7; i++) {
      const dow = (startDow + calDay) % 7;

      const dayDate = new Date(startDate);
      dayDate.setDate(startDate.getDate() + calDay);
      dayDate.setHours(0, 0, 0, 0);
      const isToday = dayDate.getTime() === today.getTime();

      if (activeDows.has(dow) && roadmapIdx < roadmap.length) {
        weekDays.push({
          type: 'active',
          item: roadmap[roadmapIdx],
          dow,
          isToday,
        });
        roadmapIdx++;
        weekHasActive = true;
      } else {
        weekDays.push({ type: 'rest', dow, isToday });
      }
      calDay++;
    }

    if (!weekHasActive) break; // Safety guard

    const completedCount = weekDays.filter(
      (d) => d.type === 'active' && d.item.isCompleted,
    ).length;
    const totalActiveCount = weekDays.filter((d) => d.type === 'active').length;
    const isCurrentWeek = weekDays.some(
      (d) => d.type === 'active' && d.item.isCurrent,
    );

    groups.push({
      weekNumber: groups.length + 1,
      days: weekDays,
      isCurrentWeek,
      completedCount,
      totalActiveCount,
    });
  }

  return groups;
}
