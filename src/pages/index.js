import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Shirt,
  CalendarDays,
  LayoutGrid,
  Users,
  Bookmark,
  Settings,
  ArrowUpRight,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Sun,
  Snowflake,
  Dumbbell,
  Sparkles,
  MapPin,
  CloudSun,
  CloudRain,
  Check,
  Download,
  Upload,
  X,
  Grip,
  Wifi,
  WifiOff,
  RefreshCw,
  Heart,
  SlidersHorizontal,
  CheckCircle2,
  MoveRight,
  Maximize2,
} from "lucide-react";
import baseLooks from "../domain/catalog.json";
import matrix from "../domain/matrix.json";
import PlannerCalendar from "../components/PlannerCalendar";
import ArtworkViewer from "../components/ArtworkViewer";
import planner from "../domain/planner.cjs";
const {
  dateKey,
  weekDates,
  monthDates,
  characterKey,
  addDays,
  suggestWeek,
  outfitOptions,
  swapDays,
  validateBackup,
} = planner;
const KEY = "ztyle-wardrobe-v1";
const parseDate = (d) => new Date(d + "T12:00:00");
const fmt = (d, options) => parseDate(d).toLocaleDateString("en-US", options);
const modes = {
  cold: { label: "Cold weather", Icon: Snowflake },
  warm: { label: "Warm weather", Icon: Sun },
  gym: { label: "Gym session", Icon: Dumbbell },
};
const initialDate = "2026-10-18";
function Badge({ variant }) {
  const m = modes[variant] || modes.cold;
  return (
    <span className={"badge " + variant}>
      <m.Icon size={12} />
      {m.label}
    </span>
  );
}
function Colors({ colors }) {
  return (
    <span className="swatches" aria-label={"Palette: " + colors.join(", ")}>
      {colors.map((c, i) => (
        <i key={i} style={{ background: c }} title={c} />
      ))}
    </span>
  );
}
function Artwork({ look, ...props }) {
  return look.image ? (
    <img
      src={look.image}
      alt={`${look.character} inspiration: ${look.name}, ${look.variant} outfit`}
      {...props}
    />
  ) : (
    <div className="art-placeholder">
      <Shirt size={64} />
      <span>{look.character}</span>
      {look.option > 1 && <small>{look.optionLabel} artwork generating</small>}
    </div>
  );
}
function Dialog({ children, title, onClose, wide = false }) {
  const ref = useRef();
  const closeAction = useRef(onClose);
  closeAction.current = onClose;
  useEffect(() => {
    const before = document.activeElement;
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current.focus();
    const listener = (e) => {
      if (e.key === "Escape") closeAction.current();
      if (e.key === "Tab") {
        const els = ref.current.querySelectorAll(
          'button,input,select,textarea,a[href],[tabindex="0"]',
        );
        const first = els[0],
          last = els[els.length - 1];
        if (
          e.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === ref.current)
        ) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", listener);
    return () => {
      document.body.style.overflow = old;
      document.removeEventListener("keydown", listener);
      before?.focus();
    };
  }, []);
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        ref={ref}
        tabIndex={-1}
        className={"modal " + (wide ? "modal-wide" : "")}
      >
        <button
          className="icon-btn close"
          aria-label="Close dialog"
          onClick={onClose}
        >
          <X size={20} />
        </button>
        {children}
      </section>
    </div>
  );
}
export default function Home() {
  const [tab, setTab] = useState("Overview"),
    [today, setToday] = useState(initialDate),
    [anchor, setAnchor] = useState(initialDate),
    [plan, setPlan] = useState({}),
    [customLooks, setCustomLooks] = useState([]),
    [saved, setSaved] = useState([]),
    [ready, setReady] = useState(false),
    [storageStatus, setStorageStatus] = useState("Saved on this device");
  const [query, setQuery] = useState(""),
    [filter, setFilter] = useState("all"),
    [character, setCharacter] = useState("all"),
    [detail, setDetail] = useState(null),
    [targetDate, setTargetDate] = useState(initialDate),
    [modal, setModal] = useState(null),
    [notice, setNotice] = useState(""),
    [goal, setGoal] = useState("auto"),
    [manualTemp, setManualTemp] = useState(22),
    [weather, setWeather] = useState(null),
    [weatherBusy, setWeatherBusy] = useState(false),
    [location, setLocation] = useState("Bogotá"),
    [online, setOnline] = useState(true),
    [syncState, setSyncState] = useState(""),
    [syncEnabled, setSyncEnabled] = useState(false);
  const [expandedLook, setExpandedLook] = useState(null);
  const [optionPreference, setOptionPreference] = useState("original");
  const [artRegistry, setArtRegistry] = useState({
    images: {},
    complete: false,
  });
  const revision = useRef(null),
    importRef = useRef(),
    skipSync = useRef(false),
    stateRef = useRef(),
    timer = useRef(),
    remotePending = useRef(null),
    dirty = useRef(false);
  const looks = useMemo(
    () => [
      ...baseLooks.map((l) =>
        artRegistry.images[l.id]
          ? {
              ...l,
              image: artRegistry.images[l.id],
              imageFull: artRegistry.fullImages?.[l.id] || l.imageFull,
            }
          : l,
      ),
      ...customLooks,
    ],
    [customLooks, artRegistry],
  );
  useEffect(() => {
    let cancelled = false;
    async function refresh() {
      try {
        const res = await fetch("/artwork.json", { cache: "no-store" });
        if (!res.ok) return;
        const next = await res.json();
        if (!next.images || typeof next.images !== "object") return;
        if (!cancelled)
          setArtRegistry((prev) =>
            prev.updated === next.updated ? prev : next,
          );
      } catch {}
    }
    refresh();
    const interval = setInterval(refresh, artRegistry.complete ? 15000 : 3000);
    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
    };
  }, [artRegistry.complete]);
  useEffect(() => {
    const refreshImage = (current) =>
      current &&
      artRegistry.images[current.id] &&
      (current.image !== artRegistry.images[current.id] ||
        (artRegistry.fullImages?.[current.id] &&
          current.imageFull !== artRegistry.fullImages[current.id]))
        ? {
            ...current,
            image: artRegistry.images[current.id],
            imageFull:
              artRegistry.fullImages?.[current.id] || current.imageFull,
          }
        : current;
    setDetail(refreshImage);
    setExpandedLook(refreshImage);
  }, [artRegistry]);
  const dates = weekDates(parseDate(anchor));
  const characters = [...new Set(looks.map((l) => l.character))];
  const data = { version: 1, scheduleVersion: 2, plan, customLooks, saved };
  stateRef.current = data;
  useEffect(() => {
    const actual = dateKey(new Date());
    setToday(actual);
    setAnchor(actual);
    setTargetDate(actual);
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const d = validateBackup(JSON.parse(raw), baseLooks);
        if (d.scheduleVersion !== 2) {
          localStorage.setItem(KEY + "-before-matrix", raw);
          const customIds = new Set(d.customLooks.map((l) => l.id));
          setPlan(
            Object.fromEntries(
              Object.entries(d.plan).filter(([, id]) => customIds.has(id)),
            ),
          );
          setNotice(
            "Your calendar now follows the original Drive matrix. Your previous assignments are backed up in Settings.",
          );
        } else setPlan(d.plan);
        setCustomLooks(d.customLooks);
        setSaved(d.saved);
      }
      const prefs = JSON.parse(
        localStorage.getItem("ztyle-preferences") || "null",
      );
      if (prefs) {
        if (
          ["original", "alternative", "signature", "mix"].includes(
            prefs.optionPreference,
          )
        )
          setOptionPreference(prefs.optionPreference);
        if (["auto", "warm", "cold", "gym"].includes(prefs.goal))
          setGoal(prefs.goal);
        if (Number.isFinite(prefs.temperature))
          setManualTemp(prefs.temperature);
      }
      const w = localStorage.getItem("ztyle-weather");
      if (w) {
        const parsed = JSON.parse(w);
        if (parsed && Array.isArray(parsed.days)) {
          setWeather(parsed);
          setLocation(parsed.location);
        }
      }
    } catch {
      setNotice(
        "Your saved data could not be loaded. You can restore a JSON backup in Settings.",
      );
    }
    setOnline(navigator.onLine);
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    setReady(true);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
      setStorageStatus("Saved on this device");
    } catch {
      setStorageStatus("Storage full — export a backup");
      setNotice(
        "Device storage is full. Export your wardrobe in Settings to preserve these changes.",
      );
    }
  }, [ready, plan, customLooks, saved]);
  useEffect(() => {
    if (ready)
      try {
        localStorage.setItem(
          "ztyle-preferences",
          JSON.stringify({ goal, temperature: manualTemp, optionPreference }),
        );
      } catch {}
  }, [ready, goal, manualTemp, optionPreference]);
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(""), 6500);
    return () => clearTimeout(t);
  }, [notice]);
  useEffect(() => {
    if (!syncEnabled || !ready || skipSync.current) {
      skipSync.current = false;
      return;
    }
    let cancelled = false;
    dirty.current = true;
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        setSyncState("Syncing…");
        const r = await fetch("/api/state", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "If-Match": String(revision.current),
          },
          body: JSON.stringify(stateRef.current),
        });
        if (r.status === 409) {
          setSyncEnabled(false);
          setSyncState(
            "Another device changed the plan. Pull the shared copy to continue.",
          );
          return;
        }
        if (!r.ok) throw Error();
        const result = await r.json();
        revision.current = result.revision;
        dirty.current = false;
        if (!cancelled) setSyncState("Shared across your LAN");
      } catch {
        if (!cancelled) setSyncState("Offline — changes stay on this device");
      }
    }, 600);
    return () => {
      cancelled = true;
      clearTimeout(timer.current);
    };
  }, [syncEnabled, plan, customLooks, saved, ready]);
  useEffect(() => {
    if (!syncEnabled) return;
    const id = setInterval(async () => {
      if (dirty.current) return;
      try {
        const r = await fetch("/api/state");
        if (!r.ok) return;
        const d = await r.json();
        if (!dirty.current && d.revision !== revision.current && d.state) {
          revision.current = d.revision;
          skipSync.current = true;
          applyData(d.state);
          setSyncState("Shared across your LAN");
        }
      } catch {}
    }, 8000);
    return () => clearInterval(id);
  }, [syncEnabled]);
  const applyData = (d) => {
    const v = validateBackup(d, baseLooks);
    setPlan(v.plan);
    setCustomLooks(v.customLooks);
    setSaved(v.saved);
  };
  const orderedDates = (list) =>
    [...list].sort((a, b) => {
      if (a >= today && b < today) return -1;
      if (a < today && b >= today) return 1;
      return a.localeCompare(b);
    });
  const suggestions = useMemo(() => {
    const months = [...new Set([...dates, today].map((d) => d.slice(0, 7)))];
    return Object.assign(
      {},
      ...months.map((month) => {
        const available = orderedDates(
          monthDates(parseDate(month + "-01")).filter((d) => !plan[d]),
        );
        return suggestWeek(
          available,
          looks,
          weather?.days,
          goal,
          manualTemp,
          plan,
          optionPreference,
        );
      }),
    );
  }, [anchor, today, plan, looks, weather, goal, manualTemp, optionPreference]);
  const getLook = (date) =>
    looks.find((l) => l.id === (plan[date] || suggestions[date]));
  const pickLook = (date) => {
    setTargetDate(date);
    setModal("pick");
  };
  const shown = looks.filter(
    (l) =>
      (filter === "all" || l.variant === filter) &&
      (character === "all" || l.character === character) &&
      (tab !== "Saved looks" || saved.includes(l.id)) &&
      `${l.name} ${l.character} ${l.series} ${l.pieces.map((p) => p.name).join(" ")}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const todayLook = getLook(today);
  const forecastToday = weather?.days.find((d) => d.date === today);
  const freshWeather =
    weather && Date.now() - new Date(weather.updated).getTime() < 6 * 3600000;
  const currentTemp = forecastToday?.temperature ?? manualTemp;
  const navigate = (t) => {
    setTab(t);
    setQuery("");
    setFilter("all");
    setCharacter("all");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const openLook = (look, date) => {
    setTargetDate(date || today);
    setDetail(look);
  };
  const toggleSave = (id) =>
    setSaved((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  function generate(selectedDates = dates, period = "week") {
    const next = suggestWeek(
      orderedDates(selectedDates),
      looks,
      weather?.days,
      goal,
      manualTemp,
      plan,
      optionPreference,
    );
    setPlan((p) => {
      const updated = { ...p };
      for (const date of selectedDates) delete updated[date];
      return { ...updated, ...next };
    });
    const open = selectedDates.length - Object.keys(next).length;
    setNotice(
      `${Object.keys(next).length} matrix outfits planned for this ${period}.${open ? ` ${open} dates left open: no source slot, or the inspiration is already scheduled elsewhere.` : ""}`,
    );
  }
  async function fetchWeather(useGPS = false) {
    setWeatherBusy(true);
    try {
      let lat = 4.711,
        lon = -74.0721,
        name = location.trim() || "Bogotá";
      if (useGPS) {
        const pos = await new Promise((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 10000,
          }),
        );
        lat = pos.coords.latitude;
        lon = pos.coords.longitude;
        name = "Your location";
      } else {
        const geo = await fetch(
          "https://geocoding-api.open-meteo.com/v1/search?name=" +
            encodeURIComponent(name) +
            "&count=1&language=en&format=json",
          { signal: AbortSignal.timeout(12000) },
        );
        const g = await geo.json();
        if (!g.results?.length)
          throw Error("City not found. Try a nearby city.");
        lat = g.results[0].latitude;
        lon = g.results[0].longitude;
        name = g.results[0].name;
      }
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,weather_code&current=temperature_2m&timezone=auto&forecast_days=7`,
        { signal: AbortSignal.timeout(12000) },
      );
      if (!res.ok)
        throw Error(
          "Weather is unavailable. Your manual temperature still works.",
        );
      const w = await res.json();
      const result = {
        location: name,
        updated: new Date().toISOString(),
        days: w.daily.time.map((date, i) => ({
          date,
          temperature: Math.round(w.daily.temperature_2m_max[i]),
          code: w.daily.weather_code[i],
        })),
      };
      setWeather(result);
      setLocation(name);
      try {
        localStorage.setItem("ztyle-weather", JSON.stringify(result));
      } catch {}
      setNotice("Weather updated. Plan your week to apply the forecast.");
    } catch (e) {
      setNotice(
        e.message ||
          "Could not fetch weather. Use the manual temperature while offline.",
      );
    } finally {
      setWeatherBusy(false);
    }
  }
  function exportData() {
    const blob = new Blob([JSON.stringify(stateRef.current, null, 2)], {
        type: "application/json",
      }),
      url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = `ztyle-wardrobe-${today}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function exportPreviousPlan() {
    const raw = localStorage.getItem(KEY + "-before-matrix");
    if (!raw) {
      setNotice("No previous calendar backup on this device.");
      return;
    }
    const url = URL.createObjectURL(
      new Blob([raw], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "ztyle-before-matrix.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function importData(e) {
    const f = e.target.files[0];
    if (!f) return;
    try {
      if (f.size > 8e6) throw Error("Choose a backup smaller than 8 MB.");
      const d = JSON.parse(await f.text());
      validateBackup(d, baseLooks);
      remotePending.current = d;
      setModal("import-confirm");
    } catch (err) {
      setNotice(err.message);
    }
    e.target.value = "";
  }
  async function connectSync() {
    try {
      const r = await fetch("/api/state");
      if (!r.ok) throw Error();
      const d = await r.json();
      revision.current = d.revision;
      if (d.state) {
        validateBackup(d.state, baseLooks);
        remotePending.current = d.state;
        setModal("sync-confirm");
      } else {
        setSyncEnabled(true);
        setSyncState("Connecting…");
      }
    } catch {
      setSyncState(
        "Shared sync requires the included local server (npm start).",
      );
    }
  }
  function swap(from, to) {
    if (from === to) return;
    const fromLook = getLook(from),
      toLook = getLook(to);
    setPlan((p) => {
      const next = { ...p };
      delete next[from];
      delete next[to];
      if (fromLook) next[to] = fromLook.id;
      if (toLook) next[from] = toLook.id;
      return next;
    });
    setNotice("Outfits swapped.");
  }
  const nav = [
    ["Overview", LayoutGrid],
    ["Planner", CalendarDays],
    ["Lookbook", Shirt],
    ["Characters", Users],
    ["Saved looks", Bookmark],
  ];
  const pageTitles = {
    Overview: [
      "Dress with character.",
      "A little anime inspiration. A wardrobe that’s entirely you.",
    ],
    Planner: [
      "Your rotation, styled.",
      "Less deciding. More getting out the door.",
    ],
    Lookbook: [
      "Find your next look.",
      "Real-world outfits, with a little main-character energy.",
    ],
    Characters: [
      "A cast of inspirations.",
      "Signature palettes. Everyday interpretations. Your own point of view.",
    ],
    "Saved looks": [
      "The ones you love.",
      "A personal shortlist for your next outfit.",
    ],
  };
  return (
    <div className="app">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <aside className="sidebar">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            navigate("Overview");
          }}
          className="logo"
          aria-label="Ztyle home"
        >
          <span className="logo-mark">
            <Shirt size={23} />
          </span>
          ztyle<span className="logo-dot">.</span>
        </a>
        <div className="workspace-label">YOUR WARDROBE</div>
        <nav aria-label="Main navigation">
          {nav.map(([label, Icon]) => (
            <button
              key={label}
              aria-label={label}
              title={label}
              onClick={() => navigate(label)}
              className={tab === label ? "nav-item active" : "nav-item"}
              aria-current={tab === label ? "page" : undefined}
            >
              <Icon size={18} />
              <span>{label}</span>
              {label === "Saved looks" && <small>{saved.length}</small>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="studio-note">
            <span className="tiny-icon">
              <Sparkles size={18} />
            </span>
            <strong>
              Inspired by anime.
              <br />
              Made for real life.
            </strong>
            <p>Your style, beyond the screen.</p>
            <span>172 cm · Casual & cool</span>
          </div>
          <button className="nav-item" onClick={() => setModal("settings")}>
            <Settings size={18} />
            Settings & storage
          </button>
          <div className="profile">
            <div className="avatar">Z</div>
            <div>
              <b>Your style studio</b>
              <span>Personal wardrobe</span>
            </div>
            <span className="live-dot" />
          </div>
        </div>
      </aside>
      <div className="app-body">
        <header className="topbar">
          <div className="breadcrumb">
            My wardrobe <span>/</span> <b>{tab}</b>
          </div>
          <div className="top-actions">
            <span className="save-state">
              <span className="live-dot" />
              {syncEnabled ? "LAN sync on" : storageStatus}
            </span>
            <button
              className="icon-btn mobile-settings"
              onClick={() => setModal("settings")}
              aria-label="Settings"
            >
              <Settings size={18} />
            </button>
            {artRegistry.total && (
              <span className="artwork-progress" role="status">
                {artRegistry.complete
                  ? "Artwork complete"
                  : `Artwork studio · ${artRegistry.done}/${artRegistry.total}`}
              </span>
            )}
            <div className="avatar small">Z</div>
          </div>
        </header>
        <main id="main">
          <div className="page-heading">
            <div>
              <div className="eyebrow">THE EVERYDAY CHARACTER EDIT</div>
              <h1>{pageTitles[tab][0]}</h1>
              <p>{pageTitles[tab][1]}</p>
            </div>
            <button
              className="btn primary"
              onClick={() => {
                setModal("add");
              }}
            >
              <Plus size={16} />
              Add a look
            </button>
          </div>
          {tab === "Overview" && (
            <>
              <div className="overview-grid">
                {todayLook ? (
                  <section className="hero">
                    <div className="hero-content">
                      <div className="eyebrow">
                        <span className="live-dot" />
                        YOUR LOOK FOR TODAY{" "}
                        <span className="hero-date">
                          {fmt(today, { month: "short", day: "numeric" })}
                        </span>
                      </div>
                      <div className="hero-edition">
                        {todayLook.character === "Sung Jinwoo"
                          ? "THE SHADOW EDIT"
                          : todayLook.character === "Kirito"
                            ? "THE MIDNIGHT EDIT"
                            : "THE CHARACTER EDIT"}
                      </div>
                      <h2>
                        {todayLook.name}
                        <span>.</span>
                      </h2>
                      <p>
                        {todayLook.character} inspired.
                        <br />
                        {todayLook.variant === "cold"
                          ? "Easy layers. Everyday confidence."
                          : todayLook.variant === "gym"
                            ? "Show up. Move freely. Level up."
                            : "Light layers. Effortlessly cool."}
                      </p>
                      <Badge variant={todayLook.variant} />
                      <div className="hero-palette">
                        <Colors colors={todayLook.colors} />
                        <span>Your daily palette</span>
                      </div>
                      <button
                        className="btn dark"
                        onClick={() => openLook(todayLook, today)}
                      >
                        Explore this look <ArrowUpRight size={17} />
                      </button>
                    </div>
                    <div className="hero-image">
                      <div className="hero-orbit" />
                      <Artwork look={todayLook} />
                      <span className="art-credit">
                        ANIME-INSPIRED / EVERYDAY WEAR
                      </span>
                    </div>
                  </section>
                ) : (
                  <section className="hero hero-open">
                    <div className="hero-content">
                      <div className="eyebrow">YOUR LOOK FOR TODAY</div>
                      <h2>A fresh inspiration awaits.</h2>
                      <p>
                        Your matrix has no fifth-occurrence assignment for
                        today. Pick a character to make this extra day your own.
                      </p>
                      <button
                        className="btn dark"
                        onClick={() => pickLook(today)}
                      >
                        Choose today’s look <Plus size={16} />
                      </button>
                    </div>
                    <CalendarDays size={90} />
                  </section>
                )}
                <section className="weather-panel">
                  <div className="panel-top">
                    <span className="eyebrow">DRESS FOR YOUR DAY</span>
                    <CloudSun size={21} />
                  </div>
                  <div className="weather-location">
                    <MapPin size={13} />
                    {location}
                    <span
                      className={
                        "weather-status " + (freshWeather ? "fresh" : "")
                      }
                    >
                      {weather
                        ? freshWeather
                          ? "Live forecast"
                          : "Cached forecast"
                        : "Manual preview"}
                    </span>
                  </div>
                  <div className="temperature">
                    {currentTemp}
                    <span>°</span>
                    <CloudSun size={48} strokeWidth={1} />
                  </div>
                  <p className="weather-description">
                    {forecastToday
                      ? forecastToday.code > 50
                        ? "A little rain in the forecast."
                        : "Your forecast, factored into your fit."
                      : "Set the mood. We’ll find the layers."}
                  </p>
                  <div className="weather-rule" />
                  <label className="field-label" htmlFor="goal">
                    WHAT’S THE PLAN?
                  </label>
                  <select
                    id="goal"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                  >
                    <option value="auto">Match the weather</option>
                    <option value="warm">Keep it light · Warm</option>
                    <option value="cold">Layer up · Cold</option>
                    <option value="gym">Get moving · Gym</option>
                  </select>
                  <button
                    className="btn primary full"
                    onClick={() => generate()}
                  >
                    <Sparkles size={15} />
                    Plan my week
                    <ArrowRight size={15} />
                  </button>
                  <button
                    className="text-btn weather-link"
                    onClick={() => setModal("weather")}
                  >
                    <MapPin size={12} />
                    Set location & weather
                  </button>
                </section>
              </div>
              <div className="overview-stats">
                <span>
                  <b>{looks.length}</b> curated looks
                </span>
                <span>
                  <b>{characters.length}</b> character inspirations
                </span>
                <span>
                  <b>3</b> ways to wear them
                </span>
                <span className="offline-note">
                  <WifiOff size={14} />
                  Offline-friendly. Always yours.
                </span>
              </div>
            </>
          )}
          {(tab === "Overview" || tab === "Planner") && (
            <PlannerCalendar
              overview={tab === "Overview"}
              anchor={anchor}
              onAnchor={setAnchor}
              today={today}
              plan={plan}
              looks={looks}
              getLook={getLook}
              weather={weather}
              goal={goal}
              onGoal={setGoal}
              optionPreference={optionPreference}
              onOptionPreference={setOptionPreference}
              manualTemp={manualTemp}
              onWeather={() => setModal("weather")}
              onGenerate={generate}
              onOpen={openLook}
              onPick={pickLook}
              onSwap={swap}
            />
          )}
          {(tab === "Overview" ||
            tab === "Lookbook" ||
            tab === "Saved looks") && (
            <section className="catalog-section">
              <div className="section-heading">
                <div>
                  <div className="eyebrow">
                    {tab === "Saved looks"
                      ? "YOUR PERSONAL SHORTLIST"
                      : "FIND YOUR EVERYDAY ALTER EGO"}
                  </div>
                  <h2>
                    {tab === "Saved looks" ? "Saved looks" : "The lookbook"}
                    <span className="count-badge">{shown.length} looks</span>
                  </h2>
                </div>
                {tab === "Overview" && (
                  <button
                    className="text-btn"
                    onClick={() => navigate("Lookbook")}
                  >
                    Explore the collection <ArrowRight size={16} />
                  </button>
                )}
              </div>
              <div className="catalog-controls">
                <div className="segmented" aria-label="Filter by variant">
                  {[
                    ["all", "All looks", LayoutGrid],
                    ["warm", "Warm", Sun],
                    ["cold", "Cold", Snowflake],
                    ["gym", "Gym", Dumbbell],
                  ].map(([id, label, Icon]) => (
                    <button
                      key={id}
                      className={filter === id ? "selected" : ""}
                      aria-pressed={filter === id}
                      onClick={() => setFilter(id)}
                    >
                      <Icon size={14} />
                      {label}
                    </button>
                  ))}
                </div>
                <div className="search-controls">
                  <label className="search">
                    <Search size={16} />
                    <input
                      placeholder="Find a look, character, or item…"
                      aria-label="Search looks"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                    {query && (
                      <button
                        className="icon-btn"
                        aria-label="Clear search"
                        onClick={() => setQuery("")}
                      >
                        <X size={14} />
                      </button>
                    )}
                  </label>
                  <select
                    aria-label="Filter by character"
                    value={character}
                    onChange={(e) => setCharacter(e.target.value)}
                  >
                    <option value="all">All characters</option>
                    {characters.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="look-grid">
                {shown
                  .slice(
                    0,
                    tab === "Overview" &&
                      filter === "all" &&
                      !query &&
                      character === "all"
                      ? 4
                      : undefined,
                  )
                  .map((look) => (
                    <article className="look-card" key={look.id}>
                      <div className="look-art">
                        <button
                          className="art-open"
                          onClick={() => openLook(look)}
                        >
                          <Artwork look={look} loading="lazy" />
                        </button>
                        <span className="card-variant">
                          <Badge variant={look.variant} />
                        </span>
                        <button
                          className={
                            "save-look " +
                            (saved.includes(look.id) ? "is-saved" : "")
                          }
                          aria-label={
                            (saved.includes(look.id) ? "Unsave " : "Save ") +
                            look.name
                          }
                          aria-pressed={saved.includes(look.id)}
                          onClick={() => toggleSave(look.id)}
                        >
                          <Bookmark
                            size={17}
                            fill={
                              saved.includes(look.id) ? "currentColor" : "none"
                            }
                          />
                        </button>
                        {look.option === 3 ? (
                          <span className="original-tag">
                            OPTION 3 · SIGNATURE GUIDE
                          </span>
                        ) : look.option === 2 ? (
                          <span className="original-tag">
                            OPTION 2 · ALTERNATIVE
                          </span>
                        ) : look.source === "original" ? (
                          <span className="original-tag">STUDIO ORIGINAL</span>
                        ) : null}
                      </div>
                      <div className="look-info">
                        <span className="look-character">
                          {look.character}
                          <ArrowUpRight size={14} />
                        </span>
                        <button
                          className="look-title"
                          onClick={() => openLook(look)}
                        >
                          {look.name}
                        </button>
                        <div className="look-meta">
                          <span>
                            {look.pieces.length} pieces · {look.series}
                          </span>
                          <Colors colors={look.colors} />
                        </div>
                      </div>
                    </article>
                  ))}
              </div>
              {!shown.length && (
                <div className="empty-state">
                  <Shirt size={35} />
                  <h3>
                    {tab === "Saved looks"
                      ? "A little inspiration, worth keeping."
                      : "No looks found."}
                  </h3>
                  <p>
                    {tab === "Saved looks"
                      ? "Tap the bookmark on any look to save it here."
                      : "Try another character, variant, or search."}
                  </p>
                  <button
                    className="btn subtle"
                    onClick={() => {
                      setQuery("");
                      setFilter("all");
                      setCharacter("all");
                      if (tab === "Saved looks") navigate("Lookbook");
                    }}
                  >
                    {tab === "Saved looks"
                      ? "Browse the lookbook"
                      : "Clear filters"}
                  </button>
                </div>
              )}
            </section>
          )}
          {tab === "Characters" && (
            <>
              <div className="character-grid">
                {characters.map((c) => {
                  const own = looks.filter((l) => l.character === c),
                    l = own[0];
                  return (
                    <article className="character-card" key={c}>
                      <button
                        className="character-art"
                        onClick={() => {
                          navigate("Lookbook");
                          setCharacter(c);
                        }}
                      >
                        <Artwork look={l} loading="lazy" />
                      </button>
                      <div>
                        <span className="eyebrow">{l.series}</span>
                        <h2>{c}</h2>
                        <Colors colors={l.colors} />
                        <p>
                          {own.length} looks ·{" "}
                          {own.map((l) => l.variant).join(" / ")}
                        </p>
                        <button
                          className="text-btn"
                          onClick={() => {
                            navigate("Lookbook");
                            setCharacter(c);
                          }}
                        >
                          Explore looks <ArrowRight size={15} />
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
              <section className="matrix-section">
                <div className="section-heading">
                  <div>
                    <div className="eyebrow">FROM YOUR CHARACTER MATRIX</div>
                    <h2>More characters, more possibilities.</h2>
                  </div>
                  <button
                    className="btn subtle"
                    onClick={() => setModal("add")}
                  >
                    <Plus size={15} />
                    Create a look
                  </button>
                </div>
                <p className="muted">
                  Your original 4-week inspiration rotation. Turn any reference
                  into a new casual look.
                </p>
                <div className="matrix-grid">
                  {matrix.map((m, i) => (
                    <button
                      key={i}
                      className="matrix-item"
                      onClick={() => {
                        remotePending.current = m;
                        setModal("matrix");
                      }}
                    >
                      <span>
                        W{m.week} · {m.day}
                      </span>
                      <b>{m.name}</b>
                      <ArrowUpRight size={16} />
                    </button>
                  ))}
                </div>
              </section>
            </>
          )}
          <footer>
            <span className="footer-brand">
              ztyle<span>.</span>
            </span>
            <span>Wear the inspiration. Make it yours.</span>
            <span>
              <span className="live-dot" />
              {online
                ? "Local-first by design"
                : "Offline · Your wardrobe is here"}
            </span>
          </footer>
        </main>
      </div>
      {modal === "pick" && (
        <Dialog
          title="Choose a look for this date"
          onClose={() => setModal(null)}
        >
          <div className="eyebrow">
            {fmt(targetDate, {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </div>
          <h2>Make this day yours.</h2>
          <p className="muted">
            Your matrix controls the default inspiration. Choose another look to
            make a manual exception for this date.
          </p>
          <div className="date-look-picker">
            {looks.map((l) => {
              const used = Object.entries(plan).some(
                ([d, id]) =>
                  d !== targetDate &&
                  d.startsWith(targetDate.slice(0, 7)) &&
                  characterKey(
                    looks.find((v) => v.id === id)?.character || "",
                  ) === characterKey(l.character),
              );
              return (
                <button
                  key={l.id}
                  onClick={() => {
                    setModal(null);
                    openLook(l, targetDate);
                  }}
                >
                  <span>
                    <b>{l.name}</b>
                    <small>
                      {l.character} · {modes[l.variant].label}
                    </small>
                    {used && (
                      <small className="repeat-label">
                        Already planned this month
                      </small>
                    )}
                  </span>
                  <ArrowRight size={16} />
                </button>
              );
            })}
          </div>
        </Dialog>
      )}
      {expandedLook && (
        <ArtworkViewer
          look={expandedLook}
          onClose={() => setExpandedLook(null)}
        />
      )}
      {detail && !expandedLook && (
        <Dialog title={detail.name} onClose={() => setDetail(null)} wide>
          <div className="detail-grid">
            <div className="detail-art">
              <button
                className="detail-expand-art"
                onClick={() => setExpandedLook(detail)}
                disabled={!detail.image}
                aria-label="Expand outfit image full screen"
                data-expand-artwork
              >
                <Artwork look={detail} />
                <span className="expand-image-label">
                  <Maximize2 size={17} /> Expand image
                </span>
              </button>
              <span className="detail-credit">
                {detail.source === "original"
                  ? "Studio original · Flat anime · 172 cm frame"
                  : detail.source === "draft"
                    ? "Illustration from your original draft"
                    : ["matrix", "alternative", "signature"].includes(
                          detail.source,
                        )
                      ? detail.image
                        ? "Studio original · Flat anime · 172 cm frame"
                        : "Matrix outfit · Illustration generating"
                      : "Your custom look"}
              </span>
            </div>
            <div className="detail-content">
              <div className="eyebrow">
                {detail.series} / {detail.character}
              </div>
              <h2>{detail.name}</h2>
              <div className="detail-badges">
                <Badge variant={detail.variant} />
                <button
                  className="text-btn"
                  onClick={() => toggleSave(detail.id)}
                >
                  <Bookmark
                    size={15}
                    fill={saved.includes(detail.id) ? "currentColor" : "none"}
                  />
                  {saved.includes(detail.id) ? "Saved" : "Save look"}
                </button>
              </div>
              <div
                className="variant-options"
                role="group"
                aria-label="Outfit variant"
              >
                {["cold", "warm", "gym"]
                  .filter((v) => outfitOptions(looks, detail, v).length)
                  .map((v) => (
                    <button
                      key={v}
                      className={detail.variant === v ? "selected" : ""}
                      aria-pressed={detail.variant === v}
                      onClick={() => {
                        const options = outfitOptions(looks, detail, v);
                        setDetail(
                          options.find(
                            (l) => (l.option || 1) === (detail.option || 1),
                          ) || options[0],
                        );
                      }}
                    >
                      {modes[v].label}
                    </button>
                  ))}
              </div>
              <div
                className="outfit-option-selector"
                role="group"
                aria-label="Outfit options"
              >
                {outfitOptions(looks, detail).map((l) => (
                  <button
                    key={l.id}
                    aria-pressed={l.id === detail.id}
                    className={l.id === detail.id ? "selected" : ""}
                    onClick={() => setDetail(l)}
                  >
                    <b>Option {l.option || 1}</b>
                    <span>{l.optionLabel || "Original"}</span>
                    {!l.image && <small>Artwork generating</small>}
                  </button>
                ))}
              </div>
              <h3>The outfit formula</h3>
              <div className="piece-list">
                {detail.pieces.map((p, i) => (
                  <div key={i}>
                    <span className="piece-number">0{i + 1}</span>
                    <div>
                      <small>{p.category}</small>
                      <p>{p.name}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="style-tip">
                <Sparkles size={17} />
                <div>
                  <b>Make it yours</b>
                  <p>{detail.tip}</p>
                </div>
              </div>
              <div className="detail-palette">
                <span>Your palette</span>
                <Colors colors={detail.colors} />
              </div>
              {detail.annotations?.length > 0 && (
                <details className="artwork-notes">
                  <summary>Artwork legend & branding notes</summary>
                  <ul>
                    {detail.annotations.map((note) => (
                      <li key={note}>{note}</li>
                    ))}
                  </ul>
                </details>
              )}
              <label className="field-label" htmlFor="assign-date">
                ADD TO YOUR ROTATION
              </label>
              {Object.entries(plan).some(
                ([d, id]) =>
                  d !== targetDate &&
                  d.startsWith(targetDate.slice(0, 7)) &&
                  characterKey(
                    looks.find((l) => l.id === id)?.character || "",
                  ) === characterKey(detail.character),
              ) && (
                <p className="manual-repeat-note">
                  {detail.character} is already planned this month. Saving this
                  look makes a manual exception to your rotation.
                </p>
              )}
              <div className="assign-control">
                <input
                  id="assign-date"
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                />
                <button
                  disabled={!targetDate}
                  className="btn primary"
                  onClick={() => {
                    setPlan((p) => ({ ...p, [targetDate]: detail.id }));
                    setNotice(
                      `Look saved for ${fmt(targetDate, { month: "short", day: "numeric" })}.`,
                    );
                    setDetail(null);
                  }}
                >
                  Wear this look
                  <ArrowRight size={15} />
                </button>
              </div>
              {plan[targetDate] && (
                <button
                  className="text-btn"
                  onClick={() => {
                    setPlan((p) => {
                      const next = { ...p };
                      delete next[targetDate];
                      return next;
                    });
                    setDetail(null);
                    setNotice(
                      "Saved assignment removed. This date can show a fresh suggestion.",
                    );
                  }}
                >
                  Remove saved assignment for this date
                </button>
              )}
            </div>
          </div>
        </Dialog>
      )}
      {modal === "weather" && (
        <Dialog title="Location and weather" onClose={() => setModal(null)}>
          <div className="modal-title-icon">
            <CloudSun />
          </div>
          <div className="eyebrow">THE FORECAST, IN YOUR WARDROBE</div>
          <h2>Dress for the day.</h2>
          <p className="muted">
            Fetch a 7-day forecast, or set a temperature for offline planning.
            Below 20°C suggests layers.
          </p>
          <label className="field-label" htmlFor="city">
            CITY
          </label>
          <div className="assign-control">
            <input
              id="city"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
            <button
              className="btn primary"
              disabled={weatherBusy}
              onClick={() => fetchWeather()}
            >
              {weatherBusy ? "Fetching…" : "Get forecast"}
            </button>
          </div>
          <button
            className="text-btn"
            disabled={weatherBusy}
            onClick={() => fetchWeather(true)}
          >
            <MapPin size={14} />
            Use my location
          </button>
          <div className="divider" />
          <label className="field-label" htmlFor="temp">
            MANUAL TEMPERATURE · {manualTemp}°C
          </label>
          <input
            id="temp"
            type="range"
            min="0"
            max="40"
            value={manualTemp}
            onChange={(e) => setManualTemp(Number(e.target.value))}
          />
          <p className="muted">
            Used for dates without forecast data.{" "}
            {manualTemp < 20
              ? "Hoodies and light jackets."
              : "Breathable tees and easy shorts."}
          </p>
          {weather && (
            <p className="weather-source">
              {weather.location} · Updated{" "}
              {new Date(weather.updated).toLocaleString()}
              <br />
              Forecast by{" "}
              <a
                href="https://open-meteo.com/"
                target="_blank"
                rel="noreferrer"
              >
                Open-Meteo
              </a>
              . Day cards use the daily high.
            </p>
          )}
          <button className="btn primary full" onClick={() => setModal(null)}>
            Done
            <Check size={16} />
          </button>
        </Dialog>
      )}
      {(modal === "settings" ||
        modal === "import-confirm" ||
        modal === "sync-confirm") && (
        <Dialog title="Settings and storage" onClose={() => setModal(null)}>
          <div className="eyebrow">YOUR WARDROBE, YOUR DATA</div>
          <h2>Keep your style close.</h2>
          <p className="muted">
            Looks, favorites, and calendar changes save automatically on this
            device.
          </p>
          <div className="settings-block">
            <CheckCircle2 size={20} />
            <div>
              <b>{storageStatus}</b>
              <p>
                {looks.length} looks · {Object.keys(plan).length} planned days ·{" "}
                {saved.length} favorites
              </p>
            </div>
          </div>
          <h3>Take it with you</h3>
          <p className="muted">
            Export a JSON backup to transfer your wardrobe to another device.
          </p>
          <div className="button-row">
            <button className="btn subtle" onClick={exportData}>
              <Download size={16} />
              Export backup
            </button>
            <button
              className="btn subtle"
              onClick={() => importRef.current.click()}
            >
              <Upload size={16} />
              Import backup
            </button>
          </div>
          <input
            ref={importRef}
            hidden
            type="file"
            accept=".json,application/json"
            onChange={importData}
          />
          {modal === "import-confirm" && (
            <div className="confirm-box">
              <p>
                Replace this device’s wardrobe with the imported backup? Export
                first if you want to keep the current version.
              </p>
              <button
                className="btn primary"
                onClick={() => {
                  applyData(remotePending.current);
                  setModal("settings");
                  setNotice("Backup restored.");
                }}
              >
                Restore backup
              </button>
              <button className="text-btn" onClick={() => setModal("settings")}>
                Cancel
              </button>
            </div>
          )}
          <button className="text-btn" onClick={exportPreviousPlan}>
            Export calendar from before the matrix correction
          </button>
          <div className="divider" />
          <h3>Share across your LAN</h3>
          <p className="muted">
            Connect devices to this server to share the same plan. Changes sync
            automatically while connected.
          </p>
          <button
            className="btn subtle"
            onClick={() =>
              syncEnabled
                ? (setSyncEnabled(false), setSyncState("Sync paused"))
                : connectSync()
            }
          >
            <Wifi size={16} />
            {syncEnabled ? "Pause shared sync" : "Connect shared wardrobe"}
          </button>
          {syncState && (
            <p className="muted" role="status">
              {syncState}
            </p>
          )}
          {modal === "sync-confirm" && (
            <div className="confirm-box">
              <p>
                A shared wardrobe already exists. Export your current device
                backup first if you want to keep it.
              </p>
              <button
                className="btn primary"
                onClick={() => {
                  skipSync.current = true;
                  applyData(remotePending.current);
                  setSyncEnabled(true);
                  setSyncState("Shared across your LAN");
                  setModal("settings");
                }}
              >
                Use shared wardrobe
              </button>
              <button className="text-btn" onClick={() => setModal("settings")}>
                Cancel
              </button>
            </div>
          )}
          <div className="divider" />
          <p className="muted">
            Style profile: 172 cm · Casual streetwear · Flat anime
            illustrations. Original draft artwork is retained for the extended
            cast.
          </p>
        </Dialog>
      )}
      {modal === "add" && (
        <AddLook
          onClose={() => setModal(null)}
          onAdd={(l) => {
            setCustomLooks((v) => [...v, l]);
            setModal(null);
            setNotice("Your new look is ready. Find it in the lookbook.");
          }}
        />
      )}
      {modal === "matrix" && (
        <Dialog title="Character reference" onClose={() => setModal(null)}>
          <div className="eyebrow">
            WEEK {remotePending.current.week} / {remotePending.current.day}
          </div>
          <h2>{remotePending.current.name}</h2>
          <h3>Character inspiration</h3>
          <p className="muted">{remotePending.current.snapshot}</p>
          <h3>Signature palette</h3>
          <p className="muted">{remotePending.current.palette}</p>
          <h3>Original outfit reference</h3>
          <p className="muted">{remotePending.current.outfit}</p>
          <div className="style-tip">
            <Sparkles size={18} />
            <p>{remotePending.current.tip}</p>
          </div>
          <button className="btn primary" onClick={() => setModal("add")}>
            <Plus size={15} />
            Create a casual interpretation
          </button>
        </Dialog>
      )}
      {notice && (
        <div className="toast" role="status">
          <CheckCircle2 size={18} />
          {notice}
          <button
            aria-label="Dismiss notification"
            onClick={() => setNotice("")}
          >
            <X size={15} />
          </button>
        </div>
      )}
    </div>
  );
}
function AddLook({ onClose, onAdd }) {
  const [image, setImage] = useState(""),
    [error, setError] = useState("");
  async function upload(e) {
    const f = e.target.files[0];
    if (!f) return;
    if (
      !["image/png", "image/jpeg", "image/webp"].includes(f.type) ||
      f.size > 1500000
    ) {
      setError("Choose a PNG, JPG, or WebP under 1.5 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImage(reader.result);
      setError("");
    };
    reader.readAsDataURL(f);
  }
  return (
    <Dialog title="Add a look" onClose={onClose}>
      <div className="eyebrow">MAKE ROOM FOR A NEW CHARACTER</div>
      <h2>Your next alter ego.</h2>
      <p className="muted">
        Add any inspiration. Your looks save on this device and can be backed
        up.
      </p>
      <form
        className="add-form"
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          if (
            !f.get("name").trim() ||
            !f.get("character").trim() ||
            !f.get("pieces").trim()
          ) {
            setError(
              "Add a look name, character, and at least one outfit piece.",
            );
            return;
          }
          onAdd({
            id: "custom-" + Date.now().toString(36),
            name: f.get("name").trim(),
            character: f.get("character").trim(),
            series: f.get("series").trim() || "Personal inspiration",
            variant: f.get("variant"),
            image,
            colors: [f.get("color")],
            pieces: f
              .get("pieces")
              .split("\n")
              .filter((s) => s.trim())
              .map((s) => ({ category: "Piece", name: s.trim() })),
            tip:
              f.get("tip").trim() ||
              "Keep it comfortable. Make the inspiration your own.",
            source: "custom",
          });
        }}
      >
        <label>
          Look name
          <input
            name="name"
            required
            maxLength={60}
            placeholder="Weekend side quest"
          />
        </label>
        <div className="form-grid">
          <label>
            Character
            <input
              name="character"
              required
              maxLength={70}
              placeholder="Your inspiration"
            />
          </label>
          <label>
            Series
            <input
              name="series"
              maxLength={70}
              placeholder="Anime, manga, or your own"
            />
          </label>
        </div>
        <div className="form-grid">
          <label>
            Variant
            <select name="variant">
              <option value="warm">Warm weather</option>
              <option value="cold">Cold weather</option>
              <option value="gym">Gym session</option>
            </select>
          </label>
          <label>
            Signature color
            <input type="color" name="color" defaultValue="#8070a7" />
          </label>
        </div>
        <label>
          Outfit pieces · one per line
          <textarea
            name="pieces"
            required
            rows={4}
            maxLength={1500}
            placeholder={
              "Relaxed cotton tee\nStraight cargo pants\nYour favorite sneakers"
            }
          />
        </label>
        <label>
          Styling note
          <textarea
            name="tip"
            rows={2}
            maxLength={800}
            placeholder="How would you make this look your own?"
          />
        </label>
        <label>
          Illustration · optional
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={upload}
          />
        </label>
        {image && (
          <img
            className="upload-preview"
            src={image}
            alt="Your uploaded outfit"
          />
        )}
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button className="btn primary full" type="submit">
          <Plus size={16} />
          Add to my wardrobe
        </button>
      </form>
    </Dialog>
  );
}
export const Head = () => (
  <>
    <html lang="en" />
    <title>Ztyle — Dress with character</title>
    <meta
      name="description"
      content="Your anime-inspired wardrobe studio. Explore casual outfits, plan your week, and dress for the weather. Offline-friendly, made for you."
    />
    <meta name="theme-color" content="#f8f7f4" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </>
);
