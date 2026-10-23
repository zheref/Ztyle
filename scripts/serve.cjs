const http = require("http"),
  fs = require("fs"),
  path = require("path"),
  os = require("os");
const { validateBackup } = require("../src/domain/planner.cjs");
const looks = require("../src/domain/catalog.json");
const root = path.resolve(__dirname, "../public"),
  store =
    process.env.ZTYLE_DATA_FILE ||
    path.resolve(__dirname, "../.local/wardrobe.json");
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
};
const json = (res, status, data) => {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(data));
};
let current = { revision: 0, state: null };
try {
  current = JSON.parse(fs.readFileSync(store, "utf8"));
} catch {}
const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    if (url.pathname === "/api/state") {
      if (req.method === "GET") return json(res, 200, current);
      if (req.method !== "PUT")
        return json(res, 405, { error: "Method not allowed" });
      if (
        req.headers.origin &&
        req.headers.origin !== `http://${req.headers.host}`
      )
        return json(res, 403, { error: "Same-origin requests only" });
      if (!req.headers["content-type"]?.startsWith("application/json"))
        return json(res, 415, { error: "JSON required" });
      let bytes = 0,
        chunks = [];
      for await (const chunk of req) {
        bytes += chunk.length;
        if (bytes > 8e6) return json(res, 413, { error: "Backup too large" });
        chunks.push(chunk);
      }
      let state;
      try {
        state = validateBackup(
          JSON.parse(Buffer.concat(chunks).toString()),
          JSON.parse(
            fs.readFileSync(
              path.resolve(__dirname, "../src/domain/catalog.json"),
              "utf8",
            ),
          ),
        );
      } catch (e) {
        return json(res, 400, { error: e.message });
      }
      if (req.headers["if-match"] !== String(current.revision))
        return json(res, 409, {
          error: "Shared wardrobe changed",
          revision: current.revision,
        });
      const next = { revision: current.revision + 1, state };
      fs.mkdirSync(path.dirname(store), { recursive: true });
      fs.writeFileSync(store + ".tmp", JSON.stringify(next));
      fs.renameSync(store + ".tmp", store);
      current = next;
      return json(res, 200, { revision: current.revision });
    }
    if (!["GET", "HEAD"].includes(req.method)) {
      res.writeHead(405);
      return res.end();
    }
    let filepath = path.resolve(root, "." + decodeURIComponent(url.pathname));
    if (filepath !== root && !filepath.startsWith(root + path.sep)) {
      res.writeHead(403);
      return res.end();
    }
    if (!fs.existsSync(filepath)) {
      res.writeHead(404);
      return res.end("Not found");
    }
    if (fs.statSync(filepath).isDirectory())
      filepath = path.join(filepath, "index.html");
    if (!fs.existsSync(filepath)) {
      res.writeHead(404);
      return res.end("Not found");
    }
    res.writeHead(200, {
      "Content-Type":
        MIME[path.extname(filepath)] || "application/octet-stream",
      "Cache-Control":
        filepath.endsWith("sw.js") || filepath.endsWith(".html")
          ? "no-cache"
          : "public, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    });
    if (req.method === "HEAD") return res.end();
    fs.createReadStream(filepath).pipe(res);
  } catch (e) {
    if (!res.headersSent) json(res, 500, { error: "Unable to handle request" });
    else res.end();
  }
});
const port = Number(process.env.PORT || 8000);
server.listen(port, "0.0.0.0", () => {
  const actualPort = server.address().port;
  console.log(`Ztyle is ready\nLocal: http://localhost:${actualPort}`);
  for (const entries of Object.values(os.networkInterfaces()))
    for (const e of entries || [])
      if (e.family === "IPv4" && !e.internal)
        console.log(`LAN: http://${e.address}:${actualPort}`);
});
