import type { LightPaperPluginApi } from '../../../src/shared/plugin-api'

function isoDate(date = new Date()) { return date.toISOString().slice(0, 10) }
export function todayTemplate(date = new Date()) { return `# ${isoDate(date)}\n\n## Plan\n\n- \n\n## Notes\n\n\n## Decisions\n\n\n## Done\n\n- \n` }
export function weeklyTemplate(date = new Date()) { return `# Weekly Review — ${isoDate(date)}\n\n## Wins\n\n- \n\n## Open Loops\n\n- \n\n## Next Week\n\n- \n\n## Notes Worth Keeping\n\n` }
export function meetingTemplate(date = new Date()) { return `# Meeting — ${isoDate(date)}\n\n## Attendees\n\n- \n\n## Agenda\n\n- \n\n## Notes\n\n\n## Decisions\n\n- \n\n## Action Items\n\n- [ ] \n` }

export async function activate(api: LightPaperPluginApi) {
  api.commands.register('daily.insertTodayTemplate', 'Insert Today Template', (ctx) => ctx.insertText(todayTemplate()))
  api.commands.register('daily.insertWeeklyTemplate', 'Insert Weekly Review Template', (ctx) => ctx.insertText(weeklyTemplate()))
  api.commands.register('daily.insertMeetingTemplate', 'Insert Meeting Notes Template', (ctx) => ctx.insertText(meetingTemplate()))
}
