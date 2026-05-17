import { describe, expect, it } from 'vitest'
import { PluginHost } from './plugin-host'
import { renderMarkdown } from './markdown-pipeline'
import type { PluginRecord } from '@shared/types'
import { remarkWikiLinks } from '../../plugins/samples/backlinks-wikilinks'

describe('Markdown pipeline', () => {
  it('renders GitHub-flavored Markdown through unified', () => {
    const html = renderMarkdown('| Name | Done |\n| --- | --- |\n| Draft | yes |\n\n- [x] Ship tests')

    expect(html).toContain('<table>')
    expect(html).toContain('contains-task-list')
    expect(html).toContain('type="checkbox"')
  })

  it('turns LightPaper callout blockquotes into stylable asides', () => {
    const html = renderMarkdown('> [!NOTE] Root cause\n> Confirm before changing code.')

    expect(html).toContain('<aside')
    expect(html).toContain('callout-note')
    expect(html).toContain('Root cause')
  })

  it('sanitizes unsafe HTML from preview output', () => {
    const html = renderMarkdown('# Safe\n\n<script>alert("x")</script>\n\n<img src=x onerror=alert(1)>')

    expect(html).toContain('<h1')
    expect(html).not.toContain('<script>')
    expect(html).not.toContain('onerror')
  })

  it('marks external links with a safe browser policy', () => {
    const html = renderMarkdown('[OpenAI](https://openai.com)')

    expect(html).toContain('target="_blank"')
    expect(html).toContain('noopener')
    expect(html).toContain('markdown-link')
  })

  it('applies registered plugin Markdown extensions', async () => {
    const plugin: PluginRecord = {
      id: 'lightpaper.backlinks-wikilinks',
      name: 'Wiki Links',
      version: '1.0.0',
      description: 'Wiki link renderer',
      permissions: ['markdown'],
      contributes: { markdown: [{ id: 'wikilinks', kind: 'remark' }] },
      enabled: true,
    }
    const host = new PluginHost({
      modules: {
        'lightpaper.backlinks-wikilinks': {
          activate(api) {
            api.markdown.registerRemarkPlugin('wikilinks', remarkWikiLinks)
          },
        },
      },
    })

    await host.activatePlugins([plugin])
    const html = renderMarkdown('See [[Architecture|the architecture note]].', { extensions: host.listMarkdownExtensions() })

    expect(html).toContain('lightpaper://wiki/Architecture')
    expect(html).toContain('data-wiki-target="Architecture"')
    expect(html).toContain('the architecture note')
  })
})
