import type { LightPaperPluginModule } from '@shared/plugin-api'
import * as aiRewriteToolkit from '../../plugins/samples/ai-rewrite-toolkit/index'
import * as backlinksWikilinks from '../../plugins/samples/backlinks-wikilinks/index'
import * as dailyNotes from '../../plugins/samples/daily-notes/index'
import * as exportPack from '../../plugins/samples/export-pack/index'
import * as frontmatterManager from '../../plugins/samples/frontmatter-manager/index'
import * as linkChecker from '../../plugins/samples/link-checker/index'
import * as markdownLinter from '../../plugins/samples/markdown-linter/index'
import * as publishingSeoChecklist from '../../plugins/samples/publishing-seo-checklist/index'
import * as snippetTemplateLibrary from '../../plugins/samples/snippet-template-library/index'
import * as tableFormatter from '../../plugins/samples/table-formatter/index'

export const bundledPluginModules: Record<string, LightPaperPluginModule> = {
  'lightpaper.ai-rewrite-toolkit': aiRewriteToolkit,
  'lightpaper.backlinks-wikilinks': backlinksWikilinks,
  'lightpaper.daily-notes': dailyNotes,
  'lightpaper.export-pack': exportPack,
  'lightpaper.frontmatter-manager': frontmatterManager,
  'lightpaper.link-checker': linkChecker,
  'lightpaper.markdown-linter': markdownLinter,
  'lightpaper.publishing-seo-checklist': publishingSeoChecklist,
  'lightpaper.snippet-template-library': snippetTemplateLibrary,
  'lightpaper.table-formatter': tableFormatter,
}
