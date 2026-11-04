const dateKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}
function weekDates(date) {
  const d = new Date(date);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => dateKey(addDays(d, i)));
}
function monthDates(date) {
  const first = new Date(date.getFullYear(), date.getMonth(), 1, 12);
  const count = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  return Array.from({ length: count }, (_, i) => dateKey(addDays(first, i)));
}
function periodDates(date, view = "week") {
  return view === "month"
    ? monthDates(date)
    : view === "day"
      ? [dateKey(date)]
      : weekDates(date);
}
function shiftPeriod(date, view, direction) {
  if (view !== "month")
    return addDays(date, direction * (view === "day" ? 1 : 7));
  const first = new Date(
    date.getFullYear(),
    date.getMonth() + direction,
    1,
    12,
  );
  first.setDate(
    Math.min(
      date.getDate(),
      new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate(),
    ),
  );
  return first;
}
const characterKey = (name) => name.trim().toLowerCase().replace(/\s+/g, " ");
function variantFor(temperature, goal = "auto") {
  return goal === "auto" ? (temperature < 20 ? "cold" : "warm") : goal;
}
function outfitOptions(looks, look, variant = look.variant) {
  return looks
    .filter(
      (l) =>
        l.variant === variant &&
        (look.rotationId
          ? l.rotationId === look.rotationId
          : l.character === look.character),
    )
    .sort((a, b) => (a.option || 1) - (b.option || 1));
}
// The first/second/third/fourth occurrence of each weekday is defined by the source matrix.
const matrix = require("./matrix.json");
const calendarAdditions = require("./calendar-additions.json");
function rotationForDate(date, rows = matrix) {
  // Explicit user choices fill individual dates without changing the Drive rotation.
  const addition = rows === matrix && calendarAdditions.find((row) => row.date === date);
  if (addition) return addition;
  const d = new Date(date + "T12:00:00");
  const day = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ][d.getDay()];
  return rows.find(
    (row) => row.week === Math.ceil(d.getDate() / 7) && row.day === day,
  );
}
function suggestWeek(
  dates,
  looks,
  forecast = [],
  goal = "auto",
  fallback = 22,
  existingPlan = {},
  optionPreference = "original",
) {
  const result = {},
    replacing = new Set(dates);
  const byId = new Map(looks.map((l) => [l.id, l]));
  const reserved = new Set(
    Object.entries(existingPlan)
      .filter(([date, id]) => !replacing.has(date) && byId.has(id))
      .map(
        ([date, id]) =>
          date.slice(0, 7) +
          ":" +
          (byId.get(id).rotationId || characterKey(byId.get(id).character)),
      ),
  );
  for (const date of dates) {
    const row = rotationForDate(date);
    if (!row) continue;
    const day = forecast.find((d) => d.date === date);
    const variant = variantFor(day?.temperature ?? fallback, goal);
    const candidates = looks
      .filter((l) => l.rotationId === row.rotationId && l.variant === variant)
      .sort((a, b) => (a.option || 1) - (b.option || 1));
    const dayDate = new Date(date + "T12:00:00");
    const requestedOption =
      optionPreference === "signature"
        ? 3
        : optionPreference === "alternative"
          ? 2
          : optionPreference === "mix"
            ? ((dayDate.getMonth() + dayDate.getDate()) %
                Math.max(1, candidates.length)) +
              1
            : 1;
    const look =
      candidates.find((l) => (l.option || 1) === requestedOption) ||
      candidates[0];
    if (look && !reserved.has(date.slice(0, 7) + ":" + row.rotationId))
      result[date] = look.id;
  }
  return result;
}
function repeatedDates(plan, looks) {
  const seen = new Set(),
    repeats = [];
  const byId = new Map(looks.map((l) => [l.id, l]));
  for (const [date, id] of Object.entries(plan).sort(([a], [b]) =>
    a.localeCompare(b),
  )) {
    const look = byId.get(id);
    if (!look) continue;
    const key =
      date.slice(0, 7) +
      ":" +
      (look.rotationId || characterKey(look.character));
    if (seen.has(key)) repeats.push(date);
    else seen.add(key);
  }
  return repeats;
}
function swapDays(plan, from, to) {
  if (!from || from === to) return plan;
  return { ...plan, [to]: plan[from], [from]: plan[to] };
}
function validateBackup(data, baseLooks) {
  if (
    !data ||
    data.version !== 1 ||
    !Array.isArray(data.customLooks) ||
    !data.plan ||
    typeof data.plan !== "object" ||
    Array.isArray(data.plan) ||
    !Array.isArray(data.saved)
  )
    throw Error("Choose a valid Ztyle v1 backup.");
  const ids = new Set(baseLooks.map((l) => l.id));
  for (const l of data.customLooks) {
    if (
      !l ||
      typeof l.id !== "string" ||
      !l.id.startsWith("custom-") ||
      ids.has(l.id) ||
      typeof l.name !== "string" ||
      !l.name.trim() ||
      typeof l.character !== "string" ||
      !l.character.trim() ||
      !["cold", "warm", "gym"].includes(l.variant) ||
      !Array.isArray(l.pieces) ||
      !l.pieces.length ||
      l.pieces.some(
        (p) =>
          !p || typeof p.name !== "string" || typeof p.category !== "string",
      ) ||
      !Array.isArray(l.colors) ||
      l.colors.some((c) => !/^#[0-9a-f]{6}$/i.test(c)) ||
      typeof l.tip !== "string" ||
      typeof l.series !== "string" ||
      typeof l.image !== "string" ||
      (l.image && !/^data:image\/(png|jpeg|webp);base64,/.test(l.image)) ||
      (l.imageFull !== undefined &&
        (typeof l.imageFull !== "string" ||
          (l.imageFull &&
            !/^data:image\/(png|jpeg|webp);base64,/.test(l.imageFull)))) ||
      (l.annotations !== undefined &&
        (!Array.isArray(l.annotations) ||
          l.annotations.some((note) => typeof note !== "string")))
    )
      throw Error("A custom look in this backup is invalid.");
    ids.add(l.id);
  }
  for (const [date, id] of Object.entries(data.plan))
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      typeof id !== "string" ||
      !ids.has(id)
    )
      throw Error("The backup contains an invalid calendar assignment.");
  if (data.saved.some((id) => typeof id !== "string" || !ids.has(id)))
    throw Error("The backup contains an unknown saved look.");
  return {
    version: 1,
    plan: data.plan,
    customLooks: data.customLooks,
    saved: data.saved,
    ...(data.scheduleVersion === 2 ? { scheduleVersion: 2 } : {}),
  };
}
module.exports = {
  dateKey,
  addDays,
  weekDates,
  monthDates,
  rotationForDate,
  periodDates,
  shiftPeriod,
  repeatedDates,
  characterKey,
  variantFor,
  outfitOptions,
  suggestWeek,
  swapDays,
  validateBackup,
};
