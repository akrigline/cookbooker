function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/**
 * Renders Chef's Notes text with simple inline bold/italic styling only.
 * Supports bold (double-asterisk or double-underscore) and italic (single
 * marker) syntax. All other input is HTML-escaped first, so no other markup
 * or scripting can be injected.
 *
 * Markers require markdown's flanking rule (no whitespace immediately inside
 * the pair) so a stray marker in ordinary text - "2 * 3 * 4" - can't pair up
 * with an unrelated one and get misread as emphasis.
 */
export function renderChefNotes(text) {
  if (!text) return ''
  let html = escapeHtml(text)
  html = html.replace(/\*\*(?!\s)(.+?)(?<!\s)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/__(?!\s)(.+?)(?<!\s)__/g, '<strong>$1</strong>')
  html = html.replace(/\*(?!\s)(.+?)(?<!\s)\*/g, '<em>$1</em>')
  html = html.replace(/_(?!\s)(.+?)(?<!\s)_/g, '<em>$1</em>')
  return html.replace(/\n/g, '<br>')
}
