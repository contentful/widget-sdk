import React from 'react';
import isHotkey from 'is-hotkey';
import { INLINES } from '@contentful/structured-text-types';
import ToolbarIcon from './ToolbarIcon.es6';
import EmbeddedEntryInline from './EmbeddedEntryInline.es6';
import asyncChange from '../shared/AsyncChange.es6';
import { selectEntryAndInsert, hasOnlyInlineEntryInSelection } from './Utils.es6';
import { haveAnyInlines } from '../shared/UtilHave.es6';

export default ToolbarIcon;

export const EmbeddedEntryInlinePlugin = ({ widgetAPI }) => ({
  renderNode: props => {
    if (props.node.type === INLINES.EMBEDDED_ENTRY) {
      return <EmbeddedEntryInline {...props} {...props.attributes} />;
    }
  },
  onKeyDown: (event, change, editor) => {
    if (isHotkey('cmd+shift+2', event) && !haveAnyInlines(change)) {
      asyncChange(editor, newChange => selectEntryAndInsert(widgetAPI, newChange));
    }
    if (isHotkey('enter', event)) {
      if (hasOnlyInlineEntryInSelection(change)) {
        event.preventDefault();
        change.moveToStartOfNextText();
      }
    }
  }
});
