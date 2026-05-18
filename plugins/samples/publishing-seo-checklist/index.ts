import type { LightPaperPluginApi } from '../../../src/shared/plugin-api'

export function auditPublishingReadiness(markdown: string) {
  const checks = [
    { label: 'Has H1 title', pass: /^#\s+.+/m.test(markdown) },
    { label: 'Has frontmatter', pass: markdown.startsWith('---\n') },
    { label: 'Has description field', pass: /^description:\s*.+/m.test(markdown) },
    { label: 'Has at least one H2', pass: /^##\s+.+/m.test(markdown) },
    { label: 'Images include alt text', pass: !/!\[\]\(/.test(markdown) },
    { label: 'Has outbound or internal links', pass: /\[[^\]]+\]\([^)]+\)|\[\[[^\]]+\]\]/.test(markdown) },
  ]
  const words = markdown.split(/\s+/).filter(Boolean).length
  const minutes = Math.max(1, Math.round(words / 220))
  const score = Math.round((checks.filter((check) => check.pass).length / checks.length) * 100)
  return { score, words, minutes, checks }
}

export function checklistMarkdown(markdown: string) {
  const audit = auditPublishingReadiness(markdown)
  return ['## Publishing checklist', '', `Score: ${audit.score}/100`, `Reading time: ${audit.minutes} min (${audit.words} words)`, '', ...audit.checks.map((check) => `- [${check.pass ? 'x' : ' '}] ${check.label}`)].join('\n')
}

export async function activate(api: LightPaperPluginApi) {
  api.commands.register('publish.auditCurrentDocument', 'Audit Publishing Readiness', async (ctx) => { const audit = auditPublishingReadiness(ctx.documentText || ''); if (ctx.activeFile) await api.metadata.set(ctx.activeFile, 'publishingAudit', audit); ctx.showToast(`Publishing readiness: ${audit.score}/100 · ${audit.minutes} min read`) })
  api.commands.register('publish.insertChecklist', 'Insert Publishing Checklist', (ctx) => ctx.insertText(`\n\n${checklistMarkdown(ctx.documentText || '')}\n`))
  api.ui.registerPanel('publish.checklist', 'Publishing Checklist', () => {
    const element = document.createElement('div')
    element.innerHTML = '<div class="lp-plugin-panel"><p class="lp-panel-kicker">Publishing</p><h3>Readiness checklist</h3><p>Audits titles, metadata, links, images, and reading length. Themes can style this panel through stable dock slots.</p></div>'
    return element
  })
}
