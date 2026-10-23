import React, { useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Plus,
  Grip,
  Snowflake,
  Sun,
  Dumbbell,
  SlidersHorizontal,
  ArrowUpRight,
} from "lucide-react";
import planner from "../domain/planner.cjs";
const {
  dateKey,
  periodDates,
  shiftPeriod,
  monthDates,
  rotationForDate,
  repeatedDates,
  outfitOptions,
} = planner;
const parse = (d) => new Date(d + "T12:00:00");
const format = (d, o) => parse(d).toLocaleDateString("en-US", o);
const modeIcons = { cold: Snowflake, warm: Sun, gym: Dumbbell };
export default function PlannerCalendar({
  overview,
  anchor,
  onAnchor,
  today,
  plan,
  looks,
  getLook,
  weather,
  goal,
  onGoal,
  optionPreference,
  onOptionPreference,
  manualTemp,
  onWeather,
  onGenerate,
  onOpen,
  onPick,
  onSwap,
}) {
  const [view, setView] = useState("week");
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem("ztyle-calendar-view");
      if (["day", "week", "month"].includes(stored)) setView(stored);
    } catch {}
  }, []);
  const chooseView = (next) => {
    setView(next);
    try {
      localStorage.setItem("ztyle-calendar-view", next);
    } catch {}
  };
  const currentView = overview ? "week" : view;
  const dates = periodDates(parse(anchor), currentView);
  const repeats = repeatedDates(plan, looks).filter((d) =>
    d.startsWith(anchor.slice(0, 7)),
  );
  const label =
    currentView === "month"
      ? format(anchor, { month: "long", year: "numeric" })
      : currentView === "day"
        ? format(anchor, {
            weekday: "long",
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        : `${format(dates[0], { month: "short", day: "numeric", year: "numeric" })} – ${format(dates[6], { month: "short", day: "numeric", year: "numeric" })}`;
  const offset =
    currentView === "month" ? (parse(dates[0]).getDay() + 6) % 7 : 0;
  return (
    <section className={"week-section calendar-section view-" + currentView}>
      <div className="section-heading">
        <div>
          <div className="eyebrow">YOUR ORIGINAL CHARACTER ROTATION</div>
          <h2>
            Your outfit rotation
            <span className="count-badge">
              {dates.length === 1 ? "1 day" : `${dates.length} days`}
            </span>
          </h2>
        </div>
        {!overview && (
          <div
            className="segmented calendar-view-switch"
            role="group"
            aria-label="Planner view"
          >
            {["day", "week", "month"].map((v) => (
              <button
                key={v}
                aria-pressed={view === v}
                onClick={() => chooseView(v)}
                className={view === v ? "selected" : ""}
              >
                {v[0].toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="calendar-navigation">
        <div className="calendar-actions">
          <button
            className="icon-btn"
            aria-label={"Previous " + currentView}
            onClick={() =>
              onAnchor(dateKey(shiftPeriod(parse(anchor), currentView, -1)))
            }
          >
            <ChevronLeft size={17} />
          </button>
          <span className="period-label" aria-live="polite">
            {label}
          </span>
          <button
            className="icon-btn"
            aria-label={"Next " + currentView}
            onClick={() =>
              onAnchor(dateKey(shiftPeriod(parse(anchor), currentView, 1)))
            }
          >
            <ChevronRight size={17} />
          </button>
          <button className="btn subtle" onClick={() => onAnchor(today)}>
            Today
          </button>
        </div>
        {!overview && (
          <button
            className="btn primary"
            onClick={() => onGenerate(dates, currentView)}
          >
            <Sparkles size={15} />
            Plan {currentView}
          </button>
        )}
      </div>
      {!overview && (
        <>
          <div className="planner-toolbar">
            <label>
              Plan for{" "}
              <select value={goal} onChange={(e) => onGoal(e.target.value)}>
                <option value="auto">The weather</option>
                <option value="warm">Warm days</option>
                <option value="cold">Cold days</option>
                <option value="gym">Gym sessions</option>
              </select>
            </label>
            <label>
              Outfits{" "}
              <select
                aria-label="Automatic outfit option"
                value={optionPreference}
                onChange={(e) => onOptionPreference(e.target.value)}
              >
                <option value="original">Original</option>
                <option value="alternative">Alternative</option>
                <option value="signature">Signature · Option 3</option>
                <option value="mix">Mix all options</option>
              </select>
            </label>
            <button className="text-btn" onClick={onWeather}>
              Weather & temperature <SlidersHorizontal size={14} />
            </button>
            <span>
              {weather ? "Forecast where available" : "Manual preview"} ·{" "}
              {manualTemp}°C fallback
            </span>
          </div>
          <div className="rotation-note">
            <Sparkles size={16} />
            <p>
              <b>Your Drive matrix sets the character.</b> Each date uses its
              first, second, third, or fourth weekday occurrence. Weather and
              gym mode change the outfit, never the inspiration. Fifth
              occurrences stay open because the source has no assignment.
            </p>
          </div>
          {repeats.length > 0 && (
            <div className="rotation-warning" role="status">
              <span>
                {repeats.length} repeated{" "}
                {repeats.length === 1 ? "assignment" : "assignments"} in{" "}
                {format(anchor, { month: "long" })}. Your existing plan is
                preserved.
              </span>
              <button
                className="text-btn"
                onClick={() => onGenerate(monthDates(parse(anchor)), "month")}
              >
                Restore matrix for this month <Sparkles size={14} />
              </button>
            </div>
          )}
        </>
      )}
      {currentView === "month" && (
        <div className="month-weekdays" aria-hidden="true">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>
      )}
      <div
        className={
          "week-grid " +
          (currentView === "month"
            ? "month-grid"
            : currentView === "day"
              ? "day-grid"
              : "")
        }
        aria-label={currentView + " outfit calendar"}
      >
        {Array.from({ length: offset }, (_, i) => (
          <div
            key={"blank-" + i}
            className="calendar-blank"
            aria-hidden="true"
          />
        ))}
        {dates.map((date) => {
          const look = getLook(date),
            reference = rotationForDate(date),
            isToday = date === today,
            forecast = weather?.days.find((d) => d.date === date),
            saved = Boolean(plan[date]),
            Icon = look ? modeIcons[look.variant] : CalendarDays;
          return (
            <article
              key={date}
              className={
                "day-card " +
                (isToday ? "today " : "") +
                (!look ? "open-day " : "") +
                (repeats.includes(date) ? "repeat-day" : "")
              }
              draggable={Boolean(look) && currentView !== "day"}
              onDragStart={(e) => e.dataTransfer.setData("text/plain", date)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const from = e.dataTransfer.getData("text/plain");
                if (dates.includes(from)) onSwap(from, date);
              }}
            >
              <div className="day-top">
                <span>{format(date, { weekday: "short" })}</span>
                <b>{format(date, { day: "2-digit" })}</b>
                {isToday ? (
                  <span className="today-pill">Today</span>
                ) : (
                  <Grip size={12} />
                )}
              </div>
              <button
                className="day-art"
                onClick={() => (look ? onOpen(look, date) : onPick(date))}
                aria-label={`${look ? "Edit" : "Choose outfit for"} ${format(date, { weekday: "long", month: "long", day: "numeric" })}${look ? ": " + look.name : ""}`}
              >
                {look ? (
                  look.image ? (
                    <img
                      src={look.image}
                      alt={`${look.character}: ${look.name}`}
                      loading="lazy"
                    />
                  ) : (
                    <span className="art-placeholder">
                      <CalendarDays size={32} />
                      {look.character}
                      <small>Outfit formula · artwork to come</small>
                    </span>
                  )
                ) : (
                  <span className="open-day-art">
                    <Plus size={24} />
                    <span>Choose a look</span>
                  </span>
                )}
              </button>
              <div className="day-info">
                <small title={look?.matrixLabel || look?.character}>
                  {look?.matrixLabel ||
                    look?.character ||
                    (reference
                      ? "Inspiration moved elsewhere"
                      : "No source assignment")}
                </small>
                <button
                  onClick={() => (look ? onOpen(look, date) : onPick(date))}
                >
                  {look?.name || "Keep this day open"}
                </button>
                <span className="day-weather">
                  <Icon size={12} />
                  {look
                    ? look.variant === "gym"
                      ? "Gym session"
                      : `${forecast?.temperature ?? manualTemp}° · ${forecast ? "Forecast" : "Preview"}`
                    : reference
                      ? "Choose a different inspiration"
                      : "Fifth occurrence · choose a look"}
                </span>
                {look && (
                  <span className="assignment-state">
                    {saved ? "Planned" : "Matrix default"} · Option{" "}
                    {look.option || 1}
                    {repeats.includes(date) ? " · Repeated character" : ""}
                  </span>
                )}
                {look &&
                  currentView !== "month" &&
                  outfitOptions(looks, look).length > 1 && (
                    <button
                      className="calendar-options-link"
                      onClick={() => onOpen(look, date)}
                    >
                      {outfitOptions(looks, look).length} outfit options{" "}
                      <ArrowUpRight size={12} />
                    </button>
                  )}
                {currentView === "day" && reference && (
                  <p className="matrix-day-reference">
                    {reference.week}
                    {["st", "nd", "rd", "th"][reference.week - 1]}{" "}
                    {reference.day} · {reference.name}
                  </p>
                )}
                {currentView === "day" && look && (
                  <div className="day-outfit-detail">
                    <h3>The outfit formula</h3>
                    <ul>
                      {look.pieces.map((p, i) => (
                        <li key={i}>
                          <small>{p.category}</small>
                          <span>{p.name}</span>
                        </li>
                      ))}
                    </ul>
                    <p>{look.tip}</p>
                    <button
                      className="btn subtle"
                      onClick={() => onOpen(look, date)}
                    >
                      Customize this day <ArrowUpRight size={15} />
                    </button>
                  </div>
                )}
                {!overview && currentView === "week" && look && (
                  <label className="swap-label">
                    Swap with
                    <select
                      aria-label={`Swap ${date} with another day`}
                      value=""
                      onChange={(e) => {
                        if (e.target.value) onSwap(date, e.target.value);
                      }}
                    >
                      <option value="">Choose day</option>
                      {dates
                        .filter((d) => d !== date)
                        .map((d) => (
                          <option key={d} value={d}>
                            {format(d, {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            })}
                          </option>
                        ))}
                    </select>
                  </label>
                )}
              </div>
            </article>
          );
        })}
      </div>
      <div className="section-foot">
        <span>
          <Grip size={13} />
          {currentView === "day"
            ? "Choose a look to customize your day."
            : "Drag to swap. Select any date to edit."}
        </span>
        <span>
          {dates.filter((d) => plan[d]).length} of {dates.length} days saved
        </span>
      </div>
    </section>
  );
}
