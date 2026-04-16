import { Plan, PageProgress, TOTAL_QURAN_PAGES, DailyProgress } from '../types';
import { todayISO, addDays } from '../utils/helpers';

/**
 * Service to calculate daily tasks based on the "Quran Anchoring Keys" (مفاتيح تثبيت القرآن) method.
 */
export const KhumasiHifzService = {
  /**
   * Fortress 1A: Khatma Recitation (2 Juzs daily / 40 pages)
   * A full cycle of the Quran every 15 days.
   */
  getKhatmaRecitationPages(dayIndex: number): { start: number; end: number } {
    const cycleDay = dayIndex % 15;
    const startPage = cycleDay * 40 + 1;
    let endPage = startPage + 39;
    
    if (endPage > TOTAL_QURAN_PAGES) endPage = TOTAL_QURAN_PAGES;
    return { start: startPage, end: endPage };
  },

  /**
   * Fortress 1B: Khatma Listening (1 Hizb daily / 10 pages)
   * A full cycle of the Quran every 60 days.
   */
  getKhatmaListeningPages(dayIndex: number): { start: number; end: number } {
    const cycleDay = dayIndex % 60;
    const startPage = cycleDay * 10 + 1;
    let endPage = startPage + 9;
    
    if (endPage > TOTAL_QURAN_PAGES) endPage = TOTAL_QURAN_PAGES;
    return { start: startPage, end: endPage };
  },

  /**
   * Fortress 2A: Weekly Preparation
   * Reading the pages scheduled for the NEXT 7 days of the plan.
   */
  getWeeklyPrepPages(plan: Plan | null): { start: number; end: number } | null {
    if (!plan || plan.targetPages.length === 0) return null;
    const currentPage = plan.targetPages[plan.currentPageIndex] || plan.targetPages[0];
    const endPage = plan.targetPages[plan.targetPages.length - 1];
    
    const start = currentPage + plan.pagesPerDay; // Start from tomorrow's page
    const end = start + (plan.pagesPerDay * 7) - 1;
    return { 
      start: Math.min(start, endPage), 
      end: Math.min(end, endPage) 
    };
  },

  /**
   * Fortress 2B: Night Preparation (Page of tomorrow)
   */
  getNightPrepPage(plan: Plan | null): number | null {
    if (!plan || plan.targetPages.length === 0) return null;
    const currentPage = plan.targetPages[plan.currentPageIndex] || plan.targetPages[0];
    const endPage = plan.targetPages[plan.targetPages.length - 1];
    return Math.min(currentPage + plan.pagesPerDay, endPage);
  },

  /**
   * Fortress 4: Short-term Review (Last Juz / ~20 pages)
   */
  getNearReviewPages(pageProgress: PageProgress[]): number[] {
    const memorized = pageProgress
      .filter(p => p.memorized)
      .sort((a, b) => b.pageNumber - a.pageNumber); // Last memorized first
      
    if (memorized.length === 0) return [];
    
    // Last 20 pages memorized
    return memorized.slice(0, 20).map(p => p.pageNumber).sort((a, b) => a - b);
  },

  /**
   * Helper to calculate day index since a reference date
   */
  getDayIndex(startDate: string): number {
    const start = new Date(startDate).getTime();
    const now = new Date().getTime();
    return Math.floor((now - start) / (1000 * 60 * 60 * 24));
  }
};
