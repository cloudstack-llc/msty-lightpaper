import type { LightPaperPluginApi } from '../../../src/shared/plugin-api'
import { extractWikiLinks, remarkWikiLinks } from '../backlinks-wikilinks'
import { parseFrontmatter, stringifyFrontmatter } from '../frontmatter-manager'
import { formatIssues, lintMarkdown } from '../markdown-linter'
import { formatMarkdownTable } from '../table-formatter'

export function markdownPowerReport(markdown: string) {
  const parsed = parseFrontmatter(markdown)
  const wikiLinks = extractWikiLinks(markdown)
  const lint = lintMarkdown(markdown)
  const headings = Array.from(markdown.matchAll(/^(#{1,6})\s+(.+)$/gm)).map((match) => `${match[1]} ${match[2]}`)
  return [
    '## Markdown Power Pack Report',
    '',
    `- Frontmatter fields: ${Object.keys(parsed.data).length || 0}`,
    `- Wiki links: ${wikiLinks.length}`,
    `- Headings: ${headings.length}`,
    `- Lint issues: ${lint.length}`,
    '',
    headings.length ? '### Headings\n\n' + headings.map((heading) => `- ${heading}`).join('\n') : '',
    lint.length ? '\n### Diagnostics\n\n' + formatIssues(lint) : '',
  ].filter(Boolean).join('\n')
}

export function normalizeMarkdownPowerPack(markdown: string) {
  const parsed = parseFrontmatter(markdown)
  const body = parsed.body.replace(/\s+$/gm, '').replace(/\n{4,}/g, '\n\n\n')
  if (!Object.keys(parsed.data).length) return body
  return stringifyFrontmatter(parsed.data) + body
}

export async function activate(api: LightPaperPluginApi) {
  api.markdown.registerRemarkPlugin('powerpack.wikilinks', remarkWikiLinks)
  api.commands.register('powerpack.insertCallout', 'Power Pack: Insert Callout', (ctx) => ctx.insertText('\n> [!NOTE] Note\n> \n'))
  api.commands.register('powerpack.auditMarkdown', 'Power Pack: Audit Markdown', (ctx) => ctx.insertText(`\n\n${markdownPowerReport(ctx.documentText || '')}\n`))
  api.commands.register('powerpack.normalizeMarkdown', 'Power Pack: Normalize Markdown', async (ctx) => ctx.replaceSelection(normalizeMarkdownPowerPack(ctx.documentText || '')))
  api.commands.register('powerpack.formatTable', 'Power Pack: Format Table', async (ctx) => ctx.replaceSelection(formatMarkdownTable(ctx.selectedText || ctx.documentText || '')))
}
