import { describe, expect, it } from 'vitest'
import { getFavoriteSettings, DEFAULT_FAVORITE_ICON, OUTSIDE_CONTEXT_ICON } from './favorites.js'

describe('getFavoriteSettings', () => {
  it('returns heart with no prefix when there is no project', () => {
    expect(getFavoriteSettings(null)).toEqual({ icon: OUTSIDE_CONTEXT_ICON, prefix: '' })
    expect(getFavoriteSettings(undefined)).toEqual({ icon: OUTSIDE_CONTEXT_ICON, prefix: '' })
  })

  it('returns the project icon and terminology when both are set', () => {
    const project = { favoriteIcon: 'sock', favoriteTerminology: 'Sacred' }
    expect(getFavoriteSettings(project)).toEqual({ icon: 'sock', prefix: 'Sacred' })
  })

  it('trims terminology and treats blank/whitespace-only as no prefix', () => {
    expect(getFavoriteSettings({ favoriteIcon: 'star', favoriteTerminology: '' })).toEqual({
      icon: 'star',
      prefix: '',
    })
    expect(getFavoriteSettings({ favoriteIcon: 'star', favoriteTerminology: '   ' })).toEqual({
      icon: 'star',
      prefix: '',
    })
    expect(getFavoriteSettings({ favoriteIcon: 'star', favoriteTerminology: '  Sacred  ' })).toEqual({
      icon: 'star',
      prefix: 'Sacred',
    })
  })

  it('falls back to the default icon when favoriteIcon is missing', () => {
    expect(getFavoriteSettings({ favoriteTerminology: 'Sacred' })).toEqual({
      icon: DEFAULT_FAVORITE_ICON,
      prefix: 'Sacred',
    })
  })
})
