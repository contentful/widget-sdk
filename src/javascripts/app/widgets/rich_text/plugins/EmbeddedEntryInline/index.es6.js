import React from 'react';
import isHotkey from 'is-hotkey';
import { INLINES } from '@contentful/rich-text-types';
import ToolbarIcon from './ToolbarIcon.es6';
import EmbeddedEntryInline from './EmbeddedEntryInline.es6';

import { selectEntryAndInsert, hasOnlyInlineEntryInSelection, canInsertInline } from './Utils.es6';

export default ToolbarIcon;

export const EmbeddedEntryInlinePlugin = ({ richTextAPI: { widgetAPI, logShortcutAction } }) => ({
  renderNode: (props, _editor, next) => {
    if (props.node.type === INLINES.EMBEDDED_ENTRY) {
      return <EmbeddedEntryInline {...props} {...props.attributes} />;
    }
    return next();
  },
  onKeyDown: (event, editor, next) => {
    const hotkey = ['mod+shift+2'];
    if (isHotkey(hotkey, event)) {
      if (canInsertInline(editor)) {
        selectEntryAndInsert(widgetAPI, editor, logShortcutAction);
        return;
      }
    }
    if (isHotkey('enter', event)) {
      if (hasOnlyInlineEntryInSelection(editor)) {
        event.preventDefault();
        editor.moveToStartOfNextText();
        return;
      }
    }
    return next();
  }
});
