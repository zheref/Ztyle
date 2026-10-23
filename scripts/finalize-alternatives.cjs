const fs = require("node:fs");
const catalog = require("../src/domain/catalog.json");
const queue = require("../reference/alternative-artwork-jobs.json");
const artwork = queue.jobs.map((job) => {
  const look = catalog.find((l) => l.id === job.id);
  if (!look?.image || !fs.existsSync("static" + look.image))
    throw Error("Missing alternative artwork: " + job.id);
  const receipt = JSON.parse(
    fs.readFileSync("reference/artwork-receipts/" + job.id + ".json"),
  );
  return { ...receipt, name: look.name, path: look.image };
});
if (artwork.length !== 84) throw Error("Expected all 84 alternative receipts");
// Derive color names from the explicit formulas, so swatches represent whole pieces.
const colors = {};
for (const look of catalog.filter((l) => l.option === 2)) {
  const originalColors = queue.jobs
    .find((j) => j.id === look.id)
    .prompt.match(/SEPARATE PIECES: ([^.]+)\./)[1]
    .split(", ");
  if (look.variant === "gym") {
    const patterns = [
      /^Plain (.+?) (?:sleeveless|short-sleeve)/,
      /^Plain (.+?) (?:training|lightweight)/,
      null,
      /^Simple (.+?) sports watch/,
    ];
    for (const [pieceIndex, colorIndex] of [
      [0, 0],
      [1, 1],
      [3, 2],
    ]) {
      const name = look.pieces[pieceIndex].name.match(
        patterns[pieceIndex],
      )?.[1];
      if (name) colors[name] = originalColors[colorIndex];
    }
  }
  if (look.variant === "warm") {
    const top = look.pieces[0].name.match(/^Plain (.+?) short-sleeve/)?.[1];
    const bottom = look.pieces[1].name.match(
      /^Plain (.+?) (?:lightweight|relaxed)/,
    )?.[1];
    if (top) colors[top] = originalColors[0];
    if (bottom) colors[bottom] = originalColors[1];
  }
}
const names = Object.keys(colors).sort((a, b) => b.length - a.length);
for (const look of catalog.filter((l) => l.option === 2)) {
  const actualColors = look.pieces
    .map((piece) => {
      const name = names.find(
        (name) =>
          piece.name.startsWith("Plain " + name + " ") ||
          piece.name.startsWith("Simple " + name + " "),
      );
      return colors[name];
    })
    .filter(Boolean);
  look.colors = [...new Set(actualColors)];
}
fs.writeFileSync("src/domain/catalog.json", JSON.stringify(catalog, null, 2));
fs.writeFileSync(
  "reference/alternative-artwork-prompts.json",
  JSON.stringify(
    {
      tool: "built-in image_gen",
      total: artwork.length,
      profile:
        "172 cm, casual solid-color basics, flat anime, spiky warm/gym hairstyles",
      artwork,
    },
    null,
    2,
  ),
);
console.log(
  JSON.stringify({
    alternatives: artwork.length,
    illustrated: catalog.filter((l) => l.image).length,
  }),
);
