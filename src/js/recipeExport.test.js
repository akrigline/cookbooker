import { describe, expect, it } from 'vitest'
import { blobToDataUri, exportRecipeToHtml } from './recipeExport'
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
      ingredientQtyAlign: 'left',
      imageAspectRatio: '1:1',
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
    expect(parsed.ingredientQtyAlign).toBe(recipe.ingredientQtyAlign)
    expect(parsed.imageAspectRatio).toBe(recipe.imageAspectRatio)

    expect(parsed.image).not.toBeNull()
    const parsedText = await parsed.image.text()
    expect(parsedText).toBe(text)
  })
})
