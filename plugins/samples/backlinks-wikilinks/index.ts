import type { LightPaperPluginApi } from '../../../src/shared/plugin-api'
import { visit } from 'unist-util-visit'

export function extractWikiLinks(text: string) {
  return Array.from(text.matchAll(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g)).map((match) => ({ target: match[1].trim(), label: match[2]?.trim() || match[1].trim() }))
}

export function extractMarkdownLinks(text: string) {
  return Array.from(text.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g)).map((match) => ({ label: match[1], target: match[2] }))
}

export function remarkWikiLinks() {
  return (tree: unknown) => {
    visit(tree as any, 'text', (node: any, index: number | undefined, parent: any) => {
      if (typeof index !== 'number' || !parent?.children || !String(node.value).includes('[[')) return

      const value = String(node.value)
      const replacements: any[] = []
      const pattern = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g
      let cursor = 0
      let match: RegExpExecArray | null

      while ((match = pattern.exec(value))) {
        if (match.index > cursor) replacements.push({ type: 'text', value: value.slice(cursor, match.index) })
        const target = match[1].trim()
        const label = match[2]?.trim() || target
        replacements.push({
          type: 'link',
          url: `lightpaper://wiki/${encodeURIComponent(target)}`,
          data: { hProperties: { className: ['wiki-link'], dataWikiTarget: target } },
          children: [{ type: 'text', value: label }],
        })
        cursor = match.index + match[0].length
      }

      if (!replacements.length) return
      if (cursor < value.length) replacements.push({ type: 'text', value: value.slice(cursor) })
      parent.children.splice(index, 1, ...replacements)
    })
  }
}

export async function activate(api: LightPaperPluginApi) {
  api.commands.register('links.extractWikiLinks', 'Extract Wiki Links', async (ctx) => { const links = extractWikiLinks(ctx.documentText || ''); if (ctx.activeFile) await api.metadata.set(ctx.activeFile, 'wikilinks', links); ctx.showToast(links.length ? links.map((link) => `[[${link.target}]]`).join(', ') : 'No wiki links found') })
  api.commands.register('links.insertWikiLink', 'Insert Wiki Link', async (ctx) => ctx.insertText(`[[${(ctx.selectedText || 'New Note').trim()}]]`))
  api.markdown.registerRemarkPlugin('wikilinks', remarkWikiLinks)
}
