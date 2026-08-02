export const LAYOUT_TEMPLATES = [
  { id: 'hero-split-balanced', label: 'Hero Split (Balanced)', hasImage: true },
  { id: 'hero-split-asymmetric', label: 'Hero Split (Asymmetric)', hasImage: true },
  { id: 'asymmetric-sidebar', label: 'Asymmetric Sidebar', hasImage: true },
  { id: 'column-optimized', label: 'Column Optimized', hasImage: true },
  { id: 'balanced-header', label: 'Balanced Header', hasImage: true },
  { id: 'dual-column-bottom-split', label: 'Dual Column, Bottom Split', hasImage: true },
  { id: 'text-only', label: 'Text-Only (no image container)', hasImage: false },
]

export const DEFAULT_LAYOUT_TEMPLATE = 'hero-split-balanced'

export const COVER_TEMPLATES = [
  { id: 'classic', label: 'Classic Border' },
  { id: 'modern', label: 'Modern Bold' },
  { id: 'minimal', label: 'Minimal Centered' },
]

export const INGREDIENT_COLUMN_OPTIONS = [1, 2, 3, 4]

export const INGREDIENT_QTY_ALIGN_OPTIONS = [
  { id: 'left', label: 'Left' },
  { id: 'right', label: 'Right' },
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
