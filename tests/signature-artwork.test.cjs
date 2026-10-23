const test = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
  sharp = require("sharp");
const catalog = require("../src/domain/catalog.json"),
  queue = require("../reference/signature-artwork-jobs.json");
test("all 84 signature guides retain a full-resolution local image for reading labels", async () => {
  const registry = JSON.parse(fs.readFileSync("static/artwork.json"));
  for (const look of catalog.filter((l) => l.option === 3)) {
    assert.ok(look.image, "Unfinished " + look.id);
    assert.notEqual(look.imageFull, look.image);
    assert.equal(registry.fullImages[look.id], look.imageFull);
    const full = "static" + look.imageFull,
      preview = "static" + look.image;
    assert.deepEqual(
      fs.readFileSync(full),
      fs.readFileSync("public" + look.imageFull),
    );
    const [a, b] = await Promise.all([
      sharp(full).metadata(),
      sharp(preview).metadata(),
    ]);
    assert.ok(a.height >= b.height && a.width >= b.width);
    assert.ok(
      a.height >= 1536,
      "Legends need the full generated resolution: " + look.id,
    );
  }
});
test("signature generation follows source calendar order starting October 20 and requests embedded legends", () => {
  const { rotationForDate } = require("../src/domain/planner.cjs");
  assert.equal(queue.jobs.length, 84);
  assert.equal(queue.started, "2026-10-20");
  let date = queue.started;
  for (const j of queue.jobs) {
    assert.ok(j.date >= date);
    date = j.date;
    assert.equal(j.rotationId, rotationForDate(j.date).rotationId);
    assert.ok(j.prompt.includes("SOURCE CHARACTER PALETTE (authoritative)"));
    assert.ok(j.prompt.includes("BRANDING: SMALL TONAL MARKS ONLY"));
    assert.ok(j.annotated);
    if (j.variant !== "cold")
      assert.ok(j.prompt.includes("UPRIGHT SPIKY BLACK HAIR"));
  }
});
