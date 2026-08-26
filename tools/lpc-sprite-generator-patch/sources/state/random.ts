import JSZip from "jszip";
import { selectItem, type State } from "./state.ts";
import type {
  CatalogReader,
  ItemMerged,
  SlimByTypeNameRow,
} from "./catalog.ts";
import { renderCharacter, getCanvas } from "../canvas/renderer.ts";
import { canvasToBlob } from "../canvas/canvas-utils.ts";
import { syncSelectionsToHash } from "./hash.ts";
import { exportStateAsJSON } from "./json.ts";
import { getAllCredits, creditsToTxt } from "../utils/credits.ts";
import { downloadFile } from "../canvas/download.ts";

export type RandomMode =
  | "balanced"
  | "chaos"
  | "human"
  | "creature"
  | "warrior"
  | "mage"
  | "ranger"
  | "forest"
  | "monster";

export type RandomOptions = {
  mode?: RandomMode;
  prompt?: string;
  seed?: number;
};
export type BatchOptions = RandomOptions & { count: number };

const RANDOM_GROUPS = [
  "ears",
  "furry_ears",
  "fins",
  "horns",
  "wings",
  "tail",
  "hair",
  "beard",
  "mustache",
  "eyebrows",
  "expression",
  "eyes",
  "facial_eyes",
  "facial_mask",
  "nose",
  "wrinkles",
  "clothes",
  "dress",
  "apron",
  "vest",
  "jacket",
  "overalls",
  "sleeves",
  "legs",
  "shoes",
  "socks",
  "feet",
  "armour",
  "arms",
  "gloves",
  "bracers",
  "shoulders",
  "bauldron",
  "belt",
  "sash",
  "neck",
  "necklace",
  "charm",
  "cape",
  "cape_trim",
  "backpack",
  "backpack_straps",
  "hat",
  "hat_accessory",
  "hat_trim",
  "headcover",
  "shield",
  "shield_paint",
  "shield_pattern",
  "shield_trim",
  "quiver",
  "weapon",
  "weapon_magic_crystal",
  "tools",
  "prosthesis_hand",
  "prosthesis_leg",
  // Previously-unused catalog categories (standalone items only — deliberately
  // excludes overlay/trim slots that only make visual sense paired with one
  // specific parent item, e.g. wings_dots (Monarch wings only) or
  // dress_sleeves (kimono only), since randomizing those independently would
  // produce disconnected/floating pieces.
  "accessory",
  "ammo",
  "bandages",
  "bandana",
  "buckles",
  "chainmail",
  "earrings",
  "hairtie",
  "ring",
  "wheelchair",
  "wound_arm",
  "wound_brain",
  "wound_eye_left",
  "wound_eye_right",
  "wound_mouth",
  "wound_ribs",
  "wrists",
];

const MODE_KEYWORDS: Record<RandomMode, string[]> = {
  balanced: [],
  chaos: [
    "weird",
    "strange",
    "giant",
    "tiny",
    "mask",
    "horn",
    "wing",
    "tail",
    "crystal",
    "magic",
    "animal",
    "monster",
  ],
  human: [
    "human",
    "adult",
    "elderly",
    "male",
    "female",
    "peasant",
    "worker",
    "villager",
    "noble",
  ],
  creature: [
    "animal",
    "beast",
    "bear",
    "cat",
    "dog",
    "wolf",
    "fox",
    "deer",
    "rabbit",
    "bird",
    "lizard",
    "reptile",
    "furry",
    "monster",
    "creature",
  ],
  warrior: [
    "armor",
    "armour",
    "sword",
    "axe",
    "shield",
    "helmet",
    "spear",
    "bow",
    "weapon",
    "gauntlet",
    "knight",
    "warrior",
  ],
  mage: [
    "magic",
    "mage",
    "wizard",
    "witch",
    "robe",
    "staff",
    "crystal",
    "spell",
    "cloak",
    "hood",
    "wand",
    "gem",
  ],
  ranger: [
    "bow",
    "quiver",
    "hood",
    "cloak",
    "leather",
    "forest",
    "hunter",
    "ranger",
    "knife",
    "boots",
  ],
  forest: [
    "forest",
    "leaf",
    "plant",
    "nature",
    "wood",
    "green",
    "moss",
    "flower",
    "deer",
    "fox",
    "wolf",
    "ranger",
    "druid",
  ],
  monster: [
    "monster",
    "beast",
    "demon",
    "horn",
    "fang",
    "claw",
    "wing",
    "tail",
    "scale",
    "fur",
    "undead",
    "skeleton",
    "zombie",
    "wound",
    "gore",
    "bandage",
    "creature",
    "animal",
  ],
};

const OPTIONAL = new Set([
  "beard",
  "mustache",
  "bandages",
  "wheelchair",
  "wound_arm",
  "wound_brain",
  "wound_eye_left",
  "wound_eye_right",
  "wound_mouth",
  "wound_ribs",
  "eyebrows",
  "expression",
  "eyes",
  "facial_eyes",
  "facial_mask",
  "nose",
  "wrinkles",
  "prosthesis_hand",
  "prosthesis_leg",
]);
const COMMON = new Set([
  "hair",
  "clothes",
  "legs",
  "shoes",
  "feet",
  "weapon",
  "hat",
]);

function rngFrom(seed?: number): () => number {
  if (seed === undefined || !Number.isFinite(seed)) return Math.random;
  let value = Math.floor(seed) >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function pick<T>(a: T[], rng: () => number): T | null {
  return a.length ? a[Math.floor(rng() * a.length)] : null;
}
function words(s: string): string[] {
  return s
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((x) => x.length > 2);
}

function score(
  item: ItemMerged,
  row: SlimByTypeNameRow,
  mode: RandomMode,
  prompt: string,
  group: string,
): number {
  const text = `${row.itemId} ${row.name} ${item.name} ${group}`.toLowerCase();
  let n = 1;
  for (const w of [...MODE_KEYWORDS[mode], ...words(prompt)])
    if (text.includes(w)) n += mode === "chaos" ? 1 : 5;
  if (COMMON.has(group) && mode !== "chaos") n += 1.5;
  if (mode === "human" && /human|male|female|adult|elderly/.test(text)) n += 10;
  if ((mode === "creature" || mode === "monster") && /human/.test(text)) n -= 8;
  if (
    mode === "monster" &&
    /horn|fang|claw|wing|tail|scale|demon|skeleton|zombie/.test(text)
  )
    n += 7;
  if (
    ["human", "warrior", "mage", "ranger"].includes(mode) &&
    /skeleton|zombie|wound/.test(text)
  )
    n -= 8;
  return Math.max(0.05, n);
}
function weighted<T extends { score: number }>(
  a: T[],
  rng: () => number,
): T | null {
  if (!a.length) return null;
  const total = a.reduce((s, x) => s + x.score, 0);
  let r = rng() * total;
  for (const x of a) {
    r -= x.score;
    if (r <= 0) return x;
  }
  return a[a.length - 1];
}
function supports(meta: ItemMerged, body: string, anim: string): boolean {
  return (
    !!meta.layers?.layer_1?.[body] &&
    (!meta.animations?.length || meta.animations.includes(anim))
  );
}
function variant(meta: ItemMerged, rng: () => number): string {
  return (
    pick(meta.variants ?? [], rng) ??
    pick(meta.recolors?.[0]?.variants ?? [], rng) ??
    ""
  );
}
function choose(
  catalog: CatalogReader,
  rows: SlimByTypeNameRow[],
  body: string,
  anim: string,
  mode: RandomMode,
  prompt: string,
  rng: () => number,
) {
  const a: { item: ItemMerged; row: SlimByTypeNameRow; score: number }[] = [];
  for (const row of rows) {
    const item = catalog.getItemMerged(row.itemId).unwrapOr(null);
    if (item && supports(item, body, anim))
      a.push({
        item,
        row,
        score: score(item, row, mode, prompt, row.type_name),
      });
  }
  return weighted(a, rng);
}
type BodyChoice = {
  item: ItemMerged;
  row: SlimByTypeNameRow;
  score: number;
  bodyTypes: string[];
};
/**
 * Picks the base body shape itself (e.g. the plain human body vs. the
 * skeleton/zombie bodies), not just a color variant of it — this is what
 * lets "monster"/"chaos" modes produce non-humanoid results instead of a
 * human body with monster parts stuck on it.
 */
function chooseBody(
  catalog: CatalogReader,
  rows: SlimByTypeNameRow[],
  anim: string,
  mode: RandomMode,
  prompt: string,
  rng: () => number,
): BodyChoice | null {
  const a: BodyChoice[] = [];
  for (const row of rows) {
    const item = catalog.getItemMerged(row.itemId).unwrapOr(null);
    if (!item) continue;
    const bodyTypes = Object.keys(item.layers?.layer_1 ?? {}).filter(
      (k) => k !== "zPos" && k !== "custom_animation",
    );
    if (!bodyTypes.length) continue;
    if (item.animations?.length && !item.animations.includes(anim)) continue;
    a.push({
      item,
      row,
      score: score(item, row, mode, prompt, row.type_name),
      bodyTypes,
    });
  }
  return weighted(a, rng);
}
function useGroup(group: string, mode: RandomMode, rng: () => number): boolean {
  if (OPTIONAL.has(group)) return rng() < (mode === "chaos" ? 0.55 : 0.28);
  if (COMMON.has(group)) return rng() < (mode === "chaos" ? 0.9 : 0.72);
  return rng() < (mode === "chaos" ? 0.62 : 0.34);
}

export async function randomizeCharacter(
  catalog: CatalogReader,
  state: State,
  options: RandomOptions = {},
): Promise<void> {
  const indexes = catalog.getMetadataIndexes().unwrapOr(null);
  if (!indexes) return;
  const rng = rngFrom(options.seed),
    mode = options.mode ?? "balanced",
    prompt = options.prompt ?? "";
  const anim = state.selectedAnimation || "walk";
  const bodyChoice = chooseBody(
    catalog,
    indexes.byTypeName?.body ?? [],
    anim,
    mode,
    prompt,
    rng,
  );
  const body = pick(bodyChoice?.bodyTypes ?? ["male", "female"], rng) ?? "male";
  state.bodyType = body;
  state.selections = {};
  if (bodyChoice) {
    selectItem(
      state,
      bodyChoice.row.itemId,
      variant(bodyChoice.item, rng) || "light",
    );
  } else {
    const base = catalog.getItemMerged("body").unwrapOr(null);
    if (base) selectItem(state, "body", variant(base, rng) || "light");
  }
  const head = choose(
    catalog,
    indexes.byTypeName?.head ?? [],
    body,
    anim,
    mode,
    prompt,
    rng,
  );
  if (head) selectItem(state, head.row.itemId, variant(head.item, rng));
  const headText =
    `${head?.row.itemId ?? ""} ${head?.item.name ?? ""}`.toLowerCase();
  const human = /human|male|female|elderly|adult/.test(headText);
  const groups = [...RANDOM_GROUPS].sort(() => rng() - 0.5);
  for (const group of groups) {
    const rows = indexes.byTypeName?.[group] ?? [];
    if (!rows.length || !useGroup(group, mode, rng)) continue;
    if (
      !human &&
      [
        "expression",
        "eyes",
        "eyebrows",
        "nose",
        "beard",
        "mustache",
        "wrinkles",
        "facial_eyes",
        "facial_mask",
      ].includes(group)
    )
      continue;
    if (
      ["female", "child", "teen"].includes(body) &&
      ["beard", "mustache"].includes(group) &&
      rng() > 0.04
    )
      continue;
    const choice = choose(catalog, rows, body, anim, mode, prompt, rng);
    if (choice) selectItem(state, choice.row.itemId, variant(choice.item, rng));
  }
  syncSelectionsToHash(catalog, state);
  await renderCharacter(catalog, state, state.selections, state.bodyType);
}

export async function generateRandomBatch(
  catalog: CatalogReader,
  state: State,
  options: BatchOptions,
): Promise<void> {
  const count = Math.max(1, Math.min(100, Math.floor(options.count)));
  const zip = new JSZip(),
    manifest: Array<Record<string, unknown>> = [];
  const credits = new Map<string, string>();
  const baseSeed = options.seed ?? Math.floor(Math.random() * 0x7fffffff);
  for (let i = 0; i < count; i++) {
    const seed = (baseSeed + i * 9973) >>> 0;
    await randomizeCharacter(catalog, state, { ...options, seed });
    const c = getCanvas();
    if (c.isErr()) continue;
    const blob = await canvasToBlob(c.value),
      id = `random_${String(i + 1).padStart(3, "0")}`;
    zip.file(`${id}.png`, blob);
    zip.file(`${id}.json`, exportStateAsJSON(catalog, state, []));
    for (const cr of getAllCredits(catalog, state.selections, state.bodyType))
      credits.set(
        `${cr.file}|${cr.authors.join(",")}|${cr.licenses.join(",")}`,
        JSON.stringify(cr),
      );
    manifest.push({
      id,
      seed,
      mode: options.mode ?? "balanced",
      prompt: options.prompt ?? "",
      bodyType: state.bodyType,
      selections: state.selections,
    });
  }
  zip.file("manifest.json", JSON.stringify(manifest, null, 2));
  zip.file(
    "credits.txt",
    creditsToTxt([...credits.values()].map((x) => JSON.parse(x))),
  );
  const blob = await zip.generateAsync({ type: "blob" });
  downloadFile(blob, `lpc-random-batch-${baseSeed}.zip`, "application/zip");
}
