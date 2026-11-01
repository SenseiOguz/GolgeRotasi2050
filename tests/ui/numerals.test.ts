import { expect, test } from 'vitest';
import { DIGIT_GLYPHS } from '../../src/ui/numerals';

test('the numeric face has ten distinct five-by-seven glyphs', () => {
  expect(DIGIT_GLYPHS).toHaveLength(10);
  expect(new Set(DIGIT_GLYPHS).size).toBe(10);
  for (const glyph of DIGIT_GLYPHS) expect(glyph).toMatch(/^[01]{5}(\/[01]{5}){6}$/);
});

test('confusable digits retain their open sides, slash, and different silhouettes', () => {
  const rows = DIGIT_GLYPHS.map(glyph => glyph.split('/'));
  // 5 and 6 have open upper-right sides; 8 has closed upper and lower loops.
  for (const digit of [5, 6]) expect(rows[digit][1][4]).toBe('0');
  expect(rows[8][1][4]).toBe('1');
  expect(rows[5][4][0]).toBe('0'); expect(rows[6][4][0]).toBe('1');
  // 0 is slashed through the interior; 1 has a foot, whereas 7 descends diagonally.
  expect(rows[0][3][2]).toBe('1');
  expect(rows[1][6]).toBe('01110'); expect(rows[7][6]).toBe('01000');
  for (const [a, b] of [[5, 8], [5, 6], [6, 8], [0, 8], [1, 7]]) {
    const difference = [...DIGIT_GLYPHS[a]].filter((pixel, i) => pixel !== DIGIT_GLYPHS[b][i]).length;
    expect(difference).toBeGreaterThanOrEqual(2);
  }
});
import { DIGIT_UNICODE_RANGE, LETTER_UNICODE_RANGE, PIXEL_FONT_FAMILY } from '../../src/ui/numerals';

test('letter and digit font faces have disjoint unicode ownership', () => {
  const covers = (range: string, point: number): boolean => range.split(',').some(part => {
    const [start, end] = part.trim().replace('U+', '').split('-').map(value => Number.parseInt(value, 16));
    return point >= start && point <= (end ?? start);
  });
  for (const letter of 'BÜTÇEBAŞLANGIÇBölümBaşlaİĞÖğşçü') {
    expect(covers(LETTER_UNICODE_RANGE, letter.codePointAt(0)!)).toBe(true);
    expect(covers(DIGIT_UNICODE_RANGE, letter.codePointAt(0)!)).toBe(false);
  }
  for (const digit of '0123456789') {
    expect(covers(DIGIT_UNICODE_RANGE, digit.codePointAt(0)!)).toBe(true);
    expect(covers(LETTER_UNICODE_RANGE, digit.codePointAt(0)!)).toBe(false);
  }
  expect(PIXEL_FONT_FAMILY.startsWith('"Pixelify Sans"')).toBe(true);
});
