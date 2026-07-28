// Paste-ready LLM instructions for transcribing source material into the
// cookbook-maker `recipe/1` structured HTML import format. Kept as a plain
// string (not templated) so what the user copies is exactly what get parsed.
export const RECIPE_IMPORT_PROMPT = `You are transcribing one or more recipes from messy source material (a document,
screenshot, PDF, or web page I'll paste or attach) into a specific HTML format so I can
import it into a recipe app called cookbook-maker. Follow this exactly.

OUTPUT FORMAT — for EACH recipe, produce one block in this exact shape:

<article class="cm-recipe" data-cm-format="recipe" data-cm-version="1">
  <h1 class="cm-title">RECIPE TITLE</h1>

  <section class="cm-ingredients">
    <h2>Ingredients</h2>
    <ul>
      <li>ONE INGREDIENT PER LINE, e.g. "1 1/2 cups all-purpose flour"</li>
    </ul>
  </section>

  <section class="cm-instructions">
    <h2>Instructions</h2>
    <ol>
      <li>ONE STEP PER LINE, written as a complete imperative instruction</li>
    </ol>
  </section>

  <section class="cm-notes">
    <h2>Chef's Notes</h2>
    <p>Optional: prep/cook time, servings, tags, storage tips, or any other
    context from the source that doesn't fit above. For emphasis, use markdown
    syntax written as literal text — **bold** (double asterisks) and *italic*
    (single asterisks) only. Do NOT use HTML tags like &lt;strong&gt; or
    &lt;em&gt; here; they will be stripped on import and the formatting will be
    lost.</p>
  </section>

  <meta class="cm-layout" content="standard">
</article>

Wrap the whole thing in a minimal valid HTML document (<!DOCTYPE html>, <head> with
<meta charset="utf-8"> and <meta name="cookbook-maker-format" content="recipe/1">,
<body>). If I gave you MULTIPLE recipes, put multiple <article class="cm-recipe" ...>
blocks in the SAME <body>, one per recipe — do not create separate files.

RULES:
1. Do not invent, guess, or embellish ingredients or steps that aren't in the source.
   If a word or amount is illegible/ambiguous, write it as best you can and wrap your
   best guess in [UNCLEAR: ...], e.g. "[UNCLEAR: 1/2] tsp cinnamon".
2. Keep ingredient lines as plain text: quantity + unit + ingredient name, in the
   order a person would read them (e.g. "2 tbsp olive oil", not "olive oil - 2 tbsp").
   Don't split quantity/unit/name into separate elements.
3. Break run-on or paragraph-style instructions into individual numbered steps — one
   action per <li>. Don't combine multiple steps into one line.
4. If the source has prep time, cook time, servings, yield, or tags, put that
   information as plain text inside the Chef's Notes section — do not drop it, but
   also do not invent it if it's not in the source.
5. Do not include any image. Leave the recipe image out entirely — this format has no
   way to carry one.
6. The <section class="cm-ingredients">, <section class="cm-instructions">, and the
   data-cm-format/data-cm-version attributes are REQUIRED and must be present exactly
   as shown, even if the section ends up short. <section class="cm-notes"> and
   <meta class="cm-layout"> are optional — omit them if there's nothing to put there.
7. Preserve the source's original units and wording (don't convert cups to grams,
   don't rephrase instructions into your own style beyond fixing obvious grammar).
8. Output ONLY the HTML, wrapped in a single markdown code block (\`\`\`html ... \`\`\`)
   — no commentary before or after.
9. Strip out any citation markers the source material or your own tooling may have
   inserted, e.g. "[cite:1]", "[cite: 2, 5]", "[1]", or similar bracketed reference
   tags — they must not appear anywhere in the output.

After this message I will paste or attach the source material to transcribe.`
