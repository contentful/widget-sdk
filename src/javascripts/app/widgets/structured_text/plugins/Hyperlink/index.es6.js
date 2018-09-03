import React from 'react';
import isHotkey from 'is-hotkey';
import { INLINES } from '@contentful/structured-text-types';
import ToolbarIcon from './ToolbarIcon.es6';
import Hyperlink from './Hyperlink.es6';
import { editLink, mayEditLink, toggleLink } from './Util.es6';

export default ToolbarIcon;

export const HyperlinkPlugin = ({ createHyperlinkDialog }) => ({
  renderNode: props => {
    if (props.node.type === INLINES.HYPERLINK) {
      return <Hyperlink {...props} />;
    }
  },

  onKeyDown: (event, _change, editor) => {
    if (isHotkey('cmd+k', event)) {
      asyncChange(editor, async change => {
        if (mayEditLink(change.value)) {
          await editLink(change, createHyperlinkDialog);
        } else {
          await toggleLink(change, createHyperlinkDialog);
        }
      });
    }
  },

  onClick(_event, change, editor) {
    if (mayEditLink(change.value)) {
      asyncChange(editor, async change => {
        await editLink(change, createHyperlinkDialog);
      });
    }
  }
});

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
function asyncChange(editor, cb) {
  setTimeout(async () => {
    const change = editor.value.change();
    await cb(change);
    editor.change(newChange => {
      newChange.operations = change.operations;
      newChange.value = change.value;
    });
  }, 0);
}
