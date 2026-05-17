import type { LightPaperPluginApi } from '../../../src/shared/plugin-api'

export function extractWikiLinks(text: string) {
  return Array.from(text.matchAll(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g)).map((match) => ({ target: match[1].trim(), label: match[2]?.trim() || match[1].trim() }))
}

export function extractMarkdownLinks(text: string) {
  return Array.from(text.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g)).map((match) => ({ label: match[1], target: match[2] }))
}

export async function activate(api: LightPaperPluginApi) {
  api.commands.register('links.extractWikiLinks', 'Extract Wiki Links', async (ctx) => { const links = extractWikiLinks(ctx.documentText || ''); if (ctx.activeFile) await api.metadata.set(ctx.activeFile, 'wikilinks', links); ctx.showToast(links.length ? links.map((link) => `[[${link.target}]]`).join(', ') : 'No wiki links found') })
  api.commands.register('links.insertWikiLink', 'Insert Wiki Link', async (ctx) => ctx.insertText(`[[${(ctx.selectedText || 'New Note').trim()}]]`))
  api.markdown.addRenderer('wikilinks', (md: unknown) => { void md })
}
