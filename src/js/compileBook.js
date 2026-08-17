/**
 * Builds the ordered chapter/recipe compilation plan for a project's
 * printable book, per book-organization spec: custom chapters in their
 * defined sequence, followed by the Miscellaneous chapter last (and only
 * if it actually contains recipes).
 */
export function buildChapterPlan({ chapters, projectRecipes, recipesById, projectId }) {
  const projectChapters = chapters.filter((c) => c.projectId === projectId)
  const misc = projectChapters.find((c) => c.isDefault)
  const custom = [...projectChapters.filter((c) => !c.isDefault)].sort(
    (a, b) => a.sequence - b.sequence,
  )

  const recipesForChapter = (chapterId) =>
    [...projectRecipes]
      .filter((pr) => pr.chapterId === chapterId)
      .sort((a, b) => a.sequence - b.sequence)
      .map((pr) => recipesById.get(pr.recipeId))
      .filter(Boolean)

  const plan = custom.map((chapter) => ({ chapter, recipes: recipesForChapter(chapter.id) }))

  if (misc) {
    const miscRecipes = recipesForChapter(misc.id)
    if (miscRecipes.length) plan.push({ chapter: misc, recipes: miscRecipes })
  }

  return plan
}

/**
 * Digit count of the largest page number the table of contents can print for
 * this plan - what TableOfContentsPage.vue reserves its number column from.
 *
 * This is deliberately an upper bound computed from the plan alone, NOT the
 * exact maximum read back from layoutBookPages. It has to be knowable before
 * the TOC is measured, and the exact numbers aren't: page numbers come from
 * layoutBookPages, whose blank-page insertion depends on physical page parity,
 * which depends on how many pages the TOC itself takes - which is the thing the
 * measurement is trying to work out. Bounding it breaks that cycle.
 *
 * The bound: one printed page per divider, one per recipe, plus at most one
 * double-sided blank per divider (each of which silently consumes a number),
 * plus slack. Overshooting by a digit costs a few px of title width;
 * undershooting would let a number render wider than the column measured for,
 * which is the bug this exists to prevent - so the bound is one-directional on
 * purpose. Numbering restarts at 1 on the first divider regardless of TOC
 * length, so the TOC's own page count is correctly absent from this.
 */
export function maxPageNumberDigits(chapterPlan) {
  const dividers = chapterPlan.length
  const recipes = chapterPlan.reduce((sum, { recipes: r }) => sum + r.length, 0)
  const upperBound = dividers * 2 + recipes + 2
  return String(Math.max(1, upperBound)).length
}

/**
 * Lays out a chapter plan's printed pages (in order, after the Title Page,
 * which callers render separately since it's always exactly one page) and
 * numbers them, per print convention: numbering begins on the first page of
 * body content (the first chapter divider or, when double-sided, the first
 * inserted blank that precedes it), after unnumbered front matter (Title
 * Page, Table of Contents). Returns an ordered `pages` list plus lookup
 * maps rather than mutating the plan, so callers (TOC entries, the printed
 * pages themselves) can each read the same numbers without re-deriving
 * them.
 *
 * When `doubleSided` is true, a `blank` entry is inserted before the Table
 * of Contents or a chapter divider whenever it would otherwise land on an
 * even (left-hand/verso) physical page, so double-sided books always start
 * those sections on a right-hand (recto) page. This is a single uniform
 * rule applied to every recto-forced entry - no special case is needed for
 * "blank between Title Page and TOC": the Title Page is always exactly one
 * physical page, so the very next candidate page is always page 2 (even),
 * which this same rule forces a blank in front of regardless of whether
 * that next section is the TOC or (when page numbers are off) the first
 * chapter divider. A blank page still silently consumes a page-number slot
 * once numbering has started (keeping numbers in sync with true physical
 * position for anyone actually duplex-printing), but is never displayed.
 *
 * `tocPageCount` (from tocLayout.js's measureTocLayout, which knows how many
 * physical pages the table of contents actually needs once real row heights
 * are measured) replaces what used to be a single hardcoded TOC page - 0
 * means no TOC/page numbers at all, N pushes N `toc` entries before divider
 * numbering starts, so chapter/recipe page numbers always land correctly
 * however long the TOC runs. Recto-forcing (double-sided) only applies
 * before the first TOC page; the rest are already consecutive physical
 * pages, the same way a chapter's recipe pages are.
 */
export function layoutBookPages(chapterPlan, { doubleSided = false, tocPageCount = 0 } = {}) {
  const pages = []
  const dividerPages = new Map()
  const recipePages = new Map()

  // Physical page 1 is the Title Page, rendered separately by the caller.
  let physicalPage = 1
  // Null until the first divider (front matter stays unnumbered); a `blank`
  // entry advances it too, once started, so it never displays a number.
  let printedNumber = null

  const wouldLandOnVerso = () => (physicalPage + 1) % 2 === 0

  const pushBlank = () => {
    physicalPage++
    if (printedNumber !== null) printedNumber++
    pages.push({ type: 'blank', page: physicalPage, printedNumber: null })
  }

  const forceRecto = () => {
    if (doubleSided && wouldLandOnVerso()) pushBlank()
  }

  if (tocPageCount > 0) {
    forceRecto()
    for (let i = 0; i < tocPageCount; i++) {
      physicalPage++
      pages.push({ type: 'toc', page: physicalPage, printedNumber: null, tocPageIndex: i })
    }
  }

  for (const { chapter, recipes } of chapterPlan) {
    forceRecto()
    physicalPage++
    printedNumber = printedNumber === null ? 1 : printedNumber + 1
    dividerPages.set(chapter.id, printedNumber)
    pages.push({ type: 'divider', page: physicalPage, chapterId: chapter.id, printedNumber })

    for (const recipe of recipes) {
      physicalPage++
      printedNumber++
      recipePages.set(`${chapter.id}:${recipe.id}`, printedNumber)
      pages.push({
        type: 'recipe',
        page: physicalPage,
        chapterId: chapter.id,
        recipeId: recipe.id,
        printedNumber,
      })
    }
  }

  return { pages, dividerPages, recipePages }
}
