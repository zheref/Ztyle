const fs = require("node:fs");
const catalog = require("../src/domain/catalog.json");
const matrix = require("../src/domain/matrix.json");
const {
  rotationForDate,
  dateKey,
  addDays,
} = require("../src/domain/planner.cjs");
// Primary / contrast / accessory / neutral, transcribed from the source matrix.
const palettes = [
  ["navy blue", "white", "crimson red", "dark blue"],
  ["deep navy", "crimson red", "white", "black"],
  ["scarlet red", "white", "silver", "black"],
  ["teal green", "black", "red", "black"],
  ["midnight navy", "black", "olive green", "black"],
  ["forest green", "black", "warm brown", "black"],
  ["burgundy", "forest green", "mustard yellow", "black"],
  ["black", "crimson red", "silver", "black"],
  ["forest green", "black", "orange", "black"],
  ["cream", "rust orange", "crimson red", "charcoal"],
  ["vivid orange", "royal blue", "white", "royal blue"],
  ["black", "vivid orange", "white", "black"],
  ["crimson red", "black", "orange", "black"],
  ["royal blue", "white", "gold", "white"],
  ["cherry red", "camel beige", "gold", "black"],
  ["forest green", "crimson red", "gold", "black"],
  ["forest green", "white", "brown", "cream"],
  ["cyan blue", "white", "black", "black"],
  ["black", "warm white", "salmon pink", "warm white"],
  ["black", "charcoal", "antique brass", "charcoal"],
  ["black", "crimson red", "burnt orange", "black"],
  ["white", "cream", "royal purple", "cream"],
  ["black", "white", "plum", "black"],
  ["white", "deep navy", "royal purple", "deep navy"],
  ["white", "deep navy", "crimson red", "deep navy"],
  ["black", "charcoal", "silver", "black"],
  ["navy blue", "white", "gold", "navy blue"],
  ["black", "midnight navy", "violet", "black"],
];
const hex = {
  "navy blue": "#23374e",
  "deep navy": "#252c43",
  "midnight navy": "#252d42",
  "dark blue": "#263b53",
  white: "#f6f4ed",
  black: "#202124",
  "scarlet red": "#b72c32",
  "crimson red": "#a6333c",
  "cherry red": "#B22222",
  "teal green": "#285948",
  "forest green": "#34573d",
  "olive green": "#405344",
  red: "#b43437",
  burgundy: "#74303b",
  "mustard yellow": "#c6a14e",
  orange: "#dc7938",
  "vivid orange": "#dc7938",
  "royal blue": "#385b83",
  cream: "#e9dfc9",
  "rust orange": "#c77335",
  charcoal: "#3a3a3a",
  gold: "#bca052",
  silver: "#b8bec7",
  "warm brown": "#79583d",
  brown: "#79583d",
  "camel beige": "#c19a6b",
  "cyan blue": "#00bfff",
  "warm white": "#f0ede5",
  "salmon pink": "#fa8072",
  "antique brass": "#8c6d3b",
  "burnt orange": "#cc5500",
  "royal purple": "#7c5b94",
  plum: "#684661",
  violet: "#8b78b4",
};
const shortName = (r) =>
  r.name
    .split(" (")[0]
    .replace("Survey Corps - Eren / Levi", "Survey Corps")
    .replace("Sung JinWoo", "Sung Jinwoo");
for (let i = 0; i < matrix.length; i++) {
  const row = matrix[i],
    [primary, contrast, accent, neutral] = palettes[i];
  for (const variant of ["warm", "cold", "gym"]) {
    const base = catalog.find(
      (l) =>
        l.rotationId === row.rotationId &&
        l.variant === variant &&
        l.option === 1,
    );
    const id = base.id + "-signature-3";
    if (catalog.some((l) => l.id === id)) continue;
    let pieces;
    if (variant === "warm")
      pieces = [
        {
          category: "Top",
          name: `Plain ${primary} boxy short-sleeve heavyweight cotton crewneck tee`,
        },
        {
          category: "Bottoms",
          name: `Plain ${["crimson red", "vivid orange", "forest green", "white", "camel beige", "royal blue", "warm white", "cream", "deep navy", "charcoal"].includes(contrast) ? contrast : neutral} relaxed cotton utility shorts above the knee`,
        },
        {
          category: "Footwear",
          name: `Plain ${primary === "black" ? "black" : "white"} canvas slip-on sneakers`,
        },
        {
          category: "Accent",
          name: `Simple ${accent} watch; no accent panels on clothing`,
        },
      ];
    if (variant === "cold")
      pieces = [
        {
          category: "Outerwear",
          name: `Plain ${primary} hip-length ${i % 2 ? "fleece overshirt" : "zip-up cotton hoodie"}, worn open`,
        },
        {
          category: "Base",
          name: `Plain ${contrast} ${i % 2 ? "crewneck sweatshirt" : "long-sleeve cotton tee"}`,
        },
        {
          category: "Bottoms",
          name: `Plain ${neutral} relaxed ${i % 2 ? "straight-leg denim jeans" : "cotton carpenter trousers"}`,
        },
        {
          category: "Footwear",
          name: `Plain ${neutral === "white" || neutral === "cream" ? "brown" : "black"} casual lace-up boots`,
        },
        { category: "Accent", name: `Simple ${accent} watch` },
      ];
    if (variant === "gym")
      pieces = [
        {
          category: "Top",
          name: `Plain ${primary} relaxed ${i % 2 ? "sleeveless muscle tee" : "short-sleeve athletic training tee"}`,
        },
        {
          category: "Bottoms",
          name: `Plain ${contrast} seven-inch training shorts, no stripes`,
        },
        {
          category: "Footwear",
          name: `Plain ${primary === "black" ? "black" : "white"} supportive training shoes`,
        },
        { category: "Accent", name: `Simple ${accent} sports watch` },
      ];
    // Several identities need their contrasting color in a clearly visible separate piece.
    if (row.rotationId === "rotation-1-monday" && variant === "warm")
      pieces[1].name =
        "Plain black relaxed cotton utility shorts above the knee";
    if (row.rotationId === "rotation-1-monday" && variant === "warm")
      pieces.push({
        category: "Accent",
        name: "Plain crimson red cotton baseball cap, held in one hand to keep spiky hair visible",
      });
    if (row.rotationId === "rotation-2-tuesday" && variant === "warm")
      pieces[1].name = `Plain charcoal ${variant === "gym" ? "seven-inch training shorts" : "relaxed cotton utility shorts above the knee"}`;
    if (row.rotationId === "rotation-2-tuesday" && variant === "warm")
      pieces.push({
        category: "Accent",
        name: "Plain rust orange cotton cap, held in one hand",
      });
    if (row.rotationId === "rotation-3-monday" && variant === "warm")
      pieces[1].name =
        "Plain crimson red relaxed cotton utility shorts above the knee";
    if (row.rotationId === "rotation-3-sunday" && variant === "gym")
      pieces[1].name = "Plain black seven-inch training shorts";
    if (row.rotationId === "rotation-4-sunday" && variant === "gym")
      pieces[1].name = "Plain white seven-inch training shorts";
    if (
      variant === "gym" &&
      [
        "rotation-1-wednesday",
        "rotation-1-thursday",
        "rotation-2-wednesday",
        "rotation-2-friday",
        "rotation-3-sunday",
        "rotation-4-tuesday",
        "rotation-4-wednesday",
      ].includes(row.rotationId)
    )
      pieces[0].name = `Plain ${primary} lightweight long-sleeve performance crewneck top, relaxed fit`;
    const annotations = [
      `${primary.toUpperCase()} FIRST`,
      `${contrast.toUpperCase()} CONTRAST`,
      `${accent.toUpperCase()} ACCENT`,
      variant === "cold"
        ? "HIP-LENGTH LAYERS"
        : variant === "gym"
          ? "FREE MOVEMENT"
          : "RELAXED FIT",
      "BRANDING: SMALL TONAL MARKS ONLY",
      "172 CM / EVERYDAY FIT",
    ];
    if (id === "rotation-3-sunday-gym-signature-3")
      annotations[1] = "BLACK BASE";
    catalog.push({
      id,
      rotationId: row.rotationId,
      matrixLabel: row.name,
      character: base.character,
      series: base.series,
      variant,
      option: 3,
      optionLabel: "Signature",
      alternativeOf: base.id,
      name: `${base.character} · ${variant === "cold" ? "Signature layers" : variant === "gym" ? "Signature training" : "Signature casual"}`,
      image: "",
      imageFull: `/art/${id}-anime-full.webp`,
      colors: [...new Set([primary, contrast, accent, neutral])].map(
        (c) => hex[c],
      ),
      source: "signature",
      sourcePalette: row.palette,
      signatureColors: { primary, contrast, accent, neutral },
      pieces,
      annotations,
      tip:
        id === "rotation-3-sunday-gym-signature-3"
          ? "Keep cherry red dominant, use plain black training shorts, and reserve gold for the watch. Camel beige remains a source-palette reference in the legend, not a garment in this gym outfit."
          : [
                "jinwoo-warm-signature-3",
                "rotation-4-sunday-gym-signature-3",
              ].includes(id)
            ? `Keep ${primary} dominant and reserve ${accent} for the watch. The secondary color remains in the source-palette legend for this monochrome variant. Choose plain everyday basics and small tonal branding only.`
            : `Keep ${primary} dominant, use ${contrast} on a separate piece, and reserve ${accent} for a small accessory. Change the cut, not the character palette. Choose standard plain basics; any store logo should be small and tonal.`,
      artworkStyle: "annotated-flat-anime-172cm",
    });
  }
}
fs.writeFileSync("src/domain/catalog.json", JSON.stringify(catalog, null, 2));
const jobs = [],
  seen = new Set(),
  started = "2026-10-20";
for (let i = 0; i < 90; i++) {
  const date = dateKey(addDays(new Date(started + "T12:00:00"), i)),
    row = rotationForDate(date);
  if (!row || seen.has(row.rotationId)) continue;
  seen.add(row.rotationId);
  for (const variant of ["warm", "cold", "gym"]) {
    const l = catalog.find(
      (l) =>
        l.rotationId === row.rotationId &&
        l.variant === variant &&
        l.option === 3,
    );
    const prompt = `Use case: stylized-concept. Create one portrait anime wardrobe STYLE GUIDE, with a full-body fashion avatar and legible inline annotations. Character inspiration: ${row.name}. SOURCE CHARACTER PALETTE (authoritative): ${row.palette}. Preserve the primary color prominently; do not replace it with a neutral top. The outfit is an everyday casual reinterpretation, not cosplay. Adult male avatar inspired by Kirito / Sung Jinwoo, 172 cm tall, compact natural proportions, about 6.5 to 7 heads tall, normal legs, lean average build, friendly confident face. ${variant === "cold" ? "Short textured black anime hair." : "Clearly UPRIGHT SPIKY BLACK HAIR with pointed tufts sticking UP, no floppy fringe."} EXACT ${variant} OUTFIT: ${l.pieces.map((p) => p.name).join("; ")}. Each garment is ONE PLAIN SOLID COLOR, readily available basics. NO contrasting panels, contrasting collars or sleeves, stripes, gradients, logos, prints, weapons or fantasy armor. Keep the signature color combination across separate pieces. Simple TV-anime clean ink outlines and FLAT SOLID FILLS, minimal hard-edged cel shading, no realism, texture rendering or glossy gradients. White/off-white background. Full body including every hair tip and both complete shoes, with head and foot margins. Subject takes about 60 percent of canvas width. A polished minimalist fashion reference sheet with generous side gutters, thin leader lines pointing to the relevant garment or accessory, and a compact color-swatch legend. Clearly typeset LARGE, HIGH-CONTRAST dark text, readable when zoomed on a phone; use short labels, never tiny paragraphs. Title exact: "${shortName(row)} / ${variant.toUpperCase()} / 03". Required callouts verbatim: ${l.annotations.map((a) => JSON.stringify(a)).join("; ")}. Place color callouts next to their actual matching pieces; if a contrast is only in the legend, do not falsely point at an unrelated piece. Place branding guidance below the figure, with a small empty chest-mark outline example OUTSIDE the clothes (not a real logo). Do not actually add branding to the clothes. Keep the body anatomy and casual clothing as important as the clear notes. Flat, restrained, readable editorial layout. Single portrait, no multiple figures.`;
    jobs.push({
      id: l.id,
      date,
      character: row.name,
      rotationId: row.rotationId,
      variant,
      option: 3,
      annotated: true,
      prompt,
    });
  }
}
fs.writeFileSync(
  "reference/signature-artwork-jobs.json",
  JSON.stringify(
    { started, total: jobs.length, tool: "built-in image_gen", jobs },
    null,
    2,
  ),
);
const registry = {
  updated: new Date().toISOString(),
  total: catalog.length,
  done: catalog.filter((l) => l.image).length,
  complete: catalog.every((l) => l.image),
  images: Object.fromEntries(
    catalog.filter((l) => l.image).map((l) => [l.id, l.image]),
  ),
  fullImages: Object.fromEntries(
    catalog
      .filter((l) => l.image && l.imageFull)
      .map((l) => [l.id, l.imageFull]),
  ),
};
for (const dir of ["static", "public"])
  fs.writeFileSync(dir + "/artwork.json", JSON.stringify(registry));
console.log(
  JSON.stringify({
    looks: catalog.length,
    newOptions: jobs.length,
    first: jobs.slice(0, 3).map((j) => j.id),
  }),
);
