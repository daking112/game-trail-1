export const CELL_SIZE = 58;

export function gridToPixel(x: number, y: number): { px: number; py: number } {
  return { px: x * CELL_SIZE + CELL_SIZE / 2, py: y * CELL_SIZE + CELL_SIZE / 2 };
}

export function pixelToGrid(px: number, py: number): { x: number; y: number } {
  return { x: Math.floor(px / CELL_SIZE), y: Math.floor(py / CELL_SIZE) };
}

const SHAPE_SIDES: Record<string, number> = {
  circle: 0,
  square: 4,
  triangle: 3,
  diamond: 4,
  hexagon: 6,
};

export function shapeSides(shape: string): number {
  return SHAPE_SIDES[shape] ?? 0;
}
