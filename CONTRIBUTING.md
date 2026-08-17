# Contributing to Cookbook Maker

## Project status: feature-complete

Cookbook Maker's planned feature set is done. There is no open roadmap and no
backlog of desired features — check `openspec/changes/` (only completed
changes live under `openspec/changes/archive/`) if you want to confirm there's
nothing in flight. This project is not looking for new feature ideas. It's
still maintained: bug fixes, dependency updates, and correctness/accessibility
issues are welcome.

## Open an issue before opening a PR

**Every pull request must reference an existing GitHub issue.** Please open
an issue first and wait for it to be acknowledged before writing code. This
applies to bug fixes too, not just larger changes.

Why: this avoids someone spending time on a PR that duplicates existing work,
targets something already ruled out, or doesn't fit the project (see
"feature-complete" above). A short issue discussion up front is much cheaper
than a rejected PR.

A PR opened without a linked issue will be closed and asked to go through
this process first — no exceptions.

### Filing an issue

Include:
- What's wrong (bug) or what's missing (only for correctness/accessibility —
  see above), with steps to reproduce if applicable.
- Browser/OS, since this is a client-side app and behavior can be
  browser-specific (IndexedDB quirks, print/export rendering, etc.).
- Whether you intend to submit a PR for it, so it's clear the issue isn't
  just a report.

## Making a change

1. Read `AGENTS.md` (symlinked as `CLAUDE.md`) first. It's the project's
   living memory of architectural invariants and sharp edges discovered
   through real work — several of its notes exist specifically because a
   past change got this wrong. It also documents the required Dexie
   write/store-action invariants, the release/deploy pipeline, and other
   non-obvious constraints.
2. For anything beyond a small, self-contained fix, this project uses
   [OpenSpec](https://github.com/Fission-AI/OpenSpec) for spec-driven
   development. Active proposals live in `openspec/changes/<name>/`; merged
   capability specs live in `openspec/specs/<capability>/spec.md`. A PR that
   changes behavior described by an existing spec should update that spec.
3. Keep `npm test` (Vitest) and `npm run build` (Vite production build)
   green — CI (`.github/workflows/ci.yml`) requires both, plus a check that
   `@magrinj/parse-ingredients`'s locale data survived tree-shaking (see
   `AGENTS.md` if that check fails and it isn't obvious why).
4. Match the existing code style; there's no separate linter to satisfy
   beyond what CI runs.

## Reporting a security issue

Please don't open a public issue for a security vulnerability. See
`SECURITY.md` for how to report privately.
