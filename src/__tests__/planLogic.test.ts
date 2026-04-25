import { buildRanges, formatRanges } from '../utils/planLogic';

describe('planLogic', () => {
  describe('buildRanges', () => {
    it('should group consecutive pages into ranges', () => {
      const pages = [1, 2, 3, 5, 6, 8];
      const result = buildRanges(pages);
      expect(result).toEqual([
        { start: 1, end: 3 },
        { start: 5, end: 6 },
        { start: 8, end: 8 },
      ]);
    });

    it('should return empty array for empty pages', () => {
      expect(buildRanges([])).toEqual([]);
    });

    it('should handle single page', () => {
      expect(buildRanges([10])).toEqual([{ start: 10, end: 10 }]);
    });
  });

  describe('formatRanges', () => {
    it('should format ranges into Arabic numerals and join with "و"', () => {
      const ranges = [
        { start: 1, end: 3 },
        { start: 5, end: 5 },
      ];
      // Note: toArabicNumerals(1) -> '١', etc.
      const result = formatRanges(ranges);
      expect(result).toContain('١-٣');
      expect(result).toContain('٥');
      expect(result).toContain(' و ');
    });
  });

  describe('getSurahSegments', () => {
    // Mock edition for testing
    const mockEdition: any = {
      surahPages: {
        1: [1, 1],
        2: [2, 49],
        113: [604, 604],
        114: [604, 604],
      }
    };

    it('should extract segments correctly for a single surah', () => {
      // Import the function dynamically if needed or just use it if already imported
      const { getSurahSegments } = require('../utils/planLogic');
      const segments = getSurahSegments([2, 3, 4], mockEdition);
      
      expect(segments).toHaveLength(1);
      expect(segments[0].surahId).toBe(2);
      expect(segments[0].pages).toEqual([2, 3, 4]);
    });

    it('should split pages into multiple segments when crossing surahs', () => {
      const { getSurahSegments } = require('../utils/planLogic');
      const segments = getSurahSegments([1, 2, 3], mockEdition);
      
      expect(segments).toHaveLength(2);
      expect(segments[0].surahId).toBe(1); // Fatiha
      expect(segments[0].pages).toEqual([1]);
      
      expect(segments[1].surahId).toBe(2); // Baqarah
      expect(segments[1].pages).toEqual([2, 3]);
    });

    it('should group shared pages under all matching surahs', () => {
      const { getSurahSegments } = require('../utils/planLogic');
      const segments = getSurahSegments([604], mockEdition);
      
      // Page 604 contains both Surah 113 and 114
      expect(segments).toHaveLength(2);
      expect(segments[0].surahId).toBe(113);
      expect(segments[0].pages).toEqual([604]);
      
      expect(segments[1].surahId).toBe(114);
      expect(segments[1].pages).toEqual([604]);
    });
  });
});
