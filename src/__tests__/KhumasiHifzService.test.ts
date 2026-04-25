/**
 * KhumasiHifzService.test.ts  (extended)
 * Tests the core daily ward calculation logic — the scheduling heart of the app.
 * A single wrong calculation here means users get wrong pages for the entire day.
 */

import { KhumasiHifzService } from '../store/KhumasiHifzService';
import { Plan, PageProgress, MemorizationStrength } from '../types';
import { todayISO } from '../utils/helpers';

// ─── SECTION 1: Khatma Recitation (already tested — expanded edge cases) ──────
describe('getKhatmaRecitationPages', () => {
  it('day 0: pages 1–40', () => {
    expect(KhumasiHifzService.getKhatmaRecitationPages(0)).toEqual({ start: 1, end: 40 });
  });

  it('day 1: pages 41–80', () => {
    expect(KhumasiHifzService.getKhatmaRecitationPages(1)).toEqual({ start: 41, end: 80 });
  });

  it('day 14: pages 561–600', () => {
    expect(KhumasiHifzService.getKhatmaRecitationPages(14)).toEqual({ start: 561, end: 600 });
  });

  it('cycles every 15 days — day 15 equals day 0', () => {
    expect(KhumasiHifzService.getKhatmaRecitationPages(15))
      .toEqual(KhumasiHifzService.getKhatmaRecitationPages(0));
  });

  it('never exceeds 604 pages (last day of cycle caps at 604)', () => {
    // day 14: start=561, end=600 — fine
    // if there were a day that would go beyond 604, it caps
    const result = KhumasiHifzService.getKhatmaRecitationPages(14);
    expect(result.end).toBeLessThanOrEqual(604);
  });
});

// ─── SECTION 2: Khatma Listening (already tested — expanded edge cases) ───────
describe('getKhatmaListeningPages', () => {
  it('day 0: pages 1–10', () => {
    expect(KhumasiHifzService.getKhatmaListeningPages(0)).toEqual({ start: 1, end: 10 });
  });

  it('day 59: pages 591–600', () => {
    expect(KhumasiHifzService.getKhatmaListeningPages(59)).toEqual({ start: 591, end: 600 });
  });

  it('cycles every 60 days — day 60 equals day 0', () => {
    expect(KhumasiHifzService.getKhatmaListeningPages(60))
      .toEqual(KhumasiHifzService.getKhatmaListeningPages(0));
  });

  it('all results are within 1–604', () => {
    for (let d = 0; d < 60; d++) {
      const r = KhumasiHifzService.getKhatmaListeningPages(d);
      expect(r.start).toBeGreaterThanOrEqual(1);
      expect(r.end).toBeLessThanOrEqual(604);
      expect(r.start).toBeLessThanOrEqual(r.end);
    }
  });
});

// ─── SECTION 3: Weekly Preparation ───────────────────────────────────────────
describe('getWeeklyPrepPages', () => {
  const basePlan: Plan = {
    targetPages: Array.from({ length: 100 }, (_, i) => i + 1), // pages 1–100
    currentPageIndex: 0,
    pagesPerDay: 1,
    totalDays: 100,
    startDate: todayISO(),
    direction: 'forward',
    label: 'Test Plan',
  };

  it('returns null when plan is null', () => {
    expect(KhumasiHifzService.getWeeklyPrepPages(null)).toBeNull();
  });

  it('returns null when targetPages is empty', () => {
    expect(KhumasiHifzService.getWeeklyPrepPages({ ...basePlan, targetPages: [] })).toBeNull();
  });

  it('returns pages for the next 7 days (pagesPerDay=1)', () => {
    // currentPageIndex=0, page=1, pagesPerDay=1
    // start = page(1) + pagesPerDay(1) = 2 (tomorrow)
    // end   = 2 + (1*7) - 1 = 8
    const result = KhumasiHifzService.getWeeklyPrepPages(basePlan);
    expect(result).not.toBeNull();
    expect(result!.start).toBe(2);
    expect(result!.end).toBe(8);
  });

  it('works with pagesPerDay=2 (2 pages per day × 7 = 14 pages ahead)', () => {
    const plan: Plan = { ...basePlan, pagesPerDay: 2 };
    // currentPage = targetPages[0] = 1
    // start = 1 + 2 = 3
    // end   = 3 + (2*7) - 1 = 16
    const result = KhumasiHifzService.getWeeklyPrepPages(plan);
    expect(result!.start).toBe(3);
    expect(result!.end).toBe(16);
  });

  it('clamps end to last page of plan', () => {
    // Plan with only 5 pages, pagesPerDay=1, currentPageIndex=3
    const shortPlan: Plan = {
      ...basePlan,
      targetPages: [1, 2, 3, 4, 5],
      currentPageIndex: 3,
      pagesPerDay: 1,
    };
    // currentPage = 4, start = 5, end = 5 + 7 - 1 = 11 → clamped to 5
    const result = KhumasiHifzService.getWeeklyPrepPages(shortPlan);
    expect(result!.end).toBe(5); // capped at last page
  });
});

// ─── SECTION 4: Night Preparation ────────────────────────────────────────────
describe('getNightPrepPage', () => {
  const basePlan: Plan = {
    targetPages: Array.from({ length: 50 }, (_, i) => i + 1),
    currentPageIndex: 0,
    pagesPerDay: 1,
    totalDays: 50,
    startDate: todayISO(),
    direction: 'forward',
    label: 'Test',
  };

  it('returns null when plan is null', () => {
    expect(KhumasiHifzService.getNightPrepPage(null)).toBeNull();
  });

  it('returns the next page (tomorrow\'s page)', () => {
    // currentPage = targetPages[0] = 1, tomorrow = 1 + 1 = 2
    expect(KhumasiHifzService.getNightPrepPage(basePlan)).toBe(2);
  });

  it('clamps to last page when near end of plan', () => {
    const plan: Plan = { ...basePlan, currentPageIndex: 49, pagesPerDay: 1 }; // last page
    // currentPage = targetPages[49] = 50, tomorrow = 51 → clamped to 50
    expect(KhumasiHifzService.getNightPrepPage(plan)).toBe(50);
  });

  it('works with pagesPerDay=2', () => {
    const plan: Plan = { ...basePlan, pagesPerDay: 2 };
    // currentPage = 1, tomorrow = 1 + 2 = 3
    expect(KhumasiHifzService.getNightPrepPage(plan)).toBe(3);
  });
});

// ─── SECTION 5: Near Review Pages ────────────────────────────────────────────
describe('getNearReviewPages', () => {
  it('returns empty array when no pages are memorized', () => {
    const pages: PageProgress[] = [
      { pageNumber: 1, memorized: false, strength: 1, lastReviewed: '', reviewCount: 0, nextReviewDate: '' },
    ];
    expect(KhumasiHifzService.getNearReviewPages(pages)).toEqual([]);
  });

  it('returns the last 20 memorized pages (most recent first, then sorted asc)', () => {
    // Create 25 memorized pages
    const pages: PageProgress[] = Array.from({ length: 25 }, (_, i) => ({
      pageNumber: i + 1,
      memorized: true,
      strength: 1 as MemorizationStrength,
      lastReviewed: todayISO(),
      reviewCount: 1,
      nextReviewDate: todayISO(),
    }));

    const result = KhumasiHifzService.getNearReviewPages(pages);
    expect(result).toHaveLength(20); // capped at 20
    // Should be the highest 20 pages (6–25) sorted ascending
    expect(result[0]).toBe(6);
    expect(result[19]).toBe(25);
  });

  it('returns all memorized pages if fewer than 20', () => {
    const pages: PageProgress[] = Array.from({ length: 10 }, (_, i) => ({
      pageNumber: i + 1,
      memorized: true,
      strength: 2 as MemorizationStrength,
      lastReviewed: todayISO(),
      reviewCount: 1,
      nextReviewDate: todayISO(),
    }));

    const result = KhumasiHifzService.getNearReviewPages(pages);
    expect(result).toHaveLength(10);
  });

  it('ignores unmemorized pages', () => {
    const pages: PageProgress[] = [
      { pageNumber: 1, memorized: true, strength: 1, lastReviewed: '', reviewCount: 0, nextReviewDate: '' },
      { pageNumber: 2, memorized: false, strength: 1, lastReviewed: '', reviewCount: 0, nextReviewDate: '' },
      { pageNumber: 3, memorized: true, strength: 1, lastReviewed: '', reviewCount: 0, nextReviewDate: '' },
    ];
    const result = KhumasiHifzService.getNearReviewPages(pages);
    expect(result).toHaveLength(2);
    expect(result).not.toContain(2);
  });
});

// ─── SECTION 6: getDayIndex ───────────────────────────────────────────────────
describe('getDayIndex', () => {
  it('returns 0 for today as start date', () => {
    expect(KhumasiHifzService.getDayIndex(todayISO())).toBe(0);
  });

  it('returns approximately 7 for a week ago start date', () => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const dateStr = weekAgo.toISOString().split('T')[0];
    const idx = KhumasiHifzService.getDayIndex(dateStr);
    expect(idx).toBeGreaterThanOrEqual(7);
    expect(idx).toBeLessThanOrEqual(8); // allow for timezone differences
  });
});
