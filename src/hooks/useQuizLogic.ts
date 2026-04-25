import { useState, useMemo } from 'react';
import { useAppStore } from '../store/AppStore';
import { QuranStore } from '../store/QuranStore';
import { SURAHS } from '../data/quranMeta';
import { todayISO } from '../utils/helpers';

export function useQuizLogic() {
  const { state, getMemorizedPages, dispatch } = useAppStore();
  const memorizedPages = useMemo(() => getMemorizedPages(), [state.pageProgress, getMemorizedPages]);

  const [sessionStarted, setSessionStarted] = useState(false);
  const [quizScope, setQuizScope] = useState<"all" | "today">("all");
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);

  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const generateQuestion = async (specificPages?: any[]): Promise<any> => {
    const pagesToFilter = specificPages || memorizedPages;
    if (pagesToFilter.length === 0) return null;

    try {
      const pool = pagesToFilter.map((p) => {
        const prog = state.pageProgress.find(
          (pp) => pp.pageNumber === p.pageNumber,
        );
        const weight = 6 - (prog?.strength ?? 3);
        return { page: p, weight };
      });

      const totalWeight = pool.reduce((sum, item) => sum + item.weight, 0);

      let attempts = 0;
      while (attempts < 10) {
        attempts++;

        let random = Math.random() * totalWeight;
        let selectedPageObj = pool[0].page;
        for (const item of pool) {
          if (random < item.weight) {
            selectedPageObj = item.page;
            break;
          }
          random -= item.weight;
        }

        const verses = await QuranStore.getVerses(selectedPageObj.pageNumber);
        if (verses.length < 4) continue;

        const gapSize = Math.random() > 0.5 ? 3 : 5;
        const totalNeeded = gapSize + 2;
        if (verses.length < totalNeeded) continue;

        const startIdx = Math.floor(
          Math.random() * (verses.length - (totalNeeded - 1)),
        );
        const startVerse = verses[startIdx];
        const gapVerses = verses.slice(startIdx + 1, startIdx + gapSize + 1);
        const targetVerse = verses[startIdx + gapSize + 1];

        const surah = SURAHS.find(
          (s) =>
            selectedPageObj.pageNumber >= s.startPage &&
            selectedPageObj.pageNumber <= s.endPage,
        );

        return {
          startVerse,
          gapVerses,
          targetVerse,
          surahName: surah?.nameAr,
          gapSize,
          pageNumber: selectedPageObj.pageNumber,
        };
      }
      return null;
    } catch (e) {
      console.error("Error generating question", e);
      return null;
    }
  };

  const loadNextQuestion = async (index: number, specificPages?: any[]) => {
    setIsLoading(true);
    setShowAnswer(false);
    const q = await generateQuestion(specificPages);
    setCurrentQuestion(q);
    setIsLoading(false);
  };

  const startQuiz = (scope: "all" | "today") => {
    let pagesToUse = [...memorizedPages];

    if (scope === "today") {
      const today = todayISO();
      pagesToUse = memorizedPages.filter((p) => {
        const prog = state.pageProgress.find(
          (pp) => pp.pageNumber === p.pageNumber,
        );
        return prog?.lastReviewed === today;
      });
    }

    if (pagesToUse.length === 0) {
      alert(
        scope === "today"
          ? "لم تقم بحفظ أو مراجعة أي صفحات اليوم بعد."
          : "لا يوجد محفوظ للاختبار.",
      );
      return;
    }

    setQuizScope(scope);
    let count = 5;
    if (pagesToUse.length > 50) count = 20;
    else if (pagesToUse.length > 20) count = 15;
    else if (pagesToUse.length > 10) count = 10;
    else count = Math.max(3, Math.min(pagesToUse.length, 5));

    setTotalQuestions(count);
    setCurrentIndex(0);
    setCorrectCount(0);
    setFinished(false);
    setSessionStarted(true);
    loadNextQuestion(0, pagesToUse);
  };

  const handleResponse = (isCorrect: boolean) => {
    if (currentQuestion?.pageNumber) {
      dispatch({
        type: "REVIEW_PAGE",
        payload: { pageNumber: currentQuestion.pageNumber, passed: isCorrect },
      });
    }

    if (isCorrect) setCorrectCount((prev) => prev + 1);

    const nextIndex = currentIndex + 1;
    if (nextIndex < totalQuestions) {
      setCurrentIndex(nextIndex);

      let pagesToUse = [...memorizedPages];
      if (quizScope === "today") {
        const today = todayISO();
        pagesToUse = memorizedPages.filter((p) => {
          const prog = state.pageProgress.find(
            (pp) => pp.pageNumber === p.pageNumber,
          );
          return prog?.lastReviewed === today;
        });
      }
      loadNextQuestion(nextIndex, pagesToUse);
    } else {
      setFinished(true);
    }
  };

  return {
    memorizedPages,
    sessionStarted,
    quizScope,
    totalQuestions,
    currentIndex,
    correctCount,
    finished,
    currentQuestion,
    showAnswer,
    setShowAnswer,
    isLoading,
    startQuiz,
    handleResponse
  };
}
