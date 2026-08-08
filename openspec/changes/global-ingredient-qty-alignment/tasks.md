## 1. Commit 1 — backup safety gate (standalone, no-op at v1)

- [x] 1.1 Add the compatibility gate to `inspectBackupFile` in `src/js/backup.js`: reject when
      `meta.data.databaseVersion > db.verno`, and reject when `meta.data.tables` names a table
      absent from `db.tables`. Both throws happen before `restoreDatabase` takes its
      `preRestoreSnapshot`.
- [x] 1.2 `restoreDatabase` passes `acceptVersionDiff: true` to `importInto` (and does **not** pass
      `acceptMissingTables`), with a comment recording why that flag is deliberately absent.
- [x] 1.3 Tests in `src/js/backup.roundtrip.test.js`: a newer-shaped export is rejected before
      anything is cleared (target's rows survive); a same/older-version export with only known
      tables still restores.
- [x] 1.4 `npm test` and `npm run build` green. Commit. (commit bd8f115)

## 2. Commit 2 — the settings feature, end to end

- [x] 2.1 `src/js/db.js`: add `db.version(2).stores({ settings: 'key' })` with no `.upgrade()`
      callback; export `RETIRED_RECIPE_FIELDS = { ingredientQtyAlign: 'v2 → settings.ingredientQtyAlign' }`
      with the explanatory comment from design.md; export `DEFAULT_SETTINGS`,
      `normalizeSettings`, `getSettings()`, `updateSettings(patch)` (read-modify-write inside one
      `db.transaction('rw', db.settings, ...)`, upsert via `put`, spread `{...current, ...patch}`
      not `{...DEFAULT_SETTINGS, ...patch}`, return the persisted row).
- [x] 2.2 `src/js/settings.test.js`: `updateSettings` succeeds with no existing row; `getSettings()`
      returns defaults with no row and normalizes an invalid stored value; `updateSettings` returns
      what it persisted.
- [x] 2.3 `src/stores/settings.js`: Pinia store with `ingredientQtyAlign`, `loaded`, memoized
      `load()`, `setIngredientQtyAlign(value)` that calls `db.updateSettings` and mirrors the
      returned row into state (not a locally recomputed value). Deviation from design.md: `loadPromise`
      is store state, not a module-level variable — a module-level memo would leak across the
      `createPinia()`-per-test instances this codebase's store tests already rely on (see
      `stores/recipes.test.js`'s `beforeEach`), and Vue's `reactive()` doesn't proxy Promise
      instances anyway, so state is safe here. Also added a `reload()` action (clears the memo) for
      `confirmRestore`, since `load()` alone can't re-fetch post-restore once memoized.
- [x] 2.4 `src/main.js`: unroll the chained mount expression into statements; bounded
      `Promise.race([useSettingsStore(pinia).load(), timeout(1500)])` awaited before `app.mount()`,
      wrapped in try/catch that falls back to `DEFAULT_SETTINGS` silently.
- [x] 2.5 `src/components/RecipeSheet.vue`: add `--recipe-qty-align` to the existing
      `:style="{...}"` binding, defaulting to `useSettingsStore().ingredientQtyAlign` when no
      explicit prop is passed (keep the seam open for a future per-project override).
- [x] 2.6 `RecipeIngredients.vue`: `.ingredient-qty` gets `text-align: var(--recipe-qty-align, right);`
      added to its existing scoped block. Remove the `qtyAlign` prop and its inline `:style` usage.
- [x] 2.7 Remove the `qty-align`/`qtyAlign` prop and binding from all 7 `RecipeLayout*.vue` wrapper
      components.
- [x] 2.8 `src/views/RecipeEditor.vue`: remove `ingredientQtyAlign` from load, save, and
      `previewRecipe`; remove its sidebar control.
- [x] 2.9 `src/views/Settings.vue`: add a "Recipe defaults" section with the left/right toggle
      wired to `settingsStore.setIngredientQtyAlign`, with a `catch` into the existing `error` ref;
      add a `settings` entry to `TABLE_LABELS`; call `settingsStore.reload()` inside
      `confirmRestore` alongside the existing recipes/projects reload.
- [x] 2.10 Manual browser check (chrome-devtools-axi, after routing it at a manually-launched Chrome
       with `--remote-debugging-port` — the bundled auto-launch path in this sandbox couldn't start
       Chrome; direct invocation worked fine, so it's an axi/environment quirk, not a Chrome problem):
       confirmed the editor's live preview switches between right- and left-aligned quantities when
       the Settings toggle is flipped, with the value persisted to `db.settings` and no console
       errors. Did not separately screenshot print/project-print/import-preview — same CSS-variable
       mechanism, not independently re-verified.
- [x] 2.11 `npm test` and `npm run build` green. Commit. (commit 79c6bbb)

## 3. Commit 3 — `recipe/1` format change

- [x] 3.1 `src/js/recipeExport.js`: stop emitting `<meta class="cm-ingredient-qty-align">`.
- [x] 3.2 `src/js/recipeImport.js`: stop extracting/setting `ingredientQtyAlign` on imported recipe
      objects.
- [x] 3.3 Update `src/js/recipeExport.test.js` / `src/js/recipeImport.test.js`: remove
      alignment-specific assertions; add a case confirming a legacy file carrying the old meta tag
      still imports cleanly (falls back to the app-wide default).
- [x] 3.4 `npm test` and `npm run build` green. Commit. (commit 790953c)

## 4. Manual pre-release verification

- [ ] 4.1 Open the app on a real Chrome profile holding a real v1 database; confirm the v1→v2
      upgrade completes and existing data is intact. **Not done by the agent** — no access to a real
      user profile/data; needs a human with the production browser profile.
- [ ] 4.2 Repeat with two tabs open on the same v1 database; confirm the old tab's documented
      behavior (reopens on the new schema rather than hanging) and that no deadlock occurs. **Not
      done by the agent**, same reason as 4.1.

## 5. OpenSpec housekeeping

- [x] 5.1a Sync specs into `openspec/specs/`.
- [ ] 5.1b Archive this change — held open until a human completes section 4.
