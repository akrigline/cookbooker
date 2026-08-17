// Inline block-structure sketches for the recommended templates only (see
// openspec/changes/two-column-configurable-layout design.md "Thumbnails" decision).
// Static shape indicators, not live per-recipe previews - the two-column
// thumbnail always shows its base structure regardless of a recipe's actual
// imagePlacement/notesPlacement.
const THUMB_DEFAULT = `<svg viewBox="0 0 120 160" aria-hidden="true">
  <rect x="4" y="4" width="112" height="14" rx="2" class="thumb-title" />
  <rect x="4" y="22" width="112" height="18" rx="2" class="thumb-notes" />
  <rect x="4" y="44" width="80" height="60" rx="2" class="thumb-ingredients" />
  <rect x="90" y="70" width="26" height="26" rx="2" class="thumb-qr" />
  <rect x="4" y="108" width="112" height="48" rx="2" class="thumb-instructions" />
</svg>`

const THUMB_TWO_COLUMN = `<svg viewBox="0 0 120 160" aria-hidden="true">
  <rect x="4" y="4" width="112" height="14" rx="2" class="thumb-title" />
  <rect x="4" y="22" width="34" height="102" rx="2" class="thumb-ingredients" />
  <rect x="8" y="112" width="26" height="12" rx="2" class="thumb-qr" />
  <rect x="42" y="22" width="74" height="134" rx="2" class="thumb-instructions" />
</svg>`

export const LAYOUT_TEMPLATES = [
  { id: 'default', label: 'Default', tier: 'recommended', hasImage: true, thumbnail: THUMB_DEFAULT },
  {
    id: 'two-column',
    label: 'Two Column',
    tier: 'recommended',
    hasImage: true,
    placementConfigurable: true,
    thumbnail: THUMB_TWO_COLUMN,
  },
  { id: 'hero-split-balanced', label: 'Hero Split (Balanced)', tier: 'legacy', hasImage: true },
  { id: 'hero-split-asymmetric', label: 'Hero Split (Asymmetric)', tier: 'legacy', hasImage: true },
  { id: 'asymmetric-sidebar', label: 'Asymmetric Sidebar', tier: 'legacy', hasImage: true },
  { id: 'column-optimized', label: 'Column Optimized', tier: 'legacy', hasImage: true },
  { id: 'balanced-header', label: 'Balanced Header', tier: 'legacy', hasImage: true },
  { id: 'dual-column-bottom-split', label: 'Dual Column, Bottom Split', tier: 'legacy', hasImage: true },
  { id: 'text-only', label: 'Text-Only (no image container)', tier: 'legacy', hasImage: false },
]

export const DEFAULT_LAYOUT_TEMPLATE = 'default'

export const PLACEMENT_OPTIONS = [
  { id: 'none', label: 'None' },
  { id: 'hero', label: 'Hero (full width)' },
  { id: 'left', label: 'Left column' },
  { id: 'right', label: 'Right column' },
]

export const DEFAULT_PLACEMENT = 'hero'

export const COVER_TEMPLATES = [
  { id: 'classic', label: 'Classic Border' },
  { id: 'modern', label: 'Modern Bold' },
  { id: 'minimal', label: 'Minimal Centered' },
]

export const INGREDIENT_COLUMN_OPTIONS = [1, 2, 3, 4]

export const INGREDIENT_QTY_ALIGN_OPTIONS = [
  { id: 'left', label: 'Left' },
  { id: 'right', label: 'Right' },
  { id: 'inline', label: 'Inline' },
]

export const DEFAULT_INGREDIENT_QTY_ALIGN = 'right'

export const IMAGE_ASPECT_RATIOS = [
  { id: 'auto', label: 'Auto (fill)' },
  { id: '1:1', label: 'Square' },
  { id: '4:3', label: 'Landscape' },
  { id: '3:4', label: 'Portrait' },
  { id: '16:9', label: 'Wide' },
]

export const ACCENT_COLORS = [
  { id: 'terracotta', label: 'Terracotta', value: '#d97742' },
  { id: 'forest-green', label: 'Forest Green', value: '#3f6b4a' },
  { id: 'harvest-gold', label: 'Harvest Gold', value: '#c99a2e' },
  { id: 'plum', label: 'Plum', value: '#7a4a6b' },
  { id: 'slate-blue', label: 'Slate Blue', value: '#43597a' },
  { id: 'charcoal', label: 'Charcoal', value: '#3a3a3a' },
]

export const DEFAULT_ACCENT_COLOR = ACCENT_COLORS[0].value
