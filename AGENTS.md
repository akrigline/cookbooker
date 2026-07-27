# Project agent memory

This file is the project's committed home for project-intrinsic agent knowledge: build, test, release, architecture, and sharp-edge notes that should travel with the code.

- Add durable project-specific notes here as they are discovered through real work.
- Spec-driven development uses the OpenSpec CLI (`openspec` on PATH). Active change proposals live in
  `openspec/changes/<name>/`, completed ones are moved to `openspec/changes/archive/<date>-<name>/`, and
  the current merged capability specs live in `openspec/specs/<capability>/spec.md`. See the
  `openspec-propose`/`openspec-apply-change`/`openspec-archive-change` skills for the workflow.
- `npm test` runs vitest (happy-dom + fake-indexeddb, see `vitest.config.js`); `npm run build` runs the
  Vite production build. Both must stay green before landing a change.
- The router (`src/router/index.js`) uses `createWebHistory()`. A `spaFallback404` plugin in
  `vite.config.js` copies `dist/index.html` to `dist/404.html` after build, so static hosts without a
  rewrite rule (e.g. GitHub Pages) serve the app shell for deep links/hard refreshes instead of a bare
  404. No GitHub Pages deploy config exists yet — this only prepares the app for that.
- If `chrome-devtools-axi`/`chrome-devtools-mcp` fails to launch a browser here ("Protocol error
  (Target.setDiscoverTargets): Target closed"), the default Chrome resolution (`channel: stable`) can't
  find/launch a working browser in this environment. Fix: install a Chrome build
  (`npx puppeteer@<version-matching-chrome-devtools-mcp> browsers install chrome`, cached under
  `~/.cache/puppeteer`), then point `chrome-devtools-mcp` at it explicitly with `--executablePath=<path>`
  and `--chrome-arg=--no-sandbox` (neither is exposed via a `CHROME_DEVTOOLS_AXI_*` env var, since the MCP
  child process only inherits a restricted env). Set `CHROME_DEVTOOLS_AXI_MCP_PATH` to a small `.mjs` shim
  that pushes those flags onto `process.argv` before importing the real
  `chrome-devtools-mcp/build/src/bin/chrome-devtools-mcp.js` entry point.

## Maintaining this file

Keep this file for knowledge useful to almost every future agent session in this project.
Do not repeat what the codebase already shows; point to the authoritative file or command instead.
Prefer rewriting or pruning existing entries over appending new ones.
When updating this file, preserve this bar for all agents and keep entries concise.
