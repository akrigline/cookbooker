import { DEFAULT_PLACEMENT } from './templates'

function escapeHtml(unsafe) {
  return (unsafe ?? '')
    .toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function blobToDataUri(blob) {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, chunk);
  }
  return `data:${blob.type};base64,${btoa(binary)}`;
}

export async function exportRecipeToHtml(recipe) {
  const titleHtml = escapeHtml(recipe.title);
  
  const ingredientsHtml = (recipe.ingredients || [])
    .map(ing => `<li>${escapeHtml(ing.raw)}</li>`)
    .join('\n      ');
    
  const instructionsHtml = (recipe.instructions || '')
    .split('\n')
    .filter(line => line.trim())
    .map(line => `<li>${escapeHtml(line)}</li>`)
    .join('\n      ');
    
  const notesHtml = escapeHtml(recipe.notes || '');

  const layout = escapeHtml(recipe.layoutTemplate || 'hero-split-balanced');
  const cols = escapeHtml(recipe.ingredientColumns || '1');
  const aspect = escapeHtml(recipe.imageAspectRatio || 'auto');
  const imagePlacement = escapeHtml(recipe.imagePlacement || DEFAULT_PLACEMENT);
  const notesPlacement = escapeHtml(recipe.notesPlacement || DEFAULT_PLACEMENT);

  let imageHtml = '';
  if (recipe.image) {
    const dataUri = await blobToDataUri(recipe.image);
    imageHtml = `\n    <img class="cm-image" src="${escapeHtml(dataUri)}">`;
    imageHtml += `\n    <meta class="cm-image-aspect-ratio" content="${aspect}">`;
  }

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${titleHtml}</title>
  <meta name="cookbooker-format" content="recipe/1">
</head>
<body>
  <article class="cm-recipe" data-cm-format="recipe" data-cm-version="1">
    <h1 class="cm-title">${titleHtml}</h1>
    <meta class="cm-layout" content="${layout}">
    <meta class="cm-ingredient-columns" content="${cols}">
    <meta class="cm-image-placement" content="${imagePlacement}">
    <meta class="cm-notes-placement" content="${notesPlacement}">${imageHtml}
    
    <h2>Ingredients</h2>
    <ul class="cm-ingredients">
      ${ingredientsHtml}
    </ul>
    
    <h2>Instructions</h2>
    <ol class="cm-instructions">
      ${instructionsHtml}
    </ol>
    
    <h2>Chef's Notes</h2>
    <div class="cm-notes">${notesHtml}</div>
  </article>
</body>
</html>`;
}
