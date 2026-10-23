const test = require("node:test"),
  assert = require("node:assert/strict");
const p = require("../src/domain/planner.cjs"),
  catalog = require("../src/domain/catalog.json"),
  matrix = require("../src/domain/matrix.json");
test("every source inspiration and weather variant has three distinct outfit formulas", () => {
  for (const row of matrix)
    for (const variant of ["warm", "cold", "gym"]) {
      const group = catalog.filter(
        (l) => l.rotationId === row.rotationId && l.variant === variant,
      );
      assert.equal(group.length, 3, row.rotationId + " " + variant);
      assert.deepEqual(group.map((l) => l.option).sort(), [1, 2, 3]);
      assert.notDeepEqual(group[0].pieces, group[1].pieces);
    }
});
test("outfit options stay in the same source slot, including separate Naruto forms", () => {
  const classic = catalog.find(
    (l) => l.rotationId === "rotation-2-wednesday" && l.variant === "warm",
  );
  const options = p.outfitOptions(catalog, classic);
  assert.equal(options.length, 3);
  assert.ok(options.every((l) => l.rotationId === "rotation-2-wednesday"));
  const gym = p.outfitOptions(catalog, classic, "gym");
  assert.equal(gym.length, 3);
  assert.ok(gym.every((l) => l.variant === "gym"));
});
test("planning original, alternative, signature or mixed options preserves source character and requested weather", () => {
  const dates = p.monthDates(new Date("2026-10-18T12:00:00"));
  for (const pref of ["original", "alternative", "signature", "mix"]) {
    const plan = p.suggestWeek(dates, catalog, [], "gym", 22, {}, pref);
    assert.equal(Object.keys(plan).length, 28);
    for (const [date, id] of Object.entries(plan)) {
      const l = catalog.find((l) => l.id === id);
      assert.equal(l.rotationId, p.rotationForDate(date).rotationId);
      assert.equal(l.variant, "gym");
      if (pref !== "mix")
        assert.equal(
          l.option,
          pref === "original" ? 1 : pref === "signature" ? 3 : 2,
        );
    }
    if (pref === "mix")
      assert.equal(
        new Set(
          Object.values(plan).map(
            (id) => catalog.find((l) => l.id === id).option,
          ),
        ).size,
        3,
      );
  }
});
test("saved calendar and backup retain the selected alternative outfit id", () => {
  const l = catalog.find(
    (l) =>
      l.rotationId === "rotation-3-sunday" &&
      l.variant === "gym" &&
      l.option === 2,
  );
  const backup = {
    version: 1,
    scheduleVersion: 2,
    plan: { "2026-10-18": l.id },
    customLooks: [],
    saved: [l.id],
  };
  assert.deepEqual(
    p.validateBackup(JSON.parse(JSON.stringify(backup)), catalog),
    backup,
  );
});
