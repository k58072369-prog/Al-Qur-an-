import { useMemo } from 'react';
import { getMushafEdition } from '../data/mushafEditions';
import { useAppStore } from '../store/AppStore';
import { ModuleId, TaskSelection } from '../types';
import { todayISO } from '../utils/helpers';
import { buildRanges } from '../utils/planLogic';

export function useModuleLogic(moduleId: string | string[] | undefined) {
  const { state } = useAppStore();
  const { plan, settings } = state;
  const id = Array.isArray(moduleId) ? moduleId[0] : moduleId;

  const todayPlanItem = useMemo(() => {
    if (!plan || !plan.targetPages || !id) return null;

    const _today = todayISO();
    const editionId =
      (plan as any).mushafEditionId ?? settings.mushafEdition ?? 'madani_604';
    const edition = getMushafEdition(editionId as any);
    const settingsActiveDays = (settings as any).activeDaysOfWeek ?? [
      0, 1, 2, 3, 4,
    ];

    const isDaily = plan.planMode === 'daily';
    const activeDows = new Set(
      isDaily
        ? [0, 1, 2, 3, 4, 5, 6]
        : (plan.activeDaysOfWeek ?? settingsActiveDays),
    );

    if (!activeDows.has(new Date().getDay())) return null;

    const startDate = plan.startDate ?? _today;
    const [y, m, d] = startDate.split('-').map(Number);
    let current = new Date(y, m - 1, d);
    let todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    let activeDayIndex = -1;
    let iterations = 0;
    while (current <= todayDate && iterations < 3650) {
      if (activeDows.has(current.getDay())) {
        activeDayIndex++;
      }
      current.setDate(current.getDate() + 1);
      iterations++;
    }

    if (activeDayIndex < 0 || activeDayIndex >= plan.totalDays) return null;

    const i = activeDayIndex;
    const startIdx = i * plan.pagesPerDay;
    const dayPages = plan.targetPages.slice(
      startIdx,
      startIdx + plan.pagesPerDay,
    );
    if (dayPages.length === 0) return null;

    const alreadyDone = plan.targetPages.slice(0, startIdx);

    // Map module ID to specific range logic
    let pages: number[] = [];
    if (id === 'memorization' || id === 'preparation_before') {
      pages = dayPages;
    } else if (id === 'preparation_night') {
      pages = plan.targetPages.slice(
        (i + 1) * plan.pagesPerDay,
        (i + 2) * plan.pagesPerDay,
      );
    } else if (id === 'preparation_weekly') {
      pages = plan.targetPages.slice(
        (i + 7) * plan.pagesPerDay,
        (i + 14) * plan.pagesPerDay,
      );
    } else if (id === 'listening') {
      const listenStart = ((i * 10) % edition.totalPages) + 1;
      const listenEnd = ((listenStart + 9 - 1) % edition.totalPages) + 1;
      // Handle page wrap around for listening
      if (listenEnd >= listenStart) {
        for (let p = listenStart; p <= listenEnd; p++) pages.push(p);
      } else {
        for (let p = listenStart; p <= edition.totalPages; p++) pages.push(p);
        for (let p = 1; p <= listenEnd; p++) pages.push(p);
      }
    } else if (id === 'recitation') {
      const wardStart = ((i * 40) % edition.totalPages) + 1;
      const wardEnd = ((wardStart + 39 - 1) % edition.totalPages) + 1;
      if (wardEnd >= wardStart) {
        for (let p = wardStart; p <= wardEnd; p++) pages.push(p);
      } else {
        for (let p = wardStart; p <= edition.totalPages; p++) pages.push(p);
        for (let p = 1; p <= wardEnd; p++) pages.push(p);
      }
    } else if (id === 'review_short') {
      pages = alreadyDone.slice(Math.max(0, alreadyDone.length - 20));
    } else if (id === 'review_long') {
      pages = alreadyDone.slice(
        Math.max(0, alreadyDone.length - 60),
        Math.max(0, alreadyDone.length - 20),
      );
    }

    if (pages.length === 0) return null;
    return {
      ranges: buildRanges(pages),
      moduleTitle:
        id === 'memorization'
          ? 'حفظ اليوم'
          : id === 'listening'
            ? 'استماع اليوم'
            : id === 'recitation'
              ? 'تلاوة اليوم'
              : id?.includes('preparation')
                ? 'تحضير اليوم'
                : 'مراجعة اليوم',
    };
  }, [plan, settings, id]);

  const getPagesFromTask = (task: TaskSelection | null) => {
    if (!task) return [];
    const pages: number[] = [];
    task.ranges.forEach((r) => {
      for (let p = r.start; p <= r.end; p++) pages.push(p);
    });
    return Array.from(new Set(pages)).sort((a, b) => a - b);
  };

  const getRecommendedTime = (mId: string) => {
    switch (mId) {
      case 'recitation':
        return (settings.recitationTimerMinutes || 20) * 60;
      case 'listening':
        return (settings.listeningTimerMinutes || 15) * 60;
      case 'preparation_night':
      case 'preparation_before':
      case 'preparation_weekly':
        return (settings.preparationTimerMinutes || 15) * 60;
      case 'memorization':
        return (settings.memorizationTimerMinutes || 20) * 60;
      case 'review_short':
      case 'review_long':
        return (settings.reviewTimerMinutes || 15) * 60;
      default:
        return 15 * 60;
    }
  };

  return {
    todayPlanItem,
    getPagesFromTask,
    getRecommendedTime,
  };
}
