import {
  PageProgress,
  MemorizationStrength,
  TOTAL_QURAN_PAGES,
  Plan,
  PlanDirection,
} from '../types';

// ─── Date Helpers ─────────────────────────────────────────

export function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

export function addDays(date: string, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export function daysBetween(dateA: string, dateB: string): number {
  const a = new Date(dateA).getTime();
  const b = new Date(dateB).getTime();
  return Math.round(Math.abs(a - b) / (1000 * 60 * 60 * 24));
}

export function isToday(date: string): boolean {
  return date === todayISO();
}

export function isOverdue(nextReviewDate: string): boolean {
  return nextReviewDate <= todayISO();
}

// ─── Plan Generator ───────────────────────────────────────

export function generatePlan(
  pageNumbers: number[],
  pagesPerDay: number,
  label: string = 'خطة حفظ',
  direction: PlanDirection = 'forward'
): Plan {
  const orderedPages = direction === 'forward' ? [...pageNumbers] : [...pageNumbers].reverse();
  const totalDays = Math.ceil(orderedPages.length / pagesPerDay);
  return {
    targetPages: orderedPages,
    currentPageIndex: 0,
    pagesPerDay,
    totalDays,
    startDate: todayISO(),
    direction,
    label,
  };
}

// ─── Spaced Repetition ────────────────────────────────────

export function getNextReviewDate(
  strength: MemorizationStrength,
  today: string = todayISO()
): string {
  const intervals: Record<MemorizationStrength, number> = {
    1: 1,
    2: 1,
    3: 2,
    4: 7,
    5: 14,
  };
  return addDays(today, intervals[strength]);
}

export function strengthAfterReview(
  currentStrength: MemorizationStrength,
  passed: boolean
): MemorizationStrength {
  if (passed) {
    return Math.min(5, currentStrength + 1) as MemorizationStrength;
  } else {
    return Math.max(1, currentStrength - 1) as MemorizationStrength;
  }
}

// ─── Pages Due for Review ─────────────────────────────────

export function getPagesDueForReview(pages: PageProgress[]): PageProgress[] {
  const today = todayISO();
  return pages
    .filter((p) => p.memorized && p.nextReviewDate <= today)
    .sort((a, b) => a.strength - b.strength); // Weakest first
}

// ─── XP & Title ───────────────────────────────────────────

export function getTitleFromXP(xp: number): string {
  if (xp >= 5000) return 'حافظ';
  if (xp >= 2000) return 'سيد';
  if (xp >= 500) return 'حارس';
  return 'مبتدئ';
}

export function getXPProgressToNextLevel(xp: number): {
  current: number;
  required: number;
  percentage: number;
} {
  const levels = [0, 500, 2000, 5000, 99999];
  for (let i = 0; i < levels.length - 1; i++) {
    if (xp < levels[i + 1]) {
      const current = xp - levels[i];
      const required = levels[i + 1] - levels[i];
      return { current, required, percentage: current / required };
    }
  }
  return { current: 0, required: 1, percentage: 1 };
}

// ─── Daily Completion ─────────────────────────────────────

export function getDailyCompletionPercent(progress: {
  recitation: boolean;
  listening: boolean;
  preparation: boolean;
  memorization: boolean;
  shortReview: boolean;
  longReview: boolean;
}): number {
  const tasks = Object.values(progress);
  const done = tasks.filter(Boolean).length;
  return done / tasks.length;
}

// ─── Streak Logic ─────────────────────────────────────────

export function calculateStreak(
  currentStreak: number,
  longestStreak: number,
  lastActiveDate: string,
  completedToday: boolean
): { current: number; longest: number; lastActiveDate: string } {
  const today = todayISO();
  const yesterday = addDays(today, -1);

  if (completedToday && lastActiveDate === yesterday) {
    // Continuing streak
    const newCurrent = currentStreak + 1;
    return {
      current: newCurrent,
      longest: Math.max(longestStreak, newCurrent),
      lastActiveDate: today,
    };
  } else if (completedToday && lastActiveDate === today) {
    // Already updated today
    return { current: currentStreak, longest: longestStreak, lastActiveDate: today };
  } else if (!completedToday && lastActiveDate < yesterday) {
    // Streak broken
    return { current: 0, longest: longestStreak, lastActiveDate: lastActiveDate };
  }

  return { current: currentStreak, longest: longestStreak, lastActiveDate: lastActiveDate };
}

// ─── Arabic Number Formatter ──────────────────────────────

export function toArabicNumerals(num: number): string {
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return num
    .toString()
    .split('')
    .map((d) => arabicDigits[parseInt(d)] ?? d)
    .join('');
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ─── Motivational Messages ────────────────────────────────

export const MOTIVATIONAL_MESSAGES = [
  'كُلُّ لحظةٍ تتلو فيها كلامَ الله تُقرَّب إليه',
  'الحافظ الصادق يعيش مع كلام الله في قلبه',
  'الاستمرار أعظم من الإتقان... فلا تقطع',
  'ما تعلمته اليوم يبقى معك إلى الآخرة',
  'كُن حارسًا لحصنك اليوم',
  'كُلُّ يومٍ بلا مراجعةٍ هو يومٌ في الغفلة',
  'القرآن شراكتك مع الله، لا تقطعها',
  'الثبات على القليل خيرٌ من الانقطاع عن الكثير',
  'ادفع الكسلَ بالتذكّر: من تحفظ لأجله؟',
  'نِعمَ الجليسُ كتابُ الله',
];

export function getMotivationalMessage(): string {
  const idx = new Date().getDate() % MOTIVATIONAL_MESSAGES.length;
  return MOTIVATIONAL_MESSAGES[idx];
}
