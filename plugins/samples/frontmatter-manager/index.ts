import type { LightPaperCommandContext, LightPaperPluginApi } from '../../../src/shared/plugin-api'

type Frontmatter = Record<string, string | string[]>

export function parseFrontmatter(text: string): { data: Frontmatter; body: string } {
  if (!text.startsWith('---\n')) return { data: {}, body: text }
  const end = text.indexOf('\n---', 4)
  if (end === -1) return { data: {}, body: text }
  const data: Frontmatter = {}
  for (const line of text.slice(4, end).trim().split('\n')) {
    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/)
    if (!match) continue
    const [, key, value] = match
    data[key] = value.startsWith('[') && value.endsWith(']')
      ? value.slice(1, -1).split(',').map((item) => item.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean)
      : value.replace(/^['"]|['"]$/g, '')
  }
  return { data, body: text.slice(end + 5).replace(/^\n/, '') }
}

export function stringifyFrontmatter(data: Frontmatter) {
  return `---\n${Object.entries(data).map(([key, value]) => Array.isArray(value) ? `${key}: [${value.map((item) => JSON.stringify(item)).join(', ')}]` : `${key}: ${JSON.stringify(value)}`).join('\n')}\n---\n\n`
}

function titleFromBody(body: string) { return body.match(/^#\s+(.+)$/m)?.[1]?.trim() || 'Untitled' }
function tagsFromBody(body: string) { return Array.from(new Set(Array.from(body.matchAll(/(^|\s)#([A-Za-z][\w-]+)/g)).map((match) => match[2].toLowerCase()))).slice(0, 12) }

async function normalize(ctx: LightPaperCommandContext) {
  const { data, body } = parseFrontmatter(ctx.documentText || '')
  const now = new Date().toISOString()
  await ctx.replaceSelection(stringifyFrontmatter({ title: String(data.title || titleFromBody(body)), description: String(data.description || ''), tags: Array.isArray(data.tags) ? data.tags : tagsFromBody(body), status: String(data.status || 'draft'), created: String(data.created || now), updated: now }) + body)
  ctx.showToast('Frontmatter normalized')
}

export async function activate(api: LightPaperPluginApi) {
  api.commands.register('frontmatter.insertOrNormalize', 'Insert or Normalize Frontmatter', normalize)
  api.commands.register('frontmatter.touchUpdatedAt', 'Touch updatedAt Frontmatter', async (ctx) => { const parsed = parseFrontmatter(ctx.documentText || ''); parsed.data.updated = new Date().toISOString(); await ctx.replaceSelection(stringifyFrontmatter(parsed.data) + parsed.body); ctx.showToast('updatedAt refreshed') })
  api.commands.register('frontmatter.extractTitleTags', 'Extract Title and Tags', async (ctx) => { const parsed = parseFrontmatter(ctx.documentText || ''); parsed.data.title = titleFromBody(parsed.body); parsed.data.tags = tagsFromBody(parsed.body); await ctx.replaceSelection(stringifyFrontmatter(parsed.data) + parsed.body); ctx.showToast('Title and tags extracted') })
  api.ui.registerPanel('frontmatter.panel', 'Frontmatter', () => {
    const element = document.createElement('div')
    element.innerHTML = '<div class="lp-plugin-panel"><p class="lp-panel-kicker">Document metadata</p><h3>Frontmatter</h3><p>Normalize YAML fields, then use <code>cssClasses</code> to turn on theme helper layouts such as cards, image grids, and wide tables.</p></div>'
    return element
  })
}
