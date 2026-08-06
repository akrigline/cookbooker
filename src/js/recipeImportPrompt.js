// Paste-ready LLM instructions for transcribing source material into the
// cookbooker `recipe/1` structured HTML import format. Kept as a plain
// string (not templated) so what the user copies is exactly what get parsed.
export const RECIPE_IMPORT_PROMPT = `You are transcribing one or more recipes from messy source material (a document, screenshot, PDF, or web page I'll paste or attach) into a specific HTML format so I can import it into a recipe app called cookbooker. Follow this exactly.

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
    <p>Optional: prep/cook time, servings, tags, storage tips, or any other context from the source that doesn't fit above. For emphasis, use markdown syntax written as literal text — **bold** (double asterisks) and *italic* (single asterisks) only. Do NOT use HTML tags like <strong> or <em> here; they will be stripped on import and the formatting will be lost.</p>
  </section>

  <meta class="cm-layout" content="hero-split-balanced">
</article>

Wrap the whole thing in a minimal valid HTML document (<!DOCTYPE html>, <head> with <meta charset="utf-8"> and <meta name="cookbooker-format" content="recipe/1">, <body>). If I gave you MULTIPLE recipes, put multiple <article class="cm-recipe" ...> blocks in the SAME <body>, one per recipe — do not create separate files.

RULES:
1. Do not invent, guess, or embellish ingredients or steps that aren't in the source. If a word or amount is illegible/ambiguous, write it as best you can and wrap your best guess in [UNCLEAR: ...], e.g. "[UNCLEAR: 1/2] tsp cinnamon". The same applies to structural ambiguity that isn't resolved by a more specific rule below: if you genuinely can't tell how part of the source is meant to be organized, don't silently pick one interpretation or awkwardly stitch two readings together with an explanatory note — wrap the uncertain part in [UNCLEAR: ...] instead so it's easy to spot and fix by hand.
2. Get the recipe title from wherever the source actually states it — a heading, caption, or the first line. If the source's own content never states a title, but you know the name of the document or file it came from (a Google Doc's title, a filename for an attached scan or photo), use that as the title instead of leaving it blank or wrapping it as an unclear guess — a real file/document name is a legitimate source of the title, not a guess that needs flagging. Only fall back to inferring a short title from what the recipe actually makes (e.g. "Dinner Rolls"), wrapped in [UNCLEAR: ...], if the file name itself is generic and uninformative, like "Scan0043" or "IMG_2091".
3. Keep ingredient lines as plain text: quantity + unit + ingredient name, in the order a person would read them (e.g. "2 tbsp olive oil", not "olive oil - 2 tbsp"). Don't split quantity/unit/name into separate elements. If the source writes a numeric quantity as "[QTY] of a [UNIT]" or "[QTY] of an [UNIT]" — filler words sitting between the number and the unit — rewrite it so the unit word immediately follows the quantity with nothing in between: "1/2 of a cup of sugar" becomes "1/2 cup of sugar", and "1/8 of a teaspoon of salt" becomes "1/8 teaspoon of salt". This only applies when the quantity itself is numeric (a number, fraction, or mixed number like "1/2", "2 1/2", "1½") — leave spelled-out quantities ("a quarter of a cup", "a dozen eggs") exactly as written, don't try to convert them to numerals. Also leave alone any line where the unit already directly follows the quantity, such as "2 cups of flour" — that phrasing is already correct and must not be changed. Similarly, watch for mixed numbers written with a bare hyphen instead of a space, like "2-3/4 cups flour" or "1-1/2 tsp vanilla" — rewrite the hyphen as a space ("2 3/4 cups flour", "1 1/2 tsp vanilla") so it reads as one mixed number rather than a range. Only do this when a whole number is directly followed by a hyphen and then a fraction (a slash) with nothing in between — a hyphen between two whole numbers, like "2-3 cups" or "10-12 minutes", is a genuine range and must be left exactly as written.
4. Break run-on or paragraph-style instructions into individual numbered steps — one action per <li>. Don't combine multiple steps into one line.
5. If the source presents genuinely alternate methods for making the same dish — separate headed sections like "Instructions (Bread Machine)" and "Instructions (Mixer)", each a complete procedure with its own full step sequence — do not merge them into one step list or explain the split in a note; that produces a recipe nobody can actually follow. Instead output separate <article class="cm-recipe"> blocks, one per method (the same mechanism you use for multiple distinct recipes in one paste), each with the full ingredient list and a title that names the method, e.g. "Rolls (Bread Machine)" and "Rolls (Mixer)". This only applies to full parallel procedures — a passing aside like "if using instant yeast, skip proofing" is a minor variation within one method, not an alternate method, and stays inline where it appears.
6. Chef's Notes are for genuine, non-obvious cooking context specific to this recipe — technique notes, substitutions, equipment shortcuts (like an alternate method for a bread machine), warnings about a step, or storage/serving advice that's actually worth writing down. Do not transcribe structured recipe-card metadata into Chef's Notes even when the source states it: prep/cook/rising/total time, servings/yield, calorie or nutrition breakdowns, course/cuisine classifications, SEO keyword/tag lists, author bylines, or marketing taglines ("the best ___ you'll ever make!"). None of that describes the dish, and it's the kind of boilerplate that comes bundled with a source pasted from a recipe website — leave it all out rather than transcribing it out of a habit of "don't drop information." If a "Notes" section from the source mixes one real tip in with boilerplate (e.g. a nutrition disclaimer sitting right next to a genuinely useful storage tip), only carry over the useful part.
7. Do not include any image. Leave the recipe image out entirely — this format has no way to carry one.
8. The <section class="cm-ingredients">, <section class="cm-instructions">, and the data-cm-format/data-cm-version attributes are REQUIRED and must be present exactly as shown, even if the section ends up short. <section class="cm-notes"> and <meta class="cm-layout"> are optional — omit them if there's nothing to put there.
9. Preserve the source's original units and wording (don't convert cups to grams, don't rephrase instructions into your own style beyond fixing obvious grammar).
10. Output ONLY the HTML, wrapped in a single markdown code block (\`\`\`html ... \`\`\`) — no commentary before or after.
11. Strip out any citation markers your own tooling may have inserted while reading the source — patterns like "[cite:1]", "[cite: 2, 5]", "[1]", or similar bracketed reference tags. These sometimes get attached to every individual line rather than just once at the end, so don't just eyeball the output as a whole — after you finish transcribing, re-scan every <li> and <p> individually for a trailing or embedded bracket like this and remove it. None may appear anywhere in the final output.

After this message I will paste or attach the source material to transcribe.`
