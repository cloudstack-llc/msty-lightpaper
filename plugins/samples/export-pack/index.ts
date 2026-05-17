import type { LightPaperPluginApi } from '../../../src/shared/plugin-api'

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]!))
}

export function markdownToSimpleHtml(markdown: string) {
  return markdown.split('\n').map((line) => {
    if (/^#\s+/.test(line)) return `<h1>${escapeHtml(line.replace(/^#\s+/, ''))}</h1>`
    if (/^##\s+/.test(line)) return `<h2>${escapeHtml(line.replace(/^##\s+/, ''))}</h2>`
    if (/^###\s+/.test(line)) return `<h3>${escapeHtml(line.replace(/^###\s+/, ''))}</h3>`
    if (/^-\s+/.test(line)) return `<li>${escapeHtml(line.replace(/^-\s+/, ''))}</li>`
    if (!line.trim()) return ''
    return `<p>${escapeHtml(line)}</p>`
  }).join('\n')
}

export function markdownToPlainText(markdown: string) {
  return markdown.replace(/^---[\s\S]*?---\n/, '').replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[*_`>#-]/g, '').replace(/\n{3,}/g, '\n\n').trim()
}

export function staticPage(markdown: string) {
  return `<!doctype html>\n<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>LightPaper Export</title><style>body{max-width:760px;margin:64px auto;font:18px/1.65 system-ui;color:#1f2937}h1,h2,h3{line-height:1.1}</style></head><body>\n${markdownToSimpleHtml(markdown)}\n</body></html>`
}

export async function activate(api: LightPaperPluginApi) {
  api.commands.register('export.copyHtml', 'Export Current Document as HTML', (ctx) => ctx.insertText(`\n\n<!-- HTML export -->\n${markdownToSimpleHtml(ctx.documentText || '')}`))
  api.commands.register('export.copyPlainText', 'Export Current Document as Plain Text', (ctx) => ctx.insertText(`\n\n${markdownToPlainText(ctx.documentText || '')}`))
  api.commands.register('export.prepareStaticPage', 'Prepare Static HTML Page', (ctx) => ctx.insertText(`\n\n\`\`\`html\n${staticPage(ctx.documentText || '')}\n\`\`\``))
}
