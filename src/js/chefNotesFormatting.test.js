import { describe, expect, it } from 'vitest'
import { RECIPE_IMPORT_PROMPT } from './recipeImportPrompt'
import { parseRecipeImportHtml } from './recipeImport'
import { renderChefNotes } from './richtext'

// Regression coverage for a prior bug: the import prompt told the LLM to
// write Chef's Notes emphasis as <strong>/<em> HTML, but recipeImport.js
// extracts notes via `.textContent` (which strips real tags) and
// richtext.js's renderer only understands markdown (**/*) syntax - so any
// LLM that followed the old prompt had its bold/italic silently discarded.
// The fix makes the prompt ask for markdown, matching what actually survives
// `.textContent` and what renderChefNotes renders.

function wrapDocument(notesHtml) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="cookbooker-format" content="recipe/1"></head>
<body>
  <article class="cm-recipe" data-cm-format="recipe" data-cm-version="1">
    <h1 class="cm-title">Test Recipe</h1>
    <section class="cm-ingredients"><ul><li>1 cup flour</li></ul></section>
    <section class="cm-instructions"><ol><li>Mix and cook.</li></ol></section>
    <section class="cm-notes"><p>${notesHtml}</p></section>
  </article>
</body>
</html>`
}

describe("AI import Chef's Notes formatting", () => {
  it('prompt instructs markdown emphasis, not HTML tags', () => {
    expect(RECIPE_IMPORT_PROMPT).toMatch(/\*\*bold\*\*/)
    expect(RECIPE_IMPORT_PROMPT).toMatch(/\*italic\*/)
    expect(RECIPE_IMPORT_PROMPT).not.toMatch(/<strong>bold<\/strong>/)
    expect(RECIPE_IMPORT_PROMPT).not.toMatch(/<em>italic<\/em>/)
  })

  it('markdown emphasis in notes survives import and renders as bold/italic', () => {
    const html = wrapDocument('Serves 4. **Do not overmix** the batter, or cook *low and slow*.')
    const { recipes, failures } = parseRecipeImportHtml(html)
    expect(failures).toHaveLength(0)
    expect(recipes).toHaveLength(1)

    const { notes } = recipes[0]
    expect(notes).toBe('Serves 4. **Do not overmix** the batter, or cook *low and slow*.')

    const rendered = renderChefNotes(notes)
    expect(rendered).toContain('<strong>Do not overmix</strong>')
    expect(rendered).toContain('<em>low and slow</em>')
  })
})
