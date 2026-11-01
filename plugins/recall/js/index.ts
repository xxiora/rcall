import { createHost } from './host.ts'
import { SavedStore } from './store.ts'
import type { Host } from './host.ts'

// Unverified: the exact shape of plugin() and the unload hook name.
// `start` is documented in the template README; `stop` mirrors the native DSL.
let cleanups: Array<() => void> = []

export default plugin({
  async start(ctx) {
    let host: Host
    try {
      host = createHost(ctx)
    } catch (e) {
      console.error(e) // plugin stays loaded but inert until the adapter is wired
      return
    }

    const store = new SavedStore(host.persistence)
    await store.load()

    cleanups.push(
      host.addMessageAction('Save Message', async message => {
        const added = await store.add(message)
        host.toast(added ? 'Message saved' : 'Already saved')
      }),
      host.addEntryPoint('Saved Messages', () =>
        host.openSaved({
          search: query => search(store.all(), query),
          remove: id => store.remove(id),
          jump: async message => {
            const result = await host.jumpTo(message)
            if (result === 'unavailable') {
              host.toast('Couldn’t open that message. It may have been deleted.')
            }
          },
        }),
      ),
    )
  },

  stop() {
    for (const cleanup of cleanups.splice(0)) cleanup()
  },
})

import { search } from './store.ts'
