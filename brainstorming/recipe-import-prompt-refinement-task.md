# Task prompt: fix "of a" ingredient-quantity parsing in the recipe import prompt

Paste the block below into a fresh session of an agent that has the
skill-creator skill available. It is fully self-contained (no codebase
access required).

---

```
Use your skill-creator skill for this. The artifact under test isn't a
SKILL.md — it's an LLM prompt string (shown in full below) — but treat it
exactly like skill-creator treats a skill: RED (baseline failures with the
current prompt, verbatim) before GREEN (minimal edit), then REFACTOR (try to
break the new wording). "Pressure scenario" = a synthetic source recipe with
a risky ingredient phrasing fed to a fresh LLM turn carrying the current
prompt; "test passes" = the resulting ingredient line parses with a
non-null unit per the ground-truth rules below.

You have NO access to the source codebase this belongs to — everything you
need is inlined in this message. Don't assume any other files, examples, or
context exist beyond what's given here.

BACKGROUND

This prompt (below, verbatim) is pasted by a user into an LLM chat along
with a source recipe (PDF, webpage, screenshot, doc). The LLM transcribes it
into a fixed HTML shape. A separate importer (not shown, not editable by
you) then parses each `<li>` ingredient line with a small rule-based parser
library, `@magrinj/parse-ingredients`. Its exact behavior is reproduced in
full below — treat it as ground truth, don't guess at parser behavior.

THE CURRENT PROMPT (this is what you're editing — full text):

---BEGIN CURRENT PROMPT---
You are transcribing one or more recipes from messy source material (a document,
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
    <p>Optional: prep/cook time, servings, tags, storage tips, or any other
    context from the source that doesn't fit above. For emphasis, use markdown
    syntax written as literal text — **bold** (double asterisks) and *italic*
    (single asterisks) only. Do NOT use HTML tags like &lt;strong&gt; or
    &lt;em&gt; here; they will be stripped on import and the formatting will be
    lost.</p>
  </section>

  <meta class="cm-layout" content="hero-split-balanced">
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
8. Output ONLY the HTML, wrapped in a single markdown code block (```html ... ```)
   — no commentary before or after.
9. Strip out any citation markers the source material or your own tooling may have
   inserted, e.g. "[cite:1]", "[cite: 2, 5]", "[1]", or similar bracketed reference
   tags — they must not appear anywhere in the output.

After this message I will paste or attach the source material to transcribe.
---END CURRENT PROMPT---

THE CONFIRMED BUG

Real user report: recipes imported fine, but "the site hasn't found the
unit, only the number" for ingredient lines phrased like:
  - "1/2 of a cup of sugar"
  - "1/8 of a teaspoon of salt"

I ALREADY DIAGNOSED THE ROOT CAUSE — verify and build on it, don't
rediscover it. The parser expects lines shaped `QTY UNIT [of] INGREDIENT`
(e.g. "1 1/2 cups of flour" parses fine — see ground truth below). It
silently breaks on `QTY of a UNIT of INGREDIENT`:
  1. Quantity-stripping leaves the remainder "of a cup of sugar".
  2. Unit-matching only matches a unit word at the very START of that
     remainder. It starts with "of", not "cup" → no match → unit is null.
  3. An article-stripping step then matches "of" as a leading article word,
     strips only that one word, leaving ingredient = "a cup of sugar" — the
     unit word gets swallowed into the ingredient name instead of recognized
     as a unit.
  4. Nothing throws or errors anywhere in the pipeline — it's a silent
     downstream fallback to "no unit found, raw number only," which matches
     exactly what the user reported.

GROUND-TRUTH PARSER BEHAVIOR (English locale) — reason about pass/fail
against this, it is the authoritative spec for what "parses correctly"
means:

- A recognized unit word must appear as the LITERAL NEXT WORD immediately
  after the quantity, with nothing (no "of", no "of a") in between.
  Recognized unit words include: cup/cups/c/c., tbsp/tbs/tablespoon(s)/T,
  tsp/tspn/teaspoon(s)/t, oz/oz./ounce(s), lb/lbs/pound(s), qt/qts/quart(s),
  pt/pts/pint(s), gal/gallon(s), g/g./gram(s), kg/kilogram(s),
  mg/milligram(s), ml/milliliter(s), l/l./liter(s), cl/centiliter(s),
  package(s), coffeespoon(s).
- After a unit is (or isn't) found, one leading "article" word is stripped
  from what remains, checked in this order, ONLY ONE applied: "an ", "a ",
  "of ". Each strips just its own single matched word — never both "of" and
  "a" together, so "of a X" only ever loses the "of," not the "a."
- Only one preposition word is recognized for ranges: "to" (e.g. "1 to 2
  cups").
- Unicode fraction characters (½ ¼ ⅓ etc.) already convert correctly to
  plain fractions before quantity parsing — this part is not broken, don't
  add rules about it.
- A parenthetical like "(15 oz)" is extracted separately from the rest of
  the line and reattached to the ingredient name afterward — canned-good
  lines like "1 (15 oz) can crushed tomatoes" already have a working path
  independent of the unit-word logic above; don't regress it.
- Examples that already parse correctly today (don't break these):
  "1 1/2 cups of all-purpose flour" → unit "cups", ingredient "all-purpose
  flour". "1 cup butter" → unit "cup", ingredient "butter". "2 tbsp olive
  oil" → unit "tbsp", ingredient "olive oil". "4 oz cheese" → unit "oz",
  ingredient "cheese".
- Examples confirmed broken today (the bug): "1/2 of a cup of sugar" → unit
  null, ingredient ends up "a cup of sugar". "1/8 of a teaspoon of salt" →
  unit null, ingredient ends up "a teaspoon of salt".
- Lines with NO quantity/unit at all are expected to have null unit and are
  NOT bugs — e.g. "salt to taste", "a pinch of cinnamon" legitimately have no
  parseable unit and the app already falls back gracefully (renders the raw
  text) for these. Don't try to force these to have units.

CONSTRAINT

The prompt's existing Rule 7 says "Preserve the source's original units and
wording... don't rephrase beyond fixing obvious grammar." Your fix must not
conflict with that — no unit conversion, no rewording instructions — it
should only forbid/normalize the specific filler-word construction that
breaks the parser, scoped to the ingredients section. Also don't let a new
rule regress "2 cups of flour"-style lines (unit directly followed by "of")
which already parse fine — only "QTY of a UNIT..." (filler BEFORE the unit)
is the actual bug.

SCOPE FOR YOUR PRESSURE SCENARIOS

Beyond the two confirmed cases, also test: "a quarter of a cup", "an eighth
of a teaspoon" (other of-a/of-an variants before the unit); ranges ("2-3
cups", "1 to 2 tablespoons"); vague quantities with no real unit ("a pinch
of salt", "salt to taste" — expected to stay unitless, not a bug); mixed
numbers/unicode ("1½ cups", "2 1/2 lbs"); canned goods ("1 (15 oz) can
crushed tomatoes"); compound quantities ("1 cup plus 2 tbsp butter,
softened"). Include already-working phrasings too so REFACTOR can catch
regressions your new wording introduces.

For RED, build a short synthetic source recipe containing 3-4 of the risky
phrasings, feed it to a fresh LLM turn together with the CURRENT prompt
above (don't let that turn see this diagnosis — it should behave like a
naive cold paste), and record the exact ingredient lines it outputs
verbatim. For GREEN, make the smallest edit to the prompt (likely amending
Rule 2 or adding a new rule with a before/after example pair, matching the
prompt's existing style) and re-run the same synthetic recipe through a
fresh turn with the edited prompt, confirming the phrasings normalize
correctly. For REFACTOR, try phrasings designed to break your new wording
(especially ones already listed as "already working" above) before
finalizing.

DELIVERABLE (bring this back to me)

1. The full replacement text for the prompt (paste the entire prompt back,
   not a diff — I'll compare it myself against the original above), with the
   changed lines called out separately too.
2. A table of test cases: input ingredient line → expected {quantity, unit,
   symbol, ingredient} — for both newly-fixed and already-working phrasings.
   Match this exact shape, which is how they'll be added to the real test
   suite:
     it('parses "1/2 of a cup of sugar" with a recognized unit', () => {
       const result = parseIngredientsText('1/2 of a cup of sugar')[0]
       expect(result.unit).toBe('cup')       // or whatever the correct value is
       expect(result.symbol).toBe('c')
       expect(result.ingredient).toBe('sugar')
     })
3. The RED vs. GREEN raw LLM output for at least one synthetic source
   recipe, so I can sanity-check your reasoning instead of re-deriving it.
4. A short note on anything you tried that made things worse.

I'll apply the prompt edit and the tests against the real codebase and
parser myself — hand-traced reasoning on your end will get re-verified
before it lands, so don't worry about being 100% certain, just show your
work.
```

---

**Note when reviewing the result:** skill-creator's RED phase means observing
baseline failure *without* the fix present. Confirm the fresh LLM turn that
produced the RED baseline only ever saw the "THE CURRENT PROMPT" block above,
never the diagnosis or ground-truth rules — otherwise it's not a real
baseline and the reported RED/GREEN contrast proves nothing.
