// The ONLY file that touches Revenge / Discord APIs.
//
// Every member below is a seam I could not verify against current Revenge
// documentation or types (see README, "Verification status"). They are left
// unimplemented on purpose instead of guessing at APIs. Fill them in from the
// plugin API types shipped with the template, then delete UnverifiedApiError.

import type { JumpResult, Persistence, SavedMessage } from './store.ts'

export class UnverifiedApiError extends Error {
  constructor(what: string) {
    super(`Revenge Recall: ${what} has not been wired to a verified Revenge API yet.`)
  }
}

/** What the saved-messages screen needs; implemented in index.ts. */
export interface SavedController {
  search(query: string): readonly SavedMessage[]
  remove(id: string): Promise<void>
  jump(message: SavedMessage): Promise<void>
}

export interface Host {
  /** Local-only storage that survives app restarts. */
  persistence: Persistence
  /** Add an item to the existing message long-press menu. Returns an unregister function. */
  addMessageAction(label: string, onPress: (message: SavedMessage) => void): () => void
  /** Add one entry point (existing menu / supported plugin interface). Returns an unregister function. */
  addEntryPoint(label: string, onPress: () => void): () => void
  /** Lightweight list screen or modal: search field, remove action, tap to jump. */
  openSaved(controller: SavedController): void
  /** Navigate to the original message. 'unavailable' if it cannot be opened. */
  jumpTo(message: SavedMessage): Promise<JumpResult>
  toast(text: string): void
}

// biome-ignore lint/suspicious/noExplicitAny: the real start() context type comes from the template.
export function createHost(_ctx: any): Host {
  throw new UnverifiedApiError('the host adapter (storage, message menu, entry point, screen, navigation)')
}
