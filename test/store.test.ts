import assert from 'node:assert/strict'
import { test } from 'node:test'
import { SavedStore, jumpUrl, parse, search } from '../plugins/revenge-recall/js/store.ts'
import type { Persistence, SavedMessage } from '../plugins/revenge-recall/js/store.ts'

const msg = (id: string, over: Partial<SavedMessage> = {}): SavedMessage => ({
  id, channelId: 'c1', guildId: 'g1', authorName: 'Ana', content: `hello ${id}`, savedAt: Number(id), ...over,
})

const memory = (initial: string | null = null): Persistence & { value: string | null } => {
  const p = { value: initial, read: async () => p.value, write: async (v: string) => { p.value = v } }
  return p
}

test('persists across a simulated restart', async () => {
  const disk = memory()
  const a = new SavedStore(disk)
  await a.add(msg('1'))
  const b = new SavedStore(disk)
  await b.load()
  assert.deepEqual(b.all().map(m => m.id), ['1'])
})

test('add is idempotent and remove works', async () => {
  const s = new SavedStore(memory())
  assert.equal(await s.add(msg('1')), true)
  assert.equal(await s.add(msg('1')), false)
  await s.remove('1')
  assert.equal(s.all().length, 0)
})

test('corrupt storage degrades to empty, bad entries are dropped', () => {
  assert.deepEqual(parse('{not json'), [])
  assert.deepEqual(parse('{"a":1}'), [])
  assert.deepEqual(parse(JSON.stringify([msg('1'), { id: 2 }])).map(m => m.id), ['1'])
})

test('search matches content and author, newest first', () => {
  const items = [msg('1', { content: 'Pizza night' }), msg('2', { authorName: 'Pizzaiolo' }), msg('3')]
  assert.deepEqual(search(items, ' pizza ').map(m => m.id), ['2', '1'])
  assert.deepEqual(search(items, '').map(m => m.id), ['3', '2', '1'])
})

test('jump url handles servers and DMs', () => {
  assert.equal(jumpUrl(msg('9')), 'https://discord.com/channels/g1/c1/9')
  assert.equal(jumpUrl(msg('9', { guildId: null })), 'https://discord.com/channels/@me/c1/9')
})
