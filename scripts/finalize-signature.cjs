const fs = require("node:fs");
const catalog = require("../src/domain/catalog.json"),
  queue = require("../reference/signature-artwork-jobs.json");
const artwork = queue.jobs.map((j) => {
  const l = catalog.find((l) => l.id === j.id);
  if (!l?.image || !fs.existsSync("static" + l.imageFull))
    throw Error("Missing signature guide " + j.id);
  const fitRevision = "reference/artwork-receipts/" + j.id + "-fit-v3.json";
  const corrected = fs.existsSync(fitRevision)
    ? fitRevision
    : "reference/artwork-receipts/" + j.id + "-label-v2.json";
  const receipt = JSON.parse(
    fs.readFileSync(
      fs.existsSync(corrected)
        ? corrected
        : "reference/artwork-receipts/" + j.id + ".json",
    ),
  );
  return {
    ...receipt,
    date: j.date,
    character: j.character,
    path: l.image,
    fullPath: l.imageFull,
    sourcePalette: l.sourcePalette,
    annotations: l.annotations,
  };
});
if (artwork.length !== 84) throw Error("Expected 84 signature guides");
fs.writeFileSync(
  "reference/signature-artwork-prompts.json",
  JSON.stringify(
    {
      tool: "built-in image_gen",
      total: 84,
      started: queue.started,
      profile:
        "172 cm, casual solid-color basics, source-character palettes, annotated flat anime, spiky warm/gym hair",
      artwork,
    },
    null,
    2,
  ),
);
console.log(
  JSON.stringify({
    signatureGuides: artwork.length,
    total: catalog.length,
    complete: catalog.every((l) => l.image),
  }),
);
