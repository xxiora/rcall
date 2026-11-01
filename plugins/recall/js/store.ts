// Pure logic. No Revenge or Discord APIs live here, so it is fully testable.

export interface SavedMessage {
  id: string
  channelId: string
  guildId: string | null // null = DM / group DM
  authorName: string
  content: string // snapshot taken at save time, survives deletion
  savedAt: number
}

export interface Persistence {
  read(): Promise<string | null>
  write(value: string): Promise<void>
}

export type JumpResult = 'ok' | 'unavailable'

const isSaved = (v: unknown): v is SavedMessage => {
  if (typeof v !== 'object' || v === null) return false
  const m = v as Record<string, unknown>
  return (
    typeof m.id === 'string' &&
    typeof m.channelId === 'string' &&
    (m.guildId === null || typeof m.guildId === 'string') &&
    typeof m.authorName === 'string' &&
    typeof m.content === 'string' &&
    typeof m.savedAt === 'number'
  )
}

/** Corrupt or unexpected stored data yields an empty list instead of throwing. */
export function parse(raw: string | null): SavedMessage[] {
  if (!raw) return []
  try {
    const data: unknown = JSON.parse(raw)
    return Array.isArray(data) ? data.filter(isSaved) : []
  } catch {
    return []
  }
}

/** Newest first; empty query returns everything. */
export function search(items: readonly SavedMessage[], query: string): SavedMessage[] {
  const q = query.trim().toLowerCase()
  const sorted = [...items].sort((a, b) => b.savedAt - a.savedAt)
  if (!q) return sorted
  return sorted.filter(
    m => m.content.toLowerCase().includes(q) || m.authorName.toLowerCase().includes(q),
  )
}

/** Standard Discord message link format. */
export function jumpUrl(m: SavedMessage): string {
  return `https://discord.com/channels/${m.guildId ?? '@me'}/${m.channelId}/${m.id}`
}

export class SavedStore {
  private items: SavedMessage[] = []
  private readonly persistence: Persistence

  constructor(persistence: Persistence) {
    this.persistence = persistence
  }

  async load(): Promise<void> {
    this.items = parse(await this.persistence.read())
  }

  all(): readonly SavedMessage[] {
    return this.items
  }

  has(id: string): boolean {
    return this.items.some(m => m.id === id)
  }

  /** Returns false if the message was already saved. */
  async add(message: SavedMessage): Promise<boolean> {
    if (this.has(message.id)) return false
    this.items = [...this.items, message]
    await this.persist()
    return true
  }

  async remove(id: string): Promise<void> {
    this.items = this.items.filter(m => m.id !== id)
    await this.persist()
  }

  private persist(): Promise<void> {
    return this.persistence.write(JSON.stringify(this.items))
  }
}
