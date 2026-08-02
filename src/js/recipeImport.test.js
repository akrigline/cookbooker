import { describe, expect, it } from 'vitest'
import { parseRecipeImportHtml } from './recipeImport'

function wrapDocument(body) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="cookbook-maker-format" content="recipe/1"></head>
<body>${body}</body>
</html>`
}

const SINGLE_RECIPE = wrapDocument(`
  <article class="cm-recipe" data-cm-format="recipe" data-cm-version="1">
    <h1 class="cm-title">Grandma's Apple Pie</h1>
    <section class="cm-ingredients">
      <h2>Ingredients</h2>
      <ul>
        <li>1 1/2 cups all-purpose flour</li>
        <li>1 cup unsalted butter, softened</li>
      </ul>
    </section>
    <section class="cm-instructions">
      <h2>Instructions</h2>
      <ol>
        <li>Preheat oven to 375F.</li>
        <li>Mix dry ingredients in a large bowl.</li>
      </ol>
    </section>
    <section class="cm-notes">
      <h2>Chef's Notes</h2>
      <p>A family favorite from <strong>Grandma Ruth</strong>.</p>
    </section>
    <meta class="cm-layout" content="text-only">
  </article>
`)

const BATCH_RECIPES = wrapDocument(`
  <article class="cm-recipe" data-cm-format="recipe" data-cm-version="1">
    <h1 class="cm-title">Pancakes</h1>
    <section class="cm-ingredients"><ul><li>2 cups flour</li></ul></section>
    <section class="cm-instructions"><ol><li>Mix and cook.</li></ol></section>
  </article>
  <article class="cm-recipe" data-cm-format="recipe" data-cm-version="1">
    <h1 class="cm-title">Waffles</h1>
    <section class="cm-ingredients"><ul><li>2 cups flour</li></ul></section>
    <section class="cm-instructions"><ol><li>Mix and cook in a waffle iron.</li></ol></section>
  </article>
`)

const NO_MARKERS = wrapDocument(`<h1>Just a plain recipe blog post</h1><p>1 cup sugar</p>`)

describe('parseRecipeImportHtml', () => {
  it('parses a well-formed single recipe', () => {
    const { recipes, failures, rejected } = parseRecipeImportHtml(SINGLE_RECIPE)
    expect(rejected).toBe(false)
    expect(failures).toHaveLength(0)
    expect(recipes).toHaveLength(1)

    const recipe = recipes[0]
    expect(recipe.title).toBe("Grandma's Apple Pie")
    expect(recipe.instructions).toBe('Preheat oven to 375F.\nMix dry ingredients in a large bowl.')
    expect(recipe.ingredients).toHaveLength(2)
    expect(recipe.ingredients[0].raw).toBe('1 1/2 cups all-purpose flour')
    expect(recipe.notes).toContain('Grandma Ruth')
    expect(recipe.layoutTemplate).toBe('text-only')
    expect(recipe.image).toBeNull()
    expect(recipe.ingredientColumns).toBe(1)
    expect(recipe.ingredientQtyAlign).toBe('right')
    expect(recipe.imageAspectRatio).toBe('auto')
  })

  it('parses a well-formed batch file with multiple recipes', () => {
    const { recipes, failures, rejected } = parseRecipeImportHtml(BATCH_RECIPES)
    expect(rejected).toBe(false)
    expect(failures).toHaveLength(0)
    expect(recipes).toHaveLength(2)
    expect(recipes.map((r) => r.title)).toEqual(['Pancakes', 'Waffles'])
  })

  it('defaults layoutTemplate to the registry default when omitted', () => {
    const { recipes } = parseRecipeImportHtml(BATCH_RECIPES)
    expect(recipes[0].layoutTemplate).toBe('hero-split-balanced')
  })

  it('rejects a file missing the required data-cm-format marker', () => {
    const { recipes, failures, rejected } = parseRecipeImportHtml(NO_MARKERS)
    expect(rejected).toBe(true)
    expect(recipes).toHaveLength(0)
    expect(failures).toHaveLength(0)
  })

  it('skips a recipe missing a required field without failing the whole batch', () => {
    const html = wrapDocument(`
      <article class="cm-recipe" data-cm-format="recipe" data-cm-version="1">
        <h1 class="cm-title"></h1>
        <section class="cm-ingredients"><ul><li>2 cups flour</li></ul></section>
        <section class="cm-instructions"><ol><li>Mix and cook.</li></ol></section>
      </article>
      <article class="cm-recipe" data-cm-format="recipe" data-cm-version="1">
        <h1 class="cm-title">Good Recipe</h1>
        <section class="cm-ingredients"><ul><li>2 cups flour</li></ul></section>
        <section class="cm-instructions"><ol><li>Mix and cook.</li></ol></section>
      </article>
    `)
    const { recipes, failures, rejected } = parseRecipeImportHtml(html)
    expect(rejected).toBe(false)
    expect(recipes).toHaveLength(1)
    expect(recipes[0].title).toBe('Good Recipe')
    expect(failures).toHaveLength(1)
    expect(failures[0].reason).toMatch(/title/i)
  })

  it('reports a missing-instructions recipe as a failure with a reason', () => {
    const html = wrapDocument(`
      <article class="cm-recipe" data-cm-format="recipe" data-cm-version="1">
        <h1 class="cm-title">No Steps</h1>
        <section class="cm-ingredients"><ul><li>2 cups flour</li></ul></section>
        <section class="cm-instructions"></section>
      </article>
    `)
    const { recipes, failures } = parseRecipeImportHtml(html)
    expect(recipes).toHaveLength(0)
    expect(failures).toHaveLength(1)
    expect(failures[0].reason).toMatch(/instructions/i)
  })

  it('falls back to <p> elements when instructions has no <li>', () => {
    const html = wrapDocument(`
      <article class="cm-recipe" data-cm-format="recipe" data-cm-version="1">
        <h1 class="cm-title">Paragraph Steps</h1>
        <section class="cm-ingredients"><ul><li>2 cups flour</li></ul></section>
        <section class="cm-instructions">
          <p>Preheat the oven.</p>
          <p>Bake for 20 minutes.</p>
        </section>
      </article>
    `)
    const { recipes } = parseRecipeImportHtml(html)
    expect(recipes).toHaveLength(1)
    expect(recipes[0].instructions).toBe('Preheat the oven.\nBake for 20 minutes.')
  })

  it('parses a bare HTML fragment with no surrounding <html>/<body> tags, as pasted text commonly looks', () => {
    const fragment = `
      <article class="cm-recipe" data-cm-format="recipe" data-cm-version="1">
        <h1 class="cm-title">Pasted Pie</h1>
        <section class="cm-ingredients"><ul><li>2 cups flour</li></ul></section>
        <section class="cm-instructions"><ol><li>Mix and bake.</li></ol></section>
      </article>
    `
    const { recipes, failures, rejected } = parseRecipeImportHtml(fragment)
    expect(rejected).toBe(false)
    expect(failures).toHaveLength(0)
    expect(recipes).toHaveLength(1)
    expect(recipes[0].title).toBe('Pasted Pie')
  })

  it('parses a batch of recipes pasted as a bare fragment identically to a batch file', () => {
    const fragment = `
      <article class="cm-recipe" data-cm-format="recipe" data-cm-version="1">
        <h1 class="cm-title">Pancakes</h1>
        <section class="cm-ingredients"><ul><li>2 cups flour</li></ul></section>
        <section class="cm-instructions"><ol><li>Mix and cook.</li></ol></section>
      </article>
      <article class="cm-recipe" data-cm-format="recipe" data-cm-version="1">
        <h1 class="cm-title">Waffles</h1>
        <section class="cm-ingredients"><ul><li>2 cups flour</li></ul></section>
        <section class="cm-instructions"><ol><li>Mix and cook in a waffle iron.</li></ol></section>
      </article>
    `
    const { recipes, failures, rejected } = parseRecipeImportHtml(fragment)
    expect(rejected).toBe(false)
    expect(failures).toHaveLength(0)
    expect(recipes).toHaveLength(2)
    expect(recipes.map((r) => r.title)).toEqual(['Pancakes', 'Waffles'])
  })

  it('rejects pasted text with no data-cm-format marker the same way as a bad file', () => {
    const pasted = '<p>Just some plain text a user pasted by mistake.</p>'
    const { recipes, failures, rejected } = parseRecipeImportHtml(pasted)
    expect(rejected).toBe(true)
    expect(recipes).toHaveLength(0)
    expect(failures).toHaveLength(0)
  })

  it('treats an unrecognized data-cm-version as a per-recipe failure', () => {
    const html = wrapDocument(`
      <article class="cm-recipe" data-cm-format="recipe" data-cm-version="2">
        <h1 class="cm-title">Future Format</h1>
        <section class="cm-ingredients"><ul><li>2 cups flour</li></ul></section>
        <section class="cm-instructions"><ol><li>Mix and cook.</li></ol></section>
      </article>
    `)
    const { recipes, failures, rejected } = parseRecipeImportHtml(html)
    expect(rejected).toBe(false)
    expect(recipes).toHaveLength(0)
    expect(failures).toHaveLength(1)
    expect(failures[0].reason).toMatch(/version/i)
  })

  it('strips citation markers the LLM prompt asked for but a response left in anyway', () => {
    const html = wrapDocument(`
      <article class="cm-recipe" data-cm-format="recipe" data-cm-version="1">
        <h1 class="cm-title">Apple Pie [cite:1]</h1>
        <section class="cm-ingredients"><ul><li>2 cups flour [1]</li></ul></section>
        <section class="cm-instructions"><ol><li>Preheat the oven [cite: 2, 5].</li></ol></section>
        <section class="cm-notes"><p>A family favorite [3].</p></section>
      </article>
    `)
    const { recipes } = parseRecipeImportHtml(html)
    expect(recipes).toHaveLength(1)
    expect(recipes[0].title).toBe('Apple Pie')
    expect(recipes[0].ingredients[0].raw).toBe('2 cups flour')
    expect(recipes[0].instructions).toBe('Preheat the oven.')
    expect(recipes[0].notes).toBe('A family favorite.')
  })

  it('produces a candidate recipe with a null image when .cm-image src is malformed', () => {
    const html = wrapDocument(`
      <article class="cm-recipe" data-cm-format="recipe" data-cm-version="1">
        <h1 class="cm-title">Bad Image</h1>
        <section class="cm-ingredients"><ul><li>2 cups flour</li></ul></section>
        <section class="cm-instructions"><ol><li>Mix and cook.</li></ol></section>
        <img class="cm-image" src="data:image/png;base64,not-valid-base64!">
      </article>
    `)
    const { recipes } = parseRecipeImportHtml(html)
    expect(recipes).toHaveLength(1)
    expect(recipes[0].title).toBe('Bad Image')
    expect(recipes[0].image).toBeNull()
  })
})
