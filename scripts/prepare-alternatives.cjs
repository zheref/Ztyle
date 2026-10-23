const fs = require("fs");
const catalog = require("../src/domain/catalog.json"),
  matrix = require("../src/domain/matrix.json"),
  prompt = require("./art-prompt.cjs");
const {
  rotationForDate,
  addDays,
  dateKey,
} = require("../src/domain/planner.cjs");
const schemes = [
  ["navy", "white", "crimson red"],
  ["crimson red", "navy", "black"],
  ["scarlet red", "white", "black"],
  ["forest green", "charcoal", "red"],
  ["navy", "black", "olive green"],
  ["forest green", "white", "warm brown"],
  ["burgundy", "forest green", "mustard yellow"],
  ["crimson red", "black", "silver"],
  ["forest green", "black", "orange"],
  ["cream", "rust orange", "charcoal"],
  ["orange", "royal blue", "white"],
  ["black", "orange", "white"],
  ["crimson red", "black", "orange"],
  ["royal blue", "cream", "gold"],
  ["crimson red", "black", "gold"],
  ["forest green", "crimson red", "black"],
  ["forest green", "white", "brown"],
  ["cyan", "white", "black"],
  ["black", "white", "salmon pink"],
  ["charcoal", "black", "bronze"],
  ["black", "white", "crimson red"],
  ["cream", "light gray", "purple"],
  ["white", "charcoal", "plum"],
  ["white", "navy", "purple"],
  ["white", "navy", "black"],
  ["black", "charcoal", "silver"],
  ["navy", "white", "gold"],
  ["navy", "black", "violet"],
];
const hex = {
  navy: "#27354c",
  white: "#eeeeea",
  "crimson red": "#a62f3c",
  "scarlet red": "#bc3437",
  "forest green": "#345b45",
  charcoal: "#40434a",
  red: "#ae3636",
  black: "#22252a",
  "olive green": "#616b4b",
  "warm brown": "#8c6848",
  burgundy: "#793744",
  "mustard yellow": "#bea44a",
  silver: "#a9adb4",
  orange: "#ce793c",
  cream: "#e6dfcd",
  "rust orange": "#b86c3d",
  "royal blue": "#3b5e94",
  gold: "#b9a05c",
  brown: "#86674d",
  cyan: "#4da9bc",
  "salmon pink": "#d58e88",
  bronze: "#9b805e",
  "light gray": "#b8b8b5",
  purple: "#887398",
  plum: "#79526e",
  violet: "#8473a8",
};
for (let i = 0; i < matrix.length; i++) {
  const row = matrix[i],
    [primary, secondary, accent] = schemes[i];
  for (const variant of ["warm", "cold", "gym"]) {
    const base = catalog.find(
      (l) =>
        l.rotationId === row.rotationId &&
        l.variant === variant &&
        (l.option || 1) === 1,
    );
    if (!base)
      throw Error("Missing original " + row.rotationId + " " + variant);
    base.option = 1;
    base.optionLabel = "Original";
    const id = base.id + "-alt-2";
    if (catalog.some((l) => l.id === id)) continue;
    let pieces,
      description,
      colorTop = secondary,
      colorBottom = "charcoal";
    if (variant === "warm") {
      const top =
        i % 3 === 0
          ? "short-sleeve cotton polo"
          : i % 3 === 1
            ? "short-sleeve cotton henley"
            : "short-sleeve camp-collar shirt";
      colorTop = secondary;
      if (
        ["black", "charcoal"].includes(secondary) &&
        ["crimson red", "orange", "forest green", "navy"].includes(primary)
      )
        colorTop = primary;
      colorBottom =
        i % 3 === 1
          ? "black"
          : ["white", "cream", "light gray"].includes(secondary)
            ? "navy"
            : "light gray";
      const bottoms =
        i % 3 === 1
          ? `Plain ${colorBottom} lightweight straight-leg cotton trousers`
          : `Plain ${colorBottom} relaxed drawstring shorts above the knee`;
      pieces = [
        ["Top", `Plain ${colorTop} ${top}`],
        ["Bottoms", bottoms],
        ["Footwear", "Plain white canvas low-top sneakers"],
        [
          "Accent",
          `Simple ${accent} watch or bracelet, separate from clothing`,
        ],
      ];
      description =
        "A different neckline and an easier lower-half silhouette: a fresh combination of plain basics in the same character palette.";
    } else if (variant === "cold") {
      colorTop = secondary;
      colorBottom = i % 2 ? "black" : "charcoal";
      pieces =
        i % 2 === 0
          ? [
              ["Base", `Plain ${secondary} crewneck sweatshirt`],
              [
                "Outerwear",
                `Plain ${primary} short quilted puffer vest, no contrasting trim`,
              ],
              [
                "Bottoms",
                `Plain ${colorBottom} relaxed straight-leg cargo trousers`,
              ],
              ["Footwear", "Plain white casual sneakers"],
            ]
          : [
              ["Top", `Plain ${primary} quarter-zip fleece pullover`],
              ["Bottoms", `Plain ${colorBottom} relaxed cotton joggers`],
              ["Footwear", "Plain black canvas high-top sneakers"],
              ["Accent", `Simple ${accent} watch or bracelet`],
            ];
      description =
        "Switch the usual jacket formula for casual fleece or a compact vest. Keep the hem at the hip and the leg relaxed for a balanced 172 cm frame.";
    } else {
      const originalBottom =
        base.pieces.find((p) => /bottom/i.test(p.category))?.name || "";
      const originalTop =
        base.pieces.find((p) => /top|base/i.test(p.category))?.name || "";
      const shorts = /jogger|trouser|pants/i.test(originalBottom);
      const tank = !/tank|sleeveless/i.test(originalTop);
      colorTop = primary;
      colorBottom = secondary;
      if (
        [
          "gold",
          "silver",
          "bronze",
          "mustard yellow",
          "salmon pink",
          "violet",
          "purple",
          "plum",
        ].includes(colorBottom)
      )
        colorBottom = "charcoal";
      pieces = [
        [
          "Top",
          `Plain ${colorTop} ${tank ? "sleeveless athletic tank" : "short-sleeve performance tee"}`,
        ],
        [
          "Bottoms",
          `Plain ${colorBottom} ${shorts ? "training shorts above the knee" : "lightweight tapered training joggers"}`,
        ],
        ["Footwear", "Plain white supportive training sneakers"],
        [
          "Accent",
          `Simple ${accent} sports watch, no accent color on the garments`,
        ],
      ];
      description =
        "Trade shorts for joggers (or joggers for shorts) and change the top cut. Keep the fabric breathable and every garment a single solid color.";
    }
    // Black/navy inspirations get a deliberate light neutral counterpoint in the second option.
    if (row.rotationId === "rotation-4-thursday" && variant === "warm") {
      pieces[0][1] = "Plain white short-sleeve cotton henley";
      pieces[1][1] =
        "Plain charcoal relaxed straight-leg linen-cotton trousers";
      colorTop = "white";
      colorBottom = "charcoal";
    }
    if (row.rotationId === "rotation-4-saturday" && variant === "warm") {
      pieces[0][1] = "Plain black short-sleeve cotton polo";
      pieces[1][1] =
        "Plain light gray relaxed drawstring shorts above the knee";
      colorTop = "black";
      colorBottom = "light gray";
    }
    catalog.push({
      id,
      rotationId: row.rotationId,
      matrixLabel: row.name,
      character: base.character,
      series: base.series,
      variant,
      option: 2,
      optionLabel: "Alternative",
      alternativeOf: base.id,
      name: `${base.character} · ${variant === "warm" ? "Easy switch" : variant === "cold" ? "Weekend layers" : "Training reset"}`,
      image: "",
      colors: [hex[colorTop], hex[colorBottom], hex[accent]],
      pieces: pieces.map(([category, name]) => ({ category, name })),
      tip:
        description +
        " Keep the inspiration in the combination of separate solid-color pieces; warm and gym looks keep upright spiky hair.",
      source: "alternative",
      sourceOutfit: row.outfit,
    });
  }
}
fs.writeFileSync("src/domain/catalog.json", JSON.stringify(catalog, null, 2));
const jobs = [],
  seen = new Set(),
  today = "2026-10-18";
for (let i = 0; i < 90; i++) {
  const date = dateKey(addDays(new Date(today + "T12:00:00"), i)),
    row = rotationForDate(date);
  if (!row || seen.has(row.rotationId)) continue;
  seen.add(row.rotationId);
  for (const variant of ["warm", "cold", "gym"]) {
    const l = catalog.find(
      (l) =>
        l.rotationId === row.rotationId &&
        l.variant === variant &&
        l.option === 2,
    );
    if (l.image) continue;
    jobs.push({
      id: l.id,
      date,
      variant,
      option: 2,
      character: row.name,
      rotationId: row.rotationId,
      prompt:
        prompt(l, row.name) +
        ` This is OPTION TWO: the alternative clothing formula must be visibly different from option one. Draw only the listed garments. ${l.alternativeOf.includes("jinwoo") ? "Keep the violet accent confined to the separate watch." : ""}`,
    });
  }
}
fs.writeFileSync(
  "reference/alternative-artwork-jobs.json",
  JSON.stringify(
    { started: today, tool: "built-in image_gen", total: jobs.length, jobs },
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
};
for (const dir of ["static", "public"])
  fs.writeFileSync(dir + "/artwork.json", JSON.stringify(registry));
console.log({
  total: catalog.length,
  alternatives: jobs.length,
  first: jobs.slice(0, 3).map((j) => j.id),
});
