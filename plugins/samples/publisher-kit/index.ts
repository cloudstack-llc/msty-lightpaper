import type { LightPaperPluginApi } from '../../../src/shared/plugin-api'
import { markdownToPlainText, staticPage } from '../export-pack'
import { auditPublishingReadiness, checklistMarkdown } from '../publishing-seo-checklist'

export function publishingBrief(markdown: string) {
  const audit = auditPublishingReadiness(markdown)
  return [
    '## Publisher Kit Brief',
    '',
    `- Readiness: ${audit.score}/100`,
    `- Reading time: ${audit.minutes} min`,
    `- Word count: ${audit.words}`,
    '',
    ...audit.checks.map((check) => `- [${check.pass ? 'x' : ' '}] ${check.label}`),
  ].join('\n')
}

export function staticHtmlExportBlock(markdown: string) {
  return `\n\n\`\`\`html\n${staticPage(markdown)}\n\`\`\`\n`
}

export async function activate(api: LightPaperPluginApi) {
  api.commands.register('publisher.auditDocument', 'Publisher Kit: Audit Document', (ctx) => ctx.insertText(`\n\n${publishingBrief(ctx.documentText || '')}\n`))
  api.commands.register('publisher.insertChecklist', 'Publisher Kit: Insert Checklist', (ctx) => ctx.insertText(`\n\n${checklistMarkdown(ctx.documentText || '')}\n`))
  api.commands.register('publisher.prepareStaticHtml', 'Publisher Kit: Prepare Static HTML', (ctx) => ctx.insertText(staticHtmlExportBlock(ctx.documentText || '')))
  api.commands.register('publisher.appendPlainText', 'Publisher Kit: Append Plain Text Export', (ctx) => ctx.insertText(`\n\n## Plain text export\n\n${markdownToPlainText(ctx.documentText || '')}\n`))
}
