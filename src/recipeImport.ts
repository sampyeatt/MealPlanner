import type { IngredientDraft } from "./types";

/**
 * Pulling an ingredient list off a recipe website.
 *
 * Recipe sites publish a schema.org `Recipe` object as JSON-LD in the page
 * head — they have to, because that is what Google reads to build a rich
 * result. That makes it far more consistent than scraping the rendered markup
 * or the "print recipe" page (only some sites have a print *URL*; others just
 * call `window.print()` on the page you are already on).
 *
 * What comes back is free text, one string per ingredient ("1 1/2 teaspoon
 * everything bagel seasoning"), so `parseIngredientLine` splits it into the
 * quantity/unit/name shape this app stores. That split is a best effort: the
 * import is meant to *prefill* the ingredient editor for review, not to write
 * straight to the database.
 */

/** A recipe as it comes off the page, before ingredient lines are parsed. */
interface RawRecipe {
  name: string;
  description: string;
  ingredientLines: string[];
}

export interface ImportedRecipe {
  name: string;
  description: string;
  ingredients: IngredientDraft[];
  /**
   * Lines that read as section headings rather than ingredients ("SOUP:").
   * Taste of Home and friends put these in `recipeIngredient` alongside the
   * real entries; they are reported so the caller can say how many were
   * dropped instead of silently losing them.
   */
  skipped: string[];
}

// ---------------------------------------------------------------------------
// Extracting the JSON-LD
// ---------------------------------------------------------------------------

const LD_JSON_RE =
  /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

/**
 * Decode HTML entities in a string that came out of parsed JSON.
 *
 * `<script>` content is raw text, so the HTML parser never decodes entities
 * inside it — a WordPress site that escapes its own output leaves literal
 * `&#038;` sitting inside the JSON string value. Decoding has to happen after
 * `JSON.parse`, never before: a `&quot;` decoded early would close a string
 * and break the parse.
 */
function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, body: string) => {
    if (body[0] === "#") {
      const codePoint =
        body[1].toLowerCase() === "x"
          ? parseInt(body.slice(2), 16)
          : parseInt(body.slice(1), 10);
      return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : match;
    }
    return NAMED_ENTITIES[body.toLowerCase()] ?? match;
  });
}

/** Decode entities, drop any inline markup, and collapse whitespace. */
function clean(value: unknown): string {
  if (typeof value !== "string") return "";
  return decodeEntities(value).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Depth-first search for an object whose `@type` includes "Recipe". The Recipe
 * is often not at the top level — Fresh Off The Grid and Taste of Home both
 * nest it inside an `@graph` array — and `@type` is sometimes an array.
 */
function findRecipe(node: unknown): Record<string, unknown> | null {
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = findRecipe(child);
      if (found) return found;
    }
    return null;
  }
  if (node && typeof node === "object") {
    const obj = node as Record<string, unknown>;
    const rawType = obj["@type"];
    const types = Array.isArray(rawType) ? rawType : [rawType];
    if (types.includes("Recipe")) return obj;
    for (const value of Object.values(obj)) {
      const found = findRecipe(value);
      if (found) return found;
    }
  }
  return null;
}

/** Find the schema.org Recipe in a page's HTML, or null if it has none. */
export function extractRecipe(html: string): RawRecipe | null {
  for (const match of html.matchAll(LD_JSON_RE)) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(match[1]);
    } catch {
      // Some sites ship a malformed block alongside good ones; keep looking.
      continue;
    }
    const recipe = findRecipe(parsed);
    if (!recipe) continue;

    const lines = Array.isArray(recipe.recipeIngredient)
      ? recipe.recipeIngredient.map(clean).filter(Boolean)
      : [];
    return {
      name: clean(recipe.name),
      description: clean(recipe.description),
      ingredientLines: lines,
    };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Parsing one ingredient line
// ---------------------------------------------------------------------------

const UNICODE_FRACTIONS: Record<string, string> = {
  "¼": "1/4",
  "½": "1/2",
  "¾": "3/4",
  "⅐": "1/7",
  "⅑": "1/9",
  "⅒": "1/10",
  "⅓": "1/3",
  "⅔": "2/3",
  "⅕": "1/5",
  "⅖": "2/5",
  "⅗": "3/5",
  "⅘": "4/5",
  "⅙": "1/6",
  "⅚": "5/6",
  "⅛": "1/8",
  "⅜": "3/8",
  "⅝": "5/8",
  "⅞": "7/8",
};

/**
 * Words treated as units, mapped to the form stored on the ingredient. Single
 * letters that are common English words ("c", "l", "T", "t") are deliberately
 * absent — matching them costs more in false positives than it saves.
 */
const UNITS: Record<string, string> = {
  cup: "cups",
  cups: "cups",
  tablespoon: "tbsp",
  tablespoons: "tbsp",
  tbsp: "tbsp",
  tbsps: "tbsp",
  tbs: "tbsp",
  teaspoon: "tsp",
  teaspoons: "tsp",
  tsp: "tsp",
  tsps: "tsp",
  ounce: "oz",
  ounces: "oz",
  oz: "oz",
  pound: "lb",
  pounds: "lb",
  lb: "lb",
  lbs: "lb",
  gram: "g",
  grams: "g",
  g: "g",
  kilogram: "kg",
  kilograms: "kg",
  kg: "kg",
  milliliter: "ml",
  milliliters: "ml",
  ml: "ml",
  liter: "l",
  liters: "l",
  litre: "l",
  litres: "l",
  quart: "quarts",
  quarts: "quarts",
  pint: "pints",
  pints: "pints",
  gallon: "gallons",
  gallons: "gallons",
  pinch: "pinch",
  pinches: "pinch",
  dash: "dash",
  dashes: "dash",
  clove: "cloves",
  cloves: "cloves",
  can: "cans",
  cans: "cans",
  package: "packages",
  packages: "packages",
  pkg: "packages",
  jar: "jars",
  jars: "jars",
  bunch: "bunches",
  bunches: "bunches",
  slice: "slices",
  slices: "slices",
  stick: "sticks",
  sticks: "sticks",
  head: "heads",
  heads: "heads",
  sprig: "sprigs",
  sprigs: "sprigs",
  stalk: "stalks",
  stalks: "stalks",
};

/**
 * Leading quantity. Ordered longest-first so mixed numbers win: Taste of Home
 * writes "2-1/2 cups", most other sites write "1 1/2 teaspoon".
 */
const QUANTITY_RE = /^(\d+\s*-\s*\d+\/\d+|\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:[.,]\d+)?)/;

/** A range's upper bound ("1 to 2 cups", "1-2 cups") — the low end is kept. */
const RANGE_TAIL_RE = /^(?:-|–|—|to\s+|or\s+)\s*\d+(?:\s+\d+\/\d+|\/\d+|[.,]\d+)?\s*/i;

const LEADING_PARENTHETICAL_RE = /^\([^)]*\)\s*/;

function toNumber(raw: string): number {
  const text = raw.replace(",", ".").trim();

  const mixed = text.match(/^(\d+)\s*[-\s]\s*(\d+)\/(\d+)$/);
  if (mixed) {
    return round2(Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]));
  }
  const fraction = text.match(/^(\d+)\/(\d+)$/);
  if (fraction) {
    return round2(Number(fraction[1]) / Number(fraction[2]));
  }
  const value = parseFloat(text);
  return Number.isFinite(value) ? round2(value) : 1;
}

/** The quantity input shows at most 2 decimals, so store at that precision. */
function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function normalizeFractions(line: string): string {
  return line.replace(
    /[¼½¾⅐⅑⅒⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]/g,
    (char) => ` ${UNICODE_FRACTIONS[char]}`,
  );
}

/**
 * True for the group headings some sites mix into the ingredient array
 * ("SOUP:", "PARMESAN BREAD CRUMBS:"). A line that opens with a digit is
 * always an ingredient, which keeps this from eating real entries.
 */
function isSectionHeader(line: string): boolean {
  if (/^\d/.test(line)) return false;
  if (line.endsWith(":")) return true;
  return line === line.toUpperCase() && /[A-Z]/.test(line);
}

/**
 * Split one ingredient string into name / quantity / unit. Returns null when
 * the line is a section heading rather than an ingredient.
 *
 * A line with no recognizable quantity ("parsley") still yields an ingredient,
 * with quantity 1 and no unit, so nothing is dropped on the floor.
 */
export function parseIngredientLine(line: string): IngredientDraft | null {
  const text = normalizeFractions(line).replace(/\s+/g, " ").trim();
  if (!text) return null;
  if (isSectionHeader(text)) return null;

  let rest = text;
  let quantity = 1;

  const quantityMatch = rest.match(QUANTITY_RE);
  if (quantityMatch) {
    quantity = toNumber(quantityMatch[1]);
    rest = rest.slice(quantityMatch[0].length).trim();
    rest = rest.replace(RANGE_TAIL_RE, "");
    // "2 (12-ounce) jars ..." — the parenthetical sizes the jar, it is not the
    // count, so it must not be mistaken for the unit.
    rest = rest.replace(LEADING_PARENTHETICAL_RE, "");
  }

  let unit = "";
  const unitMatch = rest.match(/^([a-z]+)\.?\b/i);
  if (unitMatch) {
    const canonical = UNITS[unitMatch[1].toLowerCase()];
    if (canonical) {
      unit = canonical;
      rest = rest.slice(unitMatch[0].length).trim();
    }
  }

  // "1 package (8 ounces) potato gnocchi" — parenthetical sits after the unit.
  rest = rest.replace(LEADING_PARENTHETICAL_RE, "");
  rest = rest.replace(/^of\s+/i, "").replace(/^[,;]\s*/, "").trim();

  // Falling back to the whole line keeps an unparseable entry visible and
  // editable rather than staging a nameless row.
  return { name: rest || text, quantity, unit };
}

// ---------------------------------------------------------------------------
// Fetching
// ---------------------------------------------------------------------------

/**
 * Recipe sites send no `Access-Control-Allow-Origin`, so a plain browser fetch
 * is blocked. On Android the request goes out through Capacitor's native HTTP
 * stack, which is not subject to CORS (see `CapacitorHttp` in
 * capacitor.config.ts — it patches `window.fetch`). Under `vite dev` there is
 * no native layer, so requests route through the dev-only middleware in
 * vite.config.ts instead.
 */
function requestUrl(target: string): string {
  return import.meta.env.DEV
    ? `/__recipe?url=${encodeURIComponent(target)}`
    : target;
}

/** Add the scheme `RecipeLink` also tolerates, so a bare host still resolves. */
function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export async function fetchRecipeHtml(url: string): Promise<string> {
  const response = await fetch(requestUrl(normalizeUrl(url)), {
    headers: { Accept: "text/html,application/xhtml+xml" },
  });
  if (!response.ok) {
    throw new Error(`the site returned ${response.status}`);
  }
  return await response.text();
}

/** Fetch a recipe page and turn it into ingredients ready for the editor. */
export async function importRecipe(url: string): Promise<ImportedRecipe> {
  const raw = extractRecipe(await fetchRecipeHtml(url));
  if (!raw) {
    throw new Error("no recipe data found on that page");
  }

  const ingredients: IngredientDraft[] = [];
  const skipped: string[] = [];
  for (const line of raw.ingredientLines) {
    const parsed = parseIngredientLine(line);
    if (parsed) {
      ingredients.push(parsed);
    } else {
      skipped.push(line);
    }
  }

  return {
    name: raw.name,
    description: raw.description,
    ingredients,
    skipped,
  };
}
