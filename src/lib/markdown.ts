import MarkdownIt from 'markdown-it'
import anchor from 'markdown-it-anchor'
import footnote from 'markdown-it-footnote'
import hljs from 'markdown-it-highlightjs'
import taskLists from 'markdown-it-task-lists'

export const md = new MarkdownIt({ html: false, linkify: true, typographer: true, breaks: false })
  .use(anchor, { permalink: anchor.permalink.linkInsideHeader({ symbol: '#', placement: 'after' }) })
  .use(footnote)
  .use(hljs)
  .use(taskLists, { enabled: true, label: true })

export function renderMarkdown(source: string) {
  const calloutSource = source.replace(/^>\s*\[!(NOTE|TIP|WARNING|DANGER|AI)\]\s*(.*)$/gim, (_m, type, title) => `:::callout ${String(type).toLowerCase()} ${title || type}\n`)
  return md.render(calloutSource).replace(/<p>:::callout\s+(\w+)\s*([^<]*)<\/p>/g, '<aside class="callout callout-$1"><strong>$2</strong>')
}
