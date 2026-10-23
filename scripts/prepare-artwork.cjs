const fs = require("fs");
const c = require("../src/domain/catalog.json");
const {
  rotationForDate,
  addDays,
  dateKey,
} = require("../src/domain/planner.cjs");
const today = "2026-10-18",
  seen = new Set(),
  jobs = [];
for (let i = 0; i < 90; i++) {
  const date = dateKey(addDays(new Date(today + "T12:00:00"), i));
  const row = rotationForDate(date);
  if (!row || seen.has(row.rotationId)) continue;
  seen.add(row.rotationId);
  for (const variant of ["warm", "cold", "gym"]) {
    const look = c.find(
      (l) => l.rotationId === row.rotationId && l.variant === variant,
    );
    if (!look || look.image) continue;
    const prompt = require("./art-prompt.cjs")(look, row.name);
    jobs.push({
      id: look.id,
      date,
      variant,
      character: row.name,
      rotationId: row.rotationId,
      prompt,
    });
  }
}
fs.mkdirSync("reference/artwork-receipts", { recursive: true });
fs.writeFileSync(
  "reference/artwork-jobs.json",
  JSON.stringify(
    { started: today, tool: "built-in image_gen", total: jobs.length, jobs },
    null,
    2,
  ),
);
const registry = {
  updated: new Date().toISOString(),
  total: c.length,
  done: c.filter((l) => l.image).length,
  complete: c.every((l) => l.image),
  images: Object.fromEntries(
    c.filter((l) => l.image).map((l) => [l.id, l.image]),
  ),
};
fs.writeFileSync("static/artwork.json", JSON.stringify(registry));
fs.writeFileSync("public/artwork.json", JSON.stringify(registry));
console.log(
  JSON.stringify({
    missing: jobs.length,
    first: jobs
      .slice(0, 5)
      .map((j) => ({ id: j.id, date: j.date, character: j.character })),
  }),
);
