import type { LightPaperPluginApi } from '../../../src/shared/plugin-api'

const templates = {
  adr: `# ADR: Title\n\n## Status\n\nProposed\n\n## Context\n\n\n## Decision\n\n\n## Consequences\n\n- \n`,
  bug: `# Bug Report\n\n## Summary\n\n\n## Steps to Reproduce\n\n1. \n\n## Expected\n\n\n## Actual\n\n\n## Environment\n\n- OS:\n- Version:\n`,
  release: `# Release Notes\n\n## Highlights\n\n- \n\n## Added\n\n- \n\n## Fixed\n\n- \n\n## Known Issues\n\n- \n`,
  brief: `# Project Brief\n\n## Goal\n\n\n## Users\n\n\n## Scope\n\n### In\n\n- \n\n### Out\n\n- \n\n## Risks\n\n- \n`,
}

export async function activate(api: LightPaperPluginApi) {
  api.commands.register('templates.insertAdr', 'Insert Architecture Decision Record', (ctx) => ctx.insertText(templates.adr))
  api.commands.register('templates.insertBugReport', 'Insert Bug Report', (ctx) => ctx.insertText(templates.bug))
  api.commands.register('templates.insertReleaseNotes', 'Insert Release Notes', (ctx) => ctx.insertText(templates.release))
  api.commands.register('templates.insertProjectBrief', 'Insert Project Brief', (ctx) => ctx.insertText(templates.brief))
}
