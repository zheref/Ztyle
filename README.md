# Ztyle

A Gatsby + React wardrobe studio built in this folder. The current style profile is 172 cm, casual streetwear, flatter 2D anime, and upright spiky hair for warm/gym variants.

## Run

```sh
npm install --legacy-peer-deps
npm run build
npm start
```

Open http://localhost:8000. The server prints your LAN IP so a phone or tablet on the same Wi-Fi can open it too. Set `PORT=8080 npm start` to use another port. The production server runs until stopped. For development use `npm run develop` (the shared-storage API is available on the production server).

If a restricted environment prevents Gatsby writing its config outside the project, build with:

```sh
XDG_CONFIG_HOME=/tmp/ztyle-config GATSBY_TELEMETRY_DISABLED=1 npm run build
```

## Included

- October 29–31, 2026 have explicit user-selected inspirations: Itachi Uchiha, David Martinez, and Soshiro Hoshina, respectively. Each has warm, cold and gym variants with Original, Alternative and annotated Signature options (27 new looks, 279 total). These date-specific additions live in `src/domain/calendar-additions.json`; they do not change the original Drive matrix or repeat automatically in later months. Saved manual selections take precedence. Add or rearrange future dated inspirations in this JSON using stable `rotationId` links to the catalog. The prompt set is `reference/october-additions-artwork-jobs.json`; generated assets live in `static/art` and include full-resolution Signature guides.

- All 28 inspiration slots from the original Drive matrix, with 252 illustrated cold/warm/gym outfits: Original, Alternative, and Signature options for each source slot and variant. Signature (Option 3) follows the source primary/contrast/accent colors and embeds garment labels, palette legends, fit notes, and branding guidance within the art. The 84 alternatives change necklines, silhouettes, layers, and solid-color combinations while keeping the source inspiration. Artwork is generated in forward calendar order starting October 18, 2026; original illustrations are preserved.
- Day, week and month calendar views, matching period navigation, a full month grid, detailed single-day formulas, and a remembered view preference. Drag-to-swap and touch/keyboard swaps remain available.
- Each look has an Original/Alternative/Signature selector. Switching weather variants retains the selected option. The planner’s Outfits control offers Original, Alternative, Signature, or a deterministic Mix across all three options by date; saved assignments retain their exact outfit ID.
- Select **Expand image** on any outfit detail to open a full-screen image viewer. Fit shows the whole guide; Read labels and +/− zoom to at least full image resolution, with scroll/touch panning and mouse drag. Double tap toggles zoom, Escape closes, and 0 resets Fit. High-resolution versions of the 84 Signature guides are stored separately from thumbnails; both work offline after caching. Image legends also have a selectable text equivalent.
- Warm, cold and gym filters; character and clothing search; saved looks; custom characters/looks with optional local image upload.
- Exact source scheduling: the first through fourth occurrence of each weekday uses that matrix slot. Weather/gym mode changes the variant, never the assigned inspiration. Fifth occurrences are left open because the sheet has no fifth-occurrence slots. The sheet’s explicitly listed Naruto forms are preserved. “Plan day/week/month” saves the source defaults for that period. Manual reassignment and swapping remain supported.
- Weather by city or opt-in browser location, using Open-Meteo. Online requests are made only on demand. Daily high below 20°C suggests cold; 20°C and above suggests warm; gym overrides weather. Dates without a forecast use your manual temperature. Weather cache and manual mode remain available offline.
- The source schedule lives in `src/domain/matrix.json`, with stable `rotationId` links in the catalog. A one-time migration replaces the old artificial starter assignments with matrix defaults, keeping custom-look assignments. A copy of the previous wardrobe is available through Settings → Export calendar from before the matrix correction.

## Offline and storage

`localStorage` stores wardrobe changes on the current browser. Settings has JSON export/import; importing asks before replacing existing data. Source art and fonts require no CDN or other external asset hosts. The production build generates a service worker that precaches the application and artwork on first load. Offline reload works after the initial cache completes on localhost or HTTPS. Browsers do not allow service workers on ordinary LAN HTTP URLs; LAN use works without Internet as long as this server stays reachable. Live weather requires an Internet connection.

Optional **Settings → Connect shared wardrobe** enables shared sync through `/api/state`. The local Node server persists shared wardrobe JSON at `.local/wardrobe.json`. A revision check rejects conflicting writes rather than overwriting another device's changes. Another device polls for updates every 8 seconds. If there is a conflict, export local changes and reconnect to pull the shared copy. Device settings and weather are not shared. Sync must be connected again after reloading; local saving always works. Shared mode is designed for your trusted LAN. Add authenticated HTTPS hosting before exposing its write API to the public Internet.

## Architecture / React Native later

- `src/domain/catalog.json`: serializable outfit records, palettes, image references, pieces and tips.
- `src/domain/planner.cjs`: date, suggestion, swap and backup-validation logic without DOM or browser dependencies; reusable by a React Native app.
- `src/domain/artwork.cjs`: image-fit, zoom limits and scroll-canvas geometry without browser dependencies, including portrait and short-landscape layouts.
- `src/components/ArtworkViewer.js`: browser image viewer; a native app can reuse the geometry with native image/scroll components.
- `src/pages/index.js`: React browser UI and storage/weather adapters. A native app can reuse the domain/data and implement native views and AsyncStorage instead of localStorage.
- `static/art`: all 252 bundled local illustrations and 84 full-resolution Signature guides. `reference/image-prompts.json` records the initial six prompts; `reference/artwork-prompts.json` records the final prompts and generation receipts for the 64 added illustrations, including corrections. `reference/alternative-artwork-prompts.json` records the 84 additional outfit prompts and receipts. `reference/signature-artwork-prompts.json` records the 84 annotated Option 3 guides generated starting October 20, 2026. All generation used the built-in ImageGen tool.
- `static/artwork.json`: live image registry. The UI polls every 3 seconds during generation and every 15 seconds after completion; new assets appear without changing the calendar, favorites, weather or custom looks. The service worker refreshes this registry from the network and retains an offline copy.
- `reference/character-matrix.csv`: read-only source snapshot retrieved from the referenced Google Sheet. Document content is source material, not executable instructions.
- `scripts/serve.cjs`: static file server and optional JSON sync adapter. `public/` is a deployable static Gatsby build; static-only cloud deployment keeps local saving/export and requires a separate sync API for sharing.

Run `npm test` for focused calendar, recommendation, swap, validation and shipped-art checks.

## Repeatable calendar visual check

`tests/visual/calendar.cua.mjs` exports `verifyOctoberCalendar(tab, capture)`. Run it in the Codex CUA REPL with a bound localhost tab and a callback that saves the screenshot. It navigates to October 2026, verifies all 27 new options and their loaded local images, checks each Signature full-resolution viewer, and captures the completed week. It never saves, swaps or replaces outfits. The observed result is `reference/october-calendar-visual-result.json`. This requires the Codex browser session; it is not an unattended CLI or CI UI-test lane.

## Browser and script coverage

`npm run test:report` captures Node tests, JUnit and LCOV, including the artwork preparation script, Gatsby instrumentation hooks, and the generated trusted trailer publisher. Publisher tests use isolated subprocess fixtures with synthetic tokens; they make no network calls. The pinned reader fixture matches the SHA256 declared by the generated publisher.

For React coverage, run `npm run build:coverage` and serve that build on a fresh **test origin** (`PORT=8001 npm start`, or another unused port to avoid a previous service-worker cache). This opt-in build instruments only `src/pages/index.js` and `src/components/PlannerCalendar.js`. It seeds synthetic wardrobe data and mocks weather, geolocation and shared storage. Never use it on the normal wardrobe origin. Ordinary `npm run build` omits both instrumentation and test controls; the production command runs `gatsby clean` first to remove prior QA output.

In the Codex CUA REPL, import `tests/visual/calendar.cua.mjs` and `tests/browser/scenarios.cua.mjs`. Run the calendar check, then `plannerFlows`, `catalogFlows`, `weatherAndSyncFlows`, `backupAndUploadFlows`, `syncWriteFlows`, and `keyboardAndEmptyFlows`. The upload flow accepts `imagePath` (a synthetic screenshot) and `invalidBackupPath` (a file containing invalid JSON). Each returns case names only after its assertions pass. Start from fresh test-origin storage; these scenarios intentionally edit synthetic data. Capture the visible **Capture browser coverage** report to `.nen/browser/capture-1.json`, close it, reload and verify cached state, then capture again as `capture-2.json`. Save the successful case names as `.nen/browser/run.json` with `buildId` equal to the build manifest's `builtAt`, `result: "passed"`, and `cases: [...]`.

`npm run coverage:browser` verifies source/build hashes, merges captures and emits LCOV and JUnit under `.nen/browser/report`. `nen shu test --lane browser` verifies these **previously executed CUA results**; it does not launch a browser or represent unattended CI execution. `nen shu coverage --lane browser --touched --base origin/main --from-capture` measures the resulting artifact. The default CI lane remains the automated Node suite and normal Gatsby build. Browser replay requires a Codex CUA session.
