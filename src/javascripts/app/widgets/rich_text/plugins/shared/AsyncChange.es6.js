/**
 * Just like `slate.Editor#change(cb)` but works with an async `cb`.
 *
 * Motivation: Slate event handlers' `change` on e.g. `onClick` or `onKeyDown` are
 * always applied synchronously. Mutations on `change` happening afterwards won't
 * be applied to the editor, no error is thrown, so effectively, they are ignored
 * silently.
 *
 * @param {slate.Editor} editor
 * @param {Function} cb Receives a `slate.Change` to be mutated with operations.
 */
export default async function asyncChange(editor, cb) {
  await cb(editor);
}
