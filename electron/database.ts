import Database from 'better-sqlite3'
import { app } from 'electron'
import path from 'node:path'
import type { AppSettings, NoteMeta, PluginRecord, Workspace } from '../src/shared/types'

const defaults: AppSettings = { theme: 'obsidian', editorMode: 'split', syncScroll: true, splitRatio: 50, fontFamily: 'mono', layoutMode: 'standard', themeSettings: {}, aiProvider: 'offline', aiModel: 'local-or-plugin' }

export class LightPaperDb {
  private db: Database.Database
  constructor() {
    const dbPath = path.join(app.getPath('userData'), 'lightpaper.sqlite')
    this.db = new Database(dbPath)
    this.db.pragma('journal_mode = WAL')
    this.migrate()
  }
  private migrate() {
    this.db.exec(`
      create table if not exists workspaces (id text primary key, name text not null, path text not null unique, createdAt integer not null, lastOpenedAt integer not null);
      create table if not exists settings (key text primary key, value text not null);
      create table if not exists note_meta (path text primary key, title text not null, summary text, tags text not null default '[]', wordCount integer not null default 0, updatedAt integer not null);
      create table if not exists plugins (id text primary key, json text not null, enabled integer not null default 1);
      create table if not exists kv (scope text not null, key text not null, value text not null, primary key(scope, key));
    `)
    if (!this.db.prepare('select value from settings where key = ?').get('app')) this.setSettings(defaults)
  }
  listWorkspaces(): Workspace[] { return this.db.prepare('select * from workspaces order by lastOpenedAt desc').all() as Workspace[] }
  upsertWorkspace(workspace: Workspace) { this.db.prepare('insert into workspaces(id,name,path,createdAt,lastOpenedAt) values(@id,@name,@path,@createdAt,@lastOpenedAt) on conflict(path) do update set name=@name,lastOpenedAt=@lastOpenedAt').run(workspace) }
  removeWorkspace(id: string) { this.db.prepare('delete from workspaces where id=?').run(id) }
  getSettings(): AppSettings { return { ...defaults, ...JSON.parse((this.db.prepare('select value from settings where key=?').get('app') as { value: string } | undefined)?.value ?? '{}') } }
  setSettings(settings: AppSettings) { this.db.prepare('insert into settings(key,value) values(?,?) on conflict(key) do update set value=excluded.value').run('app', JSON.stringify(settings)) }
  upsertMeta(meta: NoteMeta) { this.db.prepare('insert into note_meta(path,title,summary,tags,wordCount,updatedAt) values(@path,@title,@summary,@tags,@wordCount,@updatedAt) on conflict(path) do update set title=@title,summary=@summary,tags=@tags,wordCount=@wordCount,updatedAt=@updatedAt').run({ ...meta, tags: JSON.stringify(meta.tags) }) }
  getMeta(pathValue: string): NoteMeta | undefined { const row = this.db.prepare('select * from note_meta where path=?').get(pathValue) as any; return row ? { ...row, tags: JSON.parse(row.tags) } : undefined }
  listPlugins(): PluginRecord[] { return (this.db.prepare('select * from plugins').all() as any[]).map((row) => ({ ...JSON.parse(row.json), enabled: !!row.enabled })) }
  removePlugins(ids: string[]) {
    const remove = this.db.prepare('delete from plugins where id=?')
    const transaction = this.db.transaction((pluginIds: string[]) => pluginIds.forEach((id) => remove.run(id)))
    transaction(ids)
  }
  clearPlugins() { this.db.prepare('delete from plugins').run() }
  upsertPlugin(plugin: PluginRecord) {
    const existing = this.db.prepare('select enabled from plugins where id=?').get(plugin.id) as { enabled: number } | undefined
    const enabled = existing ? existing.enabled : plugin.enabled ? 1 : 0
    this.db.prepare('insert into plugins(id,json,enabled) values(?,?,?) on conflict(id) do update set json=excluded.json').run(plugin.id, JSON.stringify({ ...plugin, enabled: !!enabled }), enabled)
  }
  setPluginEnabled(id: string, enabled: boolean) { this.db.prepare('update plugins set enabled=? where id=?').run(enabled ? 1 : 0, id) }
  kvGet<T>(scope: string, key: string): T | undefined { const row = this.db.prepare('select value from kv where scope=? and key=?').get(scope, key) as { value: string } | undefined; return row ? JSON.parse(row.value) : undefined }
  kvSet(scope: string, key: string, value: unknown) { this.db.prepare('insert into kv(scope,key,value) values(?,?,?) on conflict(scope,key) do update set value=excluded.value').run(scope, key, JSON.stringify(value)) }
}
