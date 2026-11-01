import { expect, test } from 'vitest';
import { GRID_COLS, GRID_ROWS } from '../../src/core/constants';
test('workspace grid has 60 cells', () => {
  expect(GRID_COLS * GRID_ROWS).toBe(60);
});
