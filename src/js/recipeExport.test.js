import { describe, expect, it } from 'vitest'
import { blobToDataUri, buildRecipeArticleHtml, exportRecipeToHtml } from './recipeExport'
import { parseRecipeImportHtml } from './recipeImport'

describe('blobToDataUri', () => {
  it('encodes a blob to a data URI', async () => {
    const text = 'Hello world'
    const blob = new Blob([text], { type: 'text/plain' })
    const dataUri = await blobToDataUri(blob)
    expect(dataUri).toBe('data:text/plain;base64,SGVsbG8gd29ybGQ=')
  })
})

describe('exportRecipeToHtml and parseRecipeImportHtml', () => {
  it('round-trips a recipe with an image and display settings', async () => {
    const text = 'fake-image-bytes'
    const imageBlob = new Blob([text], { type: 'image/png' })

    const recipe = {
      title: 'Test Export',
      ingredients: [
        { raw: '1 cup flour' },
        { raw: '2 eggs' },
      ],
      instructions: 'Mix it all together.\nBake it.',
      notes: 'Some notes.\nWith *markdown*.',
      layoutTemplate: 'column-optimized',
      ingredientColumns: 2,
      imageAspectRatio: '1:1',
      imagePlacement: 'left',
      notesPlacement: 'right',
      image: imageBlob
    }

    const html = await exportRecipeToHtml(recipe)
    const { recipes, failures, rejected } = parseRecipeImportHtml(html)

    expect(rejected).toBe(false)
    expect(failures).toHaveLength(0)
    expect(recipes).toHaveLength(1)

    const parsed = recipes[0]
    expect(parsed.title).toBe(recipe.title)
    expect(parsed.ingredients[0].raw).toBe('1 cup flour')
    expect(parsed.ingredients[1].raw).toBe('2 eggs')
    expect(parsed.instructions).toBe(recipe.instructions)
    expect(parsed.notes).toBe(recipe.notes)
    expect(parsed.layoutTemplate).toBe(recipe.layoutTemplate)
    expect(parsed.ingredientColumns).toBe(recipe.ingredientColumns)
    expect(parsed.imageAspectRatio).toBe(recipe.imageAspectRatio)
    expect(parsed.imagePlacement).toBe(recipe.imagePlacement)
    expect(parsed.notesPlacement).toBe(recipe.notesPlacement)

    expect(parsed.image).not.toBeNull()
    const parsedText = await parsed.image.text()
    expect(parsedText).toBe(text)
  })

  it('does not emit an ingredient-alignment meta element', async () => {
    const html = await exportRecipeToHtml({
      title: 'No Alignment',
      ingredients: [],
      instructions: 'Step one.',
    })
    expect(html).not.toContain('cm-ingredient-qty-align')
  })

  // Locks the exact document shape post-refactor (buildRecipeArticleHtml
  // extraction, see cookbook-export-import's design.md Decision 2) - the
  // article markup and its surrounding document shell must stay
  // byte-identical to before the split.
  it('wraps buildRecipeArticleHtml unchanged inside the single-recipe document shell', async () => {
    const recipe = {
      title: 'Test Recipe',
      ingredients: [{ raw: '1 cup flour' }],
      instructions: 'Mix well.',
      notes: 'Notes here.',
    }
    const [html, articleHtml] = await Promise.all([
      exportRecipeToHtml(recipe),
      buildRecipeArticleHtml(recipe),
    ])

    expect(html).toBe(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Test Recipe</title>
  <meta name="cookbooker-format" content="recipe/1">
</head>
<body>
  ${articleHtml}
</body>
</html>`)
    expect(articleHtml).toContain('<article class="cm-recipe" data-cm-format="recipe" data-cm-version="1">')
    expect(articleHtml).toContain('<h1 class="cm-title">Test Recipe</h1>')
  })
})
