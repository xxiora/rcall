// Placeholder so this folder type-checks on its own. DELETE this file: the
// template's real types should provide plugin() and the start/stop context.
// biome-ignore lint/suspicious/noExplicitAny: placeholder
declare function plugin(def: { start?(ctx: any): unknown; stop?(): unknown }): unknown
