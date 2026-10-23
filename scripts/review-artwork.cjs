const sharp = require("sharp"),
  path = require("path");
const catalog = require("../src/domain/catalog.json");
const ids = process.argv.slice(2);
const files = ids
  .map((id) => catalog.find((l) => l.id === id)?.image)
  .filter(Boolean);
(async () => {
  const cols = Math.min(3, files.length),
    rows = Math.ceil(files.length / cols);
  await sharp({
    create: {
      width: cols * 300,
      height: rows * 450,
      channels: 3,
      background: "#eeece8",
    },
  })
    .composite(
      await Promise.all(
        files.map(async (file, i) => ({
          input: await sharp(path.join("static", file))
            .resize(300, 450, { fit: "contain" })
            .toBuffer(),
          left: (i % cols) * 300,
          top: Math.floor(i / cols) * 450,
        })),
      ),
    )
    .webp({ quality: 85 })
    .toFile("/tmp/ztyle-art-review.webp");
})();
