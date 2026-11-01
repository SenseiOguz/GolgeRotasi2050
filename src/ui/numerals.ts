/** Original 5x7 numeric glyphs for Route Digits (SIL OFL 1.1).
 * Each slash-separated row is five pixels. OTF outlines are the filled cells,
 * on a 100-unit grid with 600-unit advance and 1000 units per em.
 * Only U+0030..0039 are mapped: letters and punctuation use Pixelify Sans.
 */
export const DIGIT_GLYPHS = [
  "01110/10001/10011/10101/11001/10001/01110",
  "00100/01100/00100/00100/00100/00100/01110",
  "11110/00001/00001/01110/10000/10000/11111",
  "11110/00001/00001/01110/00001/00001/11110",
  "10010/10010/10010/11111/00010/00010/00010",
  "11111/10000/10000/11110/00001/00001/11110",
  "01110/10000/10000/11110/10001/10001/01110",
  "11111/00001/00010/00100/01000/01000/01000",
  "01110/10001/10001/01110/10001/10001/01110",
  "01110/10001/10001/01111/00001/00001/01110"
] as const;

// Disjoint faces: letters are resolved directly from Pixelify, never the digit font.
export const DIGIT_UNICODE_RANGE = 'U+0030-0039';
export const LETTER_UNICODE_RANGE = 'U+0000-002F, U+003A-10FFFF';
export const PIXEL_FONT_FAMILY = '"Pixelify Sans", "Route Digits", "Segoe UI", sans-serif';
