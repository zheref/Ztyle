const test = require("node:test"),
  assert = require("node:assert/strict");
const p = require("../src/domain/planner.cjs"),
  looks = require("../src/domain/catalog.json");
test("week spans month boundaries with local calendar dates", () =>
  assert.deepEqual(p.weekDates(new Date("2026-11-01T12:00:00")), [
    "2026-10-26",
    "2026-10-27",
    "2026-10-28",
    "2026-10-29",
    "2026-10-30",
    "2026-10-31",
    "2026-11-01",
  ]));
test("forecast uses matching dates and falls back when forecast missing", () => {
  const dates = ["2026-10-18", "2026-10-19"];
  const r = p.suggestWeek(
    dates,
    looks,
    [{ date: dates[0], temperature: 12 }],
    "auto",
    28,
  );
  assert.equal(looks.find((l) => l.id === r[dates[0]]).variant, "cold");
  assert.equal(looks.find((l) => l.id === r[dates[1]]).variant, "warm");
});
test("gym goal overrides cold weather for every day", () => {
  const dates = ["2026-10-18", "2026-10-19"];
  const r = p.suggestWeek(
    dates,
    looks,
    dates.map((date) => ({ date, temperature: 8 })),
    "gym",
  );
  for (const id of Object.values(r))
    assert.equal(looks.find((l) => l.id === id).variant, "gym");
});
test("swap preserves unrelated days and works across weeks", () => {
  assert.deepEqual(p.swapDays({ a: "x", b: "y", c: "z" }, "a", "b"), {
    a: "y",
    b: "x",
    c: "z",
  });
});
test("backup rejects invalid references and unsafe image sources", () => {
  const d = {
    version: 1,
    plan: { "2026-10-18": "missing" },
    saved: [],
    customLooks: [],
  };
  assert.throws(() => p.validateBackup(d, looks));
  d.plan = { "2026-10-18": looks[0].id };
  assert.deepEqual(p.validateBackup(d, looks), d);
  d.customLooks = [
    { ...looks[0], id: "custom-test", image: "javascript:alert(1)" },
  ];
  assert.throws(() => p.validateBackup(d, looks));
});
test("every look has a complete formula, with local art or an explicit source reference", () => {
  const fs = require("fs"),
    path = require("path");
  for (const l of looks) {
    assert.ok(l.pieces.length >= 4, l.id);
    assert.ok(l.tip.length > 20, l.id);
    if (l.image)
      assert.ok(
        fs.existsSync(path.join(__dirname, "../static", l.image)),
        l.image,
      );
    else {
      assert.equal(l.source, "matrix");
      assert.ok(l.sourceOutfit);
    }
  }
});
test("day, week, month views cover exact local dates including leap February", () => {
  assert.deepEqual(p.periodDates(new Date("2026-10-18T12:00:00"), "day"), [
    "2026-10-18",
  ]);
  assert.equal(
    p.periodDates(new Date("2026-10-18T12:00:00"), "week").length,
    7,
  );
  assert.equal(p.monthDates(new Date("2024-02-18T12:00:00")).length, 29);
  assert.equal(
    p.monthDates(new Date("2026-10-18T12:00:00")).at(-1),
    "2026-10-31",
  );
  assert.equal(
    p.dateKey(p.shiftPeriod(new Date("2026-01-31T12:00:00"), "month", 1)),
    "2026-02-28",
  );
  assert.equal(
    p.dateKey(p.shiftPeriod(new Date("2026-12-31T12:00:00"), "month", 1)),
    "2027-01-31",
  );
});
test("dates use nth occurrence of a weekday rather than calendar row", () => {
  assert.equal(p.rotationForDate("2026-10-18").name, "Ironman (Marvel)");
  assert.equal(p.rotationForDate("2026-10-22").name, "Kirito (SAO)");
  assert.equal(
    p.rotationForDate("2026-10-24").name,
    "Sung JinWoo (Solo Leveling)",
  );
  assert.equal(p.rotationForDate("2026-10-01").name, "Megumi (JJK)");
  assert.equal(p.rotationForDate("2026-10-29"), undefined);
});
test("each of the 28 source inspirations has cold, warm and gym formulas", () => {
  const matrix = require("../src/domain/matrix.json");
  for (const row of matrix)
    for (const variant of ["cold", "warm", "gym"])
      assert.ok(
        looks.find(
          (l) => l.rotationId === row.rotationId && l.variant === variant,
        ),
        row.name + " " + variant,
      );
});
test("monthly plans follow all 28 source slots without random repeats", () => {
  const dates = p.monthDates(new Date("2026-10-18T12:00:00"));
  for (const goal of ["warm", "cold", "gym"]) {
    const result = p.suggestWeek(dates, looks, [], goal);
    assert.equal(Object.keys(result).length, 28);
    const assigned = Object.entries(result).map(([date, id]) => {
      const l = looks.find((l) => l.id === id);
      assert.equal(l.rotationId, p.rotationForDate(date).rotationId);
      assert.equal(l.variant, goal);
      return l.rotationId;
    });
    assert.equal(new Set(assigned).size, 28);
    assert.ok(!result["2026-10-29"]);
  }
});
test("the same day keeps its character in every calendar view and weather mode", () => {
  const date = "2026-10-22";
  for (const list of [
    [date],
    p.weekDates(new Date(date + "T12:00:00")),
    p.monthDates(new Date(date + "T12:00:00")),
  ])
    for (const goal of ["auto", "warm", "cold", "gym"]) {
      const id = p.suggestWeek(list, looks, [{ date, temperature: 9 }], goal)[
        date
      ];
      assert.equal(looks.find((l) => l.id === id).character, "Kirito");
    }
});

test("moving a source inspiration to an extra date does not clone its default", () => {
  const moved = { "2026-10-29": "kirito-warm" };
  assert.equal(
    p.suggestWeek(["2026-10-22"], looks, [], "warm", 22, moved)["2026-10-22"],
    undefined,
  );
  const restored = p.suggestWeek(
    p.monthDates(new Date("2026-10-18T12:00:00")),
    looks,
    [],
    "warm",
    22,
    moved,
  );
  assert.equal(restored["2026-10-22"], "kirito-warm");
  assert.equal(restored["2026-10-29"], undefined);
});
