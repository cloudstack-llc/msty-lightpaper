import * as aiCopilotCore from '../../plugins/samples/ai-copilot-core/index'
import type { LightPaperPluginModule } from '@shared/plugin-api'
import * as aiRewriteToolkit from '../../plugins/samples/ai-rewrite-toolkit/index'
import * as backlinksWikilinks from '../../plugins/samples/backlinks-wikilinks/index'
import * as dailyNotes from '../../plugins/samples/daily-notes/index'
import * as exportPack from '../../plugins/samples/export-pack/index'
import * as frontmatterManager from '../../plugins/samples/frontmatter-manager/index'
import * as linkChecker from '../../plugins/samples/link-checker/index'
import * as markdownPowerPack from '../../plugins/samples/markdown-power-pack/index'
import * as markdownLinter from '../../plugins/samples/markdown-linter/index'
import * as minimalWorkspace from '../../plugins/samples/minimal-workspace/index'
import * as modelProviderCatalog from '../../plugins/samples/model-provider-catalog/index'
import { popularWorkflowModules } from '../../plugins/samples/popular-workflow-suite/index'
import * as publisherKit from '../../plugins/samples/publisher-kit/index'
import * as publishingSeoChecklist from '../../plugins/samples/publishing-seo-checklist/index'
import * as snippetTemplateLibrary from '../../plugins/samples/snippet-template-library/index'
import * as tableFormatter from '../../plugins/samples/table-formatter/index'

export const bundledPluginModules: Record<string, LightPaperPluginModule> = {
  'lightpaper.ai-copilot': aiCopilotCore,
  'lightpaper.ai-rewrite-toolkit': aiRewriteToolkit,
  'lightpaper.backlinks-wikilinks': backlinksWikilinks,
  'lightpaper.daily-notes': dailyNotes,
  'lightpaper.export-pack': exportPack,
  'lightpaper.frontmatter-manager': frontmatterManager,
  'lightpaper.link-checker': linkChecker,
  'lightpaper.markdown-powerpack': markdownPowerPack,
  'lightpaper.markdown-linter': markdownLinter,
  'lightpaper.minimal-workspace': minimalWorkspace,
  'lightpaper.model-provider-catalog': modelProviderCatalog,
  ...popularWorkflowModules,
  'lightpaper.publisher-kit': publisherKit,
  'lightpaper.publishing-seo-checklist': publishingSeoChecklist,
  'lightpaper.snippet-template-library': snippetTemplateLibrary,
  'lightpaper.table-formatter': tableFormatter,
}
