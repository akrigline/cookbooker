function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/**
 * Renders Chef's Notes text with simple inline bold/italic styling only.
 * Supports bold (double-asterisk or double-underscore) and italic (single
 * marker) syntax. All other input is HTML-escaped first, so no other markup
 * or scripting can be injected.
 */
export function renderChefNotes(text) {
  if (!text) return ''
  let html = escapeHtml(text)
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/__(.+?)__/g, '<strong>$1</strong>')
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')
  html = html.replace(/_(.+?)_/g, '<em>$1</em>')
  return html.replace(/\n/g, '<br>')
}
