import { useMemo } from 'react';
import { useAppStore } from '../store/AppStore';
import { JUZ_META } from '../data/quranMeta';
import { calculateStabilityIndex, getXPProgressToNextLevel } from '../utils/helpers';
import { MemorizationStrength } from '../types';

export function useProgressLogic() {
  const { state, getMemorizedPages } = useAppStore();
  const { user, plan, streak, taskSelections } = state;
  
  const memorizedPages = useMemo(() => getMemorizedPages(), [getMemorizedPages]);
  
  const xpProgress = useMemo(() => getXPProgressToNextLevel(user?.totalXP ?? 0), [user?.totalXP]);
  
  const totalPages = plan ? plan.targetPages.length : 604;
  const planPct = totalPages > 0 ? memorizedPages.length / totalPages : 0;
  const totalXP = user?.totalXP ?? 0;

  const juzProgress = useMemo(() => {
    return JUZ_META.map((juz) => {
      const pagesInJuz = Array.from(
        { length: juz.endPage - juz.startPage + 1 },
        (_, i) => juz.startPage + i,
      );
      const memorizedInJuz = pagesInJuz.filter((p) =>
        memorizedPages.some((mp) => mp.pageNumber === p),
      );
      const pct = memorizedInJuz.length / pagesInJuz.length;
      return { id: juz.id, pct };
    });
  }, [memorizedPages]);

  const { strengthDist, masteredCount, weakCount } = useMemo(() => {
    const dist: Record<MemorizationStrength, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    memorizedPages.forEach((p) => {
      dist[p.strength as MemorizationStrength]++;
    });
    return {
      strengthDist: dist,
      masteredCount: dist[5] + dist[4],
      weakCount: dist[1] + dist[2]
    };
  }, [memorizedPages]);

  const stabilityIndex = useMemo(() => 
    calculateStabilityIndex(memorizedPages, taskSelections),
  [memorizedPages, taskSelections]);

  const remainingCount = totalPages - memorizedPages.length;
  const daysRemaining = Math.max(1, Math.ceil(remainingCount / (user?.dailyPages || 1)));
  
  const finishDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + daysRemaining);
    return date;
  }, [daysRemaining]);

  const getJuzStability = (juzId: number) => {
    const juzMeta = JUZ_META[juzId - 1];
    const pagesInJuz = memorizedPages.filter(
      (p) => p.pageNumber >= juzMeta.startPage && p.pageNumber <= juzMeta.endPage,
    );
    return calculateStabilityIndex(pagesInJuz, taskSelections);
  };

  return {
    user,
    streak,
    memorizedPages,
    xpProgress,
    totalXP,
    planPct,
    juzProgress,
    stabilityIndex,
    masteredCount,
    weakCount,
    remainingCount,
    daysRemaining,
    finishDate,
    getJuzStability
  };
}
