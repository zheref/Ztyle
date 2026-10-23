const test = require("node:test"),
  assert = require("node:assert/strict");
const catalog = require("../src/domain/catalog.json"),
  matrix = require("../src/domain/matrix.json");
const { artworkLayout } = require("../src/domain/artwork.cjs");
test("repeated gym palettes offer three distinct sleeve silhouettes", () => {
  const rotations = [
    "rotation-1-wednesday",
    "rotation-1-thursday",
    "rotation-2-wednesday",
    "rotation-2-friday",
    "rotation-3-sunday",
    "rotation-4-tuesday",
    "rotation-4-wednesday",
  ];
  const coverage = (name) =>
    /long.sleeve/i.test(name)
      ? "long"
      : /tank|sleeveless|muscle/i.test(name)
        ? "sleeveless"
        : "short";
  for (const rotation of rotations) {
    const looks = catalog.filter(
      (l) => l.rotationId === rotation && l.variant === "gym",
    );
    assert.equal(
      new Set(looks.map((l) => coverage(l.pieces[0].name))).size,
      3,
      rotation,
    );
  }
});
test("signature selections survive backups, and custom full-size image/notes fields are validated", () => {
  const { validateBackup } = require("../src/domain/planner.cjs");
  const signature = catalog.find((l) => l.option === 3);
  const backup = {
    version: 1,
    scheduleVersion: 2,
    plan: { "2026-10-20": signature.id },
    saved: [signature.id],
    customLooks: [],
  };
  assert.deepEqual(validateBackup(backup, catalog), backup);
  const custom = {
    ...signature,
    id: "custom-guide",
    image: "",
    imageFull: "https://untrusted.example/track.webp",
  };
  backup.customLooks = [custom];
  assert.throws(() => validateBackup(backup, catalog));
  custom.imageFull = "";
  assert.doesNotThrow(() => validateBackup(backup, catalog));
  custom.annotations = [{}];
  assert.throws(() => validateBackup(backup, catalog));
});
test("signature outfits preserve the source palette and lead with its primary color", () => {
  const signatures = catalog.filter((l) => l.option === 3);
  assert.equal(signatures.length, 84);
  for (const l of signatures) {
    assert.equal(
      l.sourcePalette,
      matrix.find((r) => r.rotationId === l.rotationId).palette,
    );
    assert.ok(
      l.pieces[0].name.toLowerCase().includes(l.signatureColors.primary),
    );
    assert.equal(l.annotations.length, 6);
    assert.ok(l.annotations.includes("BRANDING: SMALL TONAL MARKS ONLY"));
    assert.ok(l.imageFull.startsWith("/art/"));
    const siblings = catalog.filter(
      (s) =>
        s.rotationId === l.rotationId &&
        s.variant === l.variant &&
        s.option !== 3,
    );
    for (const sibling of siblings)
      assert.notDeepEqual(l.pieces, sibling.pieces);
  }
});
test("portrait and landscape viewer fit keeps the complete artwork visible and unwarped", () => {
  for (const viewport of [
    { width: 320, height: 480 },
    { width: 390, height: 650 },
    { width: 844, height: 200 },
    { width: 1280, height: 500 },
  ]) {
    const l = artworkLayout({ width: 1024, height: 1536 }, viewport);
    assert.ok(l.width <= viewport.width - 32 + 0.01);
    assert.ok(l.height <= viewport.height - 32 + 0.01);
    assert.ok(Math.abs(l.width / l.height - 1024 / 1536) < 0.001);
    const z = artworkLayout({ width: 1024, height: 1536 }, viewport, 3);
    assert.equal(z.width, l.width * 3);
    assert.ok(z.canvasWidth >= z.width + 32);
    assert.ok(z.canvasHeight >= z.height + 32);
  }
});
test("viewer handles transient zero-size stages and clamps excessive zoom", () => {
  const l = artworkLayout(
    { width: 0, height: 0 },
    { width: 0, height: 0 },
    100,
  );
  for (const value of Object.values(l))
    assert.ok(Number.isFinite(value) && value > 0);
  assert.deepEqual(
    artworkLayout(
      { width: 700, height: 700 },
      { width: 400, height: 600 },
      100,
    ),
    artworkLayout({ width: 700, height: 700 }, { width: 400, height: 600 }, 5),
  );
});
test("a short landscape viewport can still enlarge legends to full image resolution", () => {
  const layout = artworkLayout(
    { width: 1024, height: 1536 },
    { width: 844, height: 150 },
    100,
  );
  assert.ok(layout.maxZoom > 5);
  assert.equal(layout.width, 1024);
  assert.equal(layout.height, 1536);
});
