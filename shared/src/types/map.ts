export interface GridCoord {
  x: number;
  y: number;
}

export interface MapDefinition {
  id: string;
  name: string;
  region: string;
  cols: number;
  rows: number;
  /** Ordered path enemies walk along, from spawn to core, in grid cells. */
  path: GridCoord[];
  /** Tiles where players may deploy monsters. */
  placementTiles: GridCoord[];
}

function coord(x: number, y: number): GridCoord {
  return { x, y };
}

/** The single MVP map: Verdant Forest. A snaking path with placement tiles flanking it. */
export const VERDANT_FOREST_MAP: MapDefinition = {
  id: "verdant-forest-1",
  name: "Verdant Forest Trail",
  region: "Verdant Forest",
  cols: 9,
  rows: 9,
  path: [
    coord(4, 0),
    coord(4, 1),
    coord(4, 2),
    coord(3, 2),
    coord(2, 2),
    coord(1, 2),
    coord(1, 3),
    coord(1, 4),
    coord(2, 4),
    coord(3, 4),
    coord(4, 4),
    coord(5, 4),
    coord(6, 4),
    coord(7, 4),
    coord(7, 5),
    coord(7, 6),
    coord(6, 6),
    coord(5, 6),
    coord(4, 6),
    coord(4, 7),
    coord(4, 8),
  ],
  placementTiles: [
    coord(3, 0), coord(5, 0),
    coord(3, 1), coord(5, 1),
    coord(2, 1), coord(2, 3), coord(3, 3),
    coord(0, 2), coord(0, 3), coord(0, 4),
    coord(2, 5), coord(3, 5), coord(4, 5), coord(4, 3),
    coord(5, 5), coord(6, 5), coord(5, 3), coord(6, 3),
    coord(7, 3), coord(8, 4), coord(8, 5),
    coord(6, 7), coord(5, 7), coord(3, 7), coord(3, 6),
  ],
};

export function isPathTile(map: MapDefinition, x: number, y: number): boolean {
  return map.path.some((p) => p.x === x && p.y === y);
}

export function isPlacementTile(map: MapDefinition, x: number, y: number): boolean {
  return map.placementTiles.some((p) => p.x === x && p.y === y);
}
