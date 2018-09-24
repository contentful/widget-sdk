import React from 'react';
import isHotkey from 'is-hotkey';
import { INLINES } from '@contentful/structured-text-types';
import ToolbarIcon from './ToolbarIcon.es6';
import EmbeddedEntryInline from './EmbeddedEntryInline.es6';
import asyncChange from '../shared/AsyncChange.es6';
import { selectEntryAndApply, hasOnlyInlineEntryInSelection } from './Utils.es6';

export default ToolbarIcon;

export const EmbeddedEntryInlinePlugin = ({ widgetAPI }) => ({
  renderNode: props => {
    if (props.node.type === INLINES.EMBEDDED_ENTRY) {
      return <EmbeddedEntryInline {...props} {...props.attributes} />;
    }
  },
  onKeyDown: (event, _, editor) => {
    if (isHotkey('cmd+shift+2', event)) {
      asyncChange(editor, async change => {
        await selectEntryAndApply(widgetAPI, change);
      });
    }
    // Selected Void inline node makes the whole field focused
    // which results in unwanted scrolling on up/down keys.
    // to fix that we intercept up/down and move anchor forward/backwards
    // if inline node is the only selected node.
    if (isHotkey('down', event)) {
      if (hasOnlyInlineEntryInSelection(editor.value.change())) {
        event.preventDefault();
        asyncChange(editor, async change => {
          change.moveToStartOfNextText();
        });
      }
    }
    if (isHotkey('up', event)) {
      if (hasOnlyInlineEntryInSelection(editor.value.change())) {
        event.preventDefault();
        asyncChange(editor, async change => {
          change.moveToStartOfPreviousText();
        });
      }
    }
  }
});
