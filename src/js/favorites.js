export const FAVORITE_ICONS = [
  { id: 'sock', label: 'Sock' },
  { id: 'star', label: 'Star' },
  { id: 'heart', label: 'Heart' },
]

export const DEFAULT_FAVORITE_ICON = 'star'

// Icon used for every favorite indicator/toggle rendered outside the context
// of a specific cookbook (recipe editor, Global Recipe Library) - see the
// recipe-favorites capability's Context-Dependent Favorite Icon requirement.
export const OUTSIDE_CONTEXT_ICON = 'heart'

/**
 * Resolves how favorites should be displayed for `project` (null/undefined
 * when outside any cookbook context). A blank/whitespace-only
 * `favoriteTerminology` means no title prefix.
 */
export function getFavoriteSettings(project) {
  if (!project) return { icon: OUTSIDE_CONTEXT_ICON, prefix: '' }
  return {
    icon: project.favoriteIcon || DEFAULT_FAVORITE_ICON,
    prefix: (project.favoriteTerminology || '').trim(),
  }
}
