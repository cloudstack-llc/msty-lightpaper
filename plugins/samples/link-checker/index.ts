import type { LightPaperPluginApi } from '../../../src/shared/plugin-api'

export function extractLinks(markdown: string) {
  return Array.from(markdown.matchAll(/!?\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)).map((match) => ({
    label: match[1],
    href: match[2],
    image: match[0].startsWith('!'),
  }))
}

export function checkLinks(markdown: string) {
  const links = extractLinks(markdown)
  const headings = new Set(
    Array.from(markdown.matchAll(/^#{1,6}\s+(.+)$/gm)).map((match) => match[1].trim().toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')),
  )
  const issues: string[] = []
  for (const link of links) {
    if (!link.href.trim()) issues.push(`Empty link target for "${link.label}"`)
    if (link.href.includes(' ')) issues.push(`Link contains unescaped spaces: ${link.href}`)
    if (link.href.startsWith('#') && !headings.has(link.href.slice(1).toLowerCase())) issues.push(`Missing heading anchor: ${link.href}`)
    if (link.image && !link.label.trim()) issues.push(`Image missing alt text: ${link.href}`)
  }
  return { links, issues }
}

export async function activate(api: LightPaperPluginApi) {
  api.commands.register('links.checkCurrentDocument', 'Check Links in Current Document', (ctx) => {
    const report = checkLinks(ctx.documentText || '')
    ctx.showToast(report.issues.length ? report.issues.join('\n') : `${report.links.length} links found; no structural issues.`)
  })
  api.commands.register('links.listRemoteUrls', 'List Remote URLs', (ctx) => {
    const urls = extractLinks(ctx.documentText || '').filter((link) => /^https?:\/\//.test(link.href)).map((link) => `- ${link.href}`)
    return ctx.insertText(`\n\n## Remote URLs\n\n${urls.join('\n') || 'No remote URLs found.'}\n`)
  })
}
