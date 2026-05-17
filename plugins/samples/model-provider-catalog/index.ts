import type { AiProviderConfig } from '../../../src/shared/types'
import type { LightPaperPluginApi } from '../../../src/shared/plugin-api'

export const providerCatalog: AiProviderConfig[] = [
  {
    id: 'openai.responses',
    name: 'OpenAI Responses API',
    baseUrl: 'https://api.openai.com/v1',
    docsUrl: 'https://openai.com/api/pricing/',
    auth: { type: 'bearer', apiKeyRef: 'secret://providers/openai/api-key', envVar: 'OPENAI_API_KEY' },
    models: [
      {
        id: 'gpt-5.4',
        providerId: 'openai.responses',
        name: 'GPT-5.4',
        family: 'gpt-5',
        endpoint: '/responses',
        contextWindow: 270000,
        capabilities: ['chat', 'markdown', 'json', 'tools', 'streaming', 'reasoning'],
        pricing: { inputPerMillion: 2.5, outputPerMillion: 15, currency: 'USD' },
        notes: 'OpenAI public pricing listed this model at $2.50 input and $15.00 output per 1M tokens on 2026-05-17.',
      },
      {
        id: 'gpt-5.4-mini',
        providerId: 'openai.responses',
        name: 'GPT-5.4 mini',
        family: 'gpt-5',
        endpoint: '/responses',
        contextWindow: 270000,
        capabilities: ['chat', 'markdown', 'json', 'tools', 'streaming'],
        pricing: { inputPerMillion: 0.75, outputPerMillion: 4.5, currency: 'USD' },
        notes: 'OpenAI public pricing listed this model at $0.75 input and $4.50 output per 1M tokens on 2026-05-17.',
      },
    ],
  },
  {
    id: 'anthropic.messages',
    name: 'Anthropic Messages API',
    baseUrl: 'https://api.anthropic.com/v1',
    docsUrl: 'https://platform.claude.com/docs/en/docs/about-claude/pricing',
    auth: { type: 'api-key', apiKeyRef: 'secret://providers/anthropic/api-key', envVar: 'ANTHROPIC_API_KEY', headerName: 'x-api-key' },
    models: [
      {
        id: 'claude-sonnet',
        providerId: 'anthropic.messages',
        name: 'Claude Sonnet',
        family: 'claude',
        endpoint: '/messages',
        contextWindow: 200000,
        capabilities: ['chat', 'markdown', 'json', 'vision', 'tools', 'streaming', 'reasoning'],
        notes: 'Pricing is intentionally unresolved in this sample because Anthropic model prices vary by model generation and endpoint.',
      },
      {
        id: 'claude-haiku',
        providerId: 'anthropic.messages',
        name: 'Claude Haiku',
        family: 'claude',
        endpoint: '/messages',
        contextWindow: 200000,
        capabilities: ['chat', 'markdown', 'json', 'vision', 'streaming'],
        notes: 'Fast/low-cost Claude profile. Configure exact pricing when binding to a concrete Anthropic model id.',
      },
    ],
  },
  {
    id: 'ollama.local',
    name: 'Ollama Local',
    baseUrl: 'http://127.0.0.1:11434',
    docsUrl: 'https://ollama.com',
    auth: { type: 'none' },
    models: [
      {
        id: 'llama-local',
        providerId: 'ollama.local',
        name: 'Llama local',
        family: 'llama',
        endpoint: '/api/chat',
        contextWindow: 128000,
        capabilities: ['chat', 'markdown', 'json', 'local', 'streaming'],
        pricing: { inputPerMillion: 0, outputPerMillion: 0, currency: 'USD' },
        notes: 'Local runtime cost is represented as $0 API cost; hardware and electricity are outside this model price.',
      },
    ],
  },
  {
    id: 'custom.openai-compatible',
    name: 'Custom OpenAI-compatible Gateway',
    baseUrl: 'https://gateway.example.com/v1',
    auth: { type: 'bearer', apiKeyRef: 'secret://providers/custom-openai-compatible/api-key', envVar: 'LIGHTPAPER_GATEWAY_API_KEY' },
    models: [
      {
        id: 'gateway-default',
        providerId: 'custom.openai-compatible',
        name: 'Gateway default',
        family: 'custom',
        endpoint: '/responses',
        contextWindow: 128000,
        capabilities: ['chat', 'markdown', 'json', 'tools', 'streaming'],
        notes: 'Placeholder model for company gateways and OpenAI-compatible proxy services.',
      },
    ],
  },
]

export function formatModelCatalog(providers = providerCatalog) {
  return providers.flatMap((provider) => [
    `## ${provider.name}`,
    '',
    `Endpoint: \`${provider.baseUrl}\``,
    `Auth: \`${provider.auth.type}\`${provider.auth.apiKeyRef ? ` via \`${provider.auth.apiKeyRef}\`` : ''}`,
    '',
    ...provider.models.map((model) => {
      const price = model.pricing
        ? `, $${model.pricing.inputPerMillion ?? '?'} in / $${model.pricing.outputPerMillion ?? '?'} out per 1M tokens`
        : ', pricing not configured'
      return `- **${model.name}** (${model.id}): ${model.contextWindow.toLocaleString()} context${price}; ${model.capabilities.join(', ')}`
    }),
    '',
  ]).join('\n')
}

export async function activate(api: LightPaperPluginApi) {
  for (const provider of providerCatalog) api.ai.registerProvider(provider)
  api.commands.register('modelProvider.insertCatalog', 'Insert Model Provider Catalog', (ctx) => ctx.insertText(`\n\n# Model provider catalog\n\n${formatModelCatalog()}`))
}
