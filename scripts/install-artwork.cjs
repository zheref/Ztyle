const fs = require("fs"),
  path = require("path"),
  sharp = require("sharp");
(async () => {
  const receipt = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
  const catalog = JSON.parse(
    fs.readFileSync("src/domain/catalog.json", "utf8"),
  );
  const look = catalog.find((l) => l.id === receipt.id);
  if (!look) throw Error("Unknown look");
  if (!/^[a-z0-9-]+$/.test(receipt.id)) throw Error("Invalid id");
  if (look.image && !receipt.replacement)
    throw Error("Existing artwork is preserved: " + receipt.id);
  const filename =
      receipt.id +
      (receipt.replacement
        ? receipt.annotated
          ? `-guide-v${receipt.revision || 2}.webp`
          : "-anime-solid-v2.webp"
        : "-anime.webp"),
    out = "static/art/" + filename;
  if (fs.existsSync(out)) throw Error("Asset already exists");
  await sharp(receipt.source)
    .resize({ height: 1050, withoutEnlargement: true })
    .webp({ quality: 86 })
    .toFile(out);
  fs.copyFileSync(out, "public/art/" + filename);
  look.image = "/art/" + filename;
  if (receipt.annotated) {
    const full =
      receipt.id +
      (receipt.replacement
        ? `-guide-v${receipt.revision || 2}-full.webp`
        : "-anime-full.webp");
    if (fs.existsSync("static/art/" + full))
      throw Error("Full-size asset already exists");
    await sharp(receipt.source)
      .webp({ quality: 96 })
      .toFile("static/art/" + full);
    fs.copyFileSync("static/art/" + full, "public/art/" + full);
    look.imageFull = "/art/" + full;
  }
  look.artworkStyle = receipt.annotated
    ? "annotated-flat-anime-172cm"
    : "flat-anime-172cm";
  look.artworkGeneratedAt = new Date().toISOString();
  fs.writeFileSync(
    "src/domain/catalog.json.tmp",
    JSON.stringify(catalog, null, 2),
  );
  fs.renameSync("src/domain/catalog.json.tmp", "src/domain/catalog.json");
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
  for (const dir of ["static", "public"]) {
    fs.writeFileSync(dir + "/artwork.json.tmp", JSON.stringify(registry));
    fs.renameSync(dir + "/artwork.json.tmp", dir + "/artwork.json");
  }
  console.log(
    JSON.stringify({
      id: receipt.id,
      path: out,
      done: registry.done,
      total: registry.total,
    }),
  );
})();
