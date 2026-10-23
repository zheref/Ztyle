const test = require("node:test"),
  assert = require("node:assert/strict"),
  { spawn } = require("node:child_process"),
  fs = require("node:fs/promises"),
  os = require("node:os"),
  path = require("node:path");
test("shared server persists validated state and rejects conflicting revisions", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "ztyle-test-"));
  const child = spawn(process.execPath, ["scripts/serve.cjs"], {
    cwd: path.join(__dirname, ".."),
    env: {
      ...process.env,
      PORT: "0",
      ZTYLE_DATA_FILE: path.join(dir, "wardrobe.json"),
    },
  });
  try {
    const url = await new Promise((resolve, reject) => {
      child.stdout.on("data", (d) => {
        const m = d.toString().match(/Local: (http:\/\/localhost:\d+)/);
        if (m) resolve(m[1]);
      });
      child.on("error", reject);
      child.on("exit", (code) => reject(Error("Server exited " + code)));
    });
    let r = await fetch(url + "/api/state");
    assert.deepEqual(await r.json(), { revision: 0, state: null });
    const state = {
      version: 1,
      plan: { "2026-10-18": "kirito-warm" },
      customLooks: [],
      saved: ["kirito-warm"],
    };
    const put = (rev, value = state) =>
      fetch(url + "/api/state", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "If-Match": String(rev),
        },
        body: JSON.stringify(value),
      });
    r = await put(0);
    assert.equal(r.status, 200);
    assert.equal((await r.json()).revision, 1);
    r = await put(0);
    assert.equal(r.status, 409);
    r = await put(1, { ...state, saved: ["does-not-exist"] });
    assert.equal(r.status, 400);
    const persisted = JSON.parse(
      await fs.readFile(path.join(dir, "wardrobe.json"), "utf8"),
    );
    assert.deepEqual(persisted, { revision: 1, state });
    r = await fetch(url + "/api/state", {
      method: "PUT",
      headers: {
        Origin: "https://unrelated.example",
        "Content-Type": "application/json",
        "If-Match": "1",
      },
      body: JSON.stringify(state),
    });
    assert.equal(r.status, 403);
  } finally {
    child.kill();
    await fs.rm(dir, { recursive: true, force: true });
  }
});
