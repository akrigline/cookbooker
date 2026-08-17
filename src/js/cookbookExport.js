import { buildRecipeArticleHtml, escapeHtml as escapeAttr } from './recipeExport'

function boolContent(value) {
  return value ? 'true' : 'false'
}

/**
 * Builds a `cookbook/1` HTML document: the cookbook's settings as meta
 * elements, followed by one `.cm-chapter` section per chapter (in sequence
 * order), each containing that chapter's recipes (in sequence order) as
 * ordinary `recipe/1` articles built by the same buildRecipeArticleHtml
 * single-recipe export uses - see cookbook-export-import's design.md
 * Decision 2. `chapters` need not be pre-sorted; this sorts by `sequence`
 * itself so the document's order can never disagree with the cookbook's
 * actual chapter order. `recipesByChapter` maps chapter id -> that chapter's
 * recipes, already in their in-chapter sequence order.
 */
export async function exportCookbookToHtml(project, chapters, recipesByChapter) {
  const titleHtml = escapeAttr(project.title || 'Untitled Cookbook')
  const orderedChapters = [...chapters].sort((a, b) => a.sequence - b.sequence)

  const chapterSections = await Promise.all(
    orderedChapters.map(async (chapter) => {
      const recipes = recipesByChapter.get(chapter.id) ?? []
      const articles = await Promise.all(recipes.map((recipe) => buildRecipeArticleHtml(recipe)))
      const articlesHtml = articles.map((article) => `    ${article}`).join('\n')
      return `  <section class="cm-chapter" data-cm-chapter-name="${escapeAttr(chapter.name)}" data-cm-chapter-sequence="${chapter.sequence}">
${articlesHtml}
  </section>`
    }),
  )

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${titleHtml}</title>
  <meta name="cookbooker-format" content="cookbook/1">
</head>
<body>
  <section data-cm-format="cookbook" data-cm-version="1">
    <meta class="cm-cookbook-title" content="${titleHtml}">
    <meta class="cm-cookbook-subtitle" content="${escapeAttr(project.subtitle)}">
    <meta class="cm-cookbook-accent-color" content="${escapeAttr(project.accentColor)}">
    <meta class="cm-cookbook-cover-template" content="${escapeAttr(project.coverTemplate)}">
    <meta class="cm-cookbook-page-numbers" content="${boolContent(project.pageNumbersEnabled)}">
    <meta class="cm-cookbook-double-sided" content="${boolContent(project.doubleSidedEnabled)}">
${chapterSections.join('\n')}
  </section>
</body>
</html>`
}

// Sanitizes a cookbook title into a safe .html filename - strips characters
// invalid across common filesystems, collapses whitespace, and falls back
// to "cookbook.html" for an empty/untitled cookbook (per design.md's Open
// Questions resolution). No dependency pulled in for this; the rule is
// deliberately simple.
export function cookbookExportFilename(title) {
  const sanitized = (title ?? '')
    .toString()
    .replace(/[/\\?%*:|"<>]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
  return sanitized ? `${sanitized}.html` : 'cookbook.html'
}
