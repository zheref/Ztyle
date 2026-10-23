const test = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path"),
  crypto = require("node:crypto");
const root = path.join(__dirname, ".."),
  catalog = require("../src/domain/catalog.json");
test("every matrix outfit variant has its own real local illustration", () => {
  const files = new Set(),
    hashes = new Set();
  for (const look of catalog) {
    assert.ok(look.image, "Missing artwork: " + look.id);
    assert.ok(!files.has(look.image), "Reused artwork path: " + look.id);
    files.add(look.image);
    const file = path.join(root, "static", look.image);
    const bytes = fs.readFileSync(file);
    assert.equal(bytes.toString("ascii", 0, 4), "RIFF");
    assert.equal(bytes.toString("ascii", 8, 12), "WEBP");
    const hash = crypto.createHash("sha256").update(bytes).digest("hex");
    assert.ok(!hashes.has(hash), "Duplicated image: " + look.id);
    hashes.add(hash);
    assert.ok(
      fs.existsSync(path.join(root, "public", look.image)),
      "Not served: " + look.id,
    );
  }
});
test("live artwork registry covers the complete catalog and matches the served copy", () => {
  const registry = JSON.parse(
      fs.readFileSync(path.join(root, "static/artwork.json")),
    ),
    served = JSON.parse(
      fs.readFileSync(path.join(root, "public/artwork.json")),
    );
  assert.equal(registry.total, catalog.length);
  assert.equal(registry.done, catalog.length);
  assert.equal(registry.complete, true);
  assert.deepEqual(registry, served);
  for (const look of catalog)
    assert.equal(registry.images[look.id], look.image);
});
test("generation queue starts today and advances through source calendar assignments", () => {
  const queue = require("../reference/artwork-jobs.json"),
    p = require("../src/domain/planner.cjs");
  let last = queue.started;
  assert.equal(queue.jobs[0].date, queue.started);
  const ids = new Set();
  for (const job of queue.jobs) {
    assert.ok(job.date >= last);
    last = job.date;
    assert.equal(p.rotationForDate(job.date).rotationId, job.rotationId);
    assert.ok(!ids.has(job.id));
    ids.add(job.id);
    assert.ok(job.prompt.includes("ONE PLAIN SOLID COLOR"));
    if (job.variant !== "cold")
      assert.ok(job.prompt.includes("UPRIGHT SPIKY BLACK HAIR"));
  }
});
