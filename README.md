# Cookbook Maker

Cookbook Maker is a client-side web application for managing recipes and organizing them into custom cookbooks. It runs entirely in the browser using IndexedDB for local data storage, meaning no backend server or user account is required to use the application.

**Project status: feature-complete.** The planned feature set below is done and there's no open roadmap. The project is still maintained for bug fixes and dependency updates — see [CONTRIBUTING.md](CONTRIBUTING.md) before opening a PR (an issue must be opened first).

## Features

- **Recipe Library & Editor**: Create, edit, and manage your recipe collection, featuring automatic ingredient parsing, fraction handling, and a choice of print layout templates (including a configurable two-column layout with independent image/notes placement).
- **Cookbook Management**: Group recipes into structured projects or books, complete with chapters, custom ordering, bulk operations, cover templates, accent colors, and optional double-sided/booklet printing.
- **Recipe Import**: Import recipes using AI prompts and automated parsing, either into your library or directly into a cookbook.
- **Ingredient Conversions**: Automatically parse ingredients and convert between US and metric units.
- **Recipe QR Code**: Every recipe sheet includes a QR code alongside its ingredients — the ingredient list and title are compressed and encoded entirely in the QR code's URL, so no server or account is involved. Scanning opens this app's own `/decode` route to display the recipe as a shopping-list-friendly view.
- **Print & Export**: Format recipes and cookbooks for printing (Letter or A4), export a single recipe or an entire cookbook as a self-contained, re-importable HTML file, and export/import full database backups.

## Tech Stack

- **Framework**: Vue 3 (using `<script setup>`)
- **Build Tool**: Vite
- **State Management**: Pinia
- **Database**: Dexie.js (IndexedDB)
- **Routing**: Vue Router

## Development Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. **Run tests:**
   ```bash
   npm test
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

## Project Documentation

- **Specifications**: This project follows spec-driven development using the OpenSpec CLI. All capability specifications are located in the `openspec/specs/` directory.
- **Architecture & Agent Notes**: Crucial architectural invariants, technical setup instructions (like MCP and Dexie gotchas), and project rules are maintained in `AGENTS.md`. Always refer to `AGENTS.md` when making architectural changes.
- **Contributing**: See [CONTRIBUTING.md](CONTRIBUTING.md) — in particular, an issue must be opened and acknowledged before a PR is submitted.
- **Security**: See [SECURITY.md](SECURITY.md) to report a vulnerability privately.
