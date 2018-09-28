import React from 'react';
import isHotkey from 'is-hotkey';

import ToolbarIcon from './ToolbarIcon.es6';
import EntryLinkBlock from './EmbeddedEntryBlock.es6';
import { BLOCKS } from '@contentful/structured-text-types';
import { hasBlockOfType, selectEntryAndInsert } from './Util.es6';
import asyncChange from '../shared/AsyncChange.es6';

export default ToolbarIcon;

export const EmbeddedEntryBlockPlugin = ({ widgetAPI }) => {
  return {
    renderNode: props => {
      if (props.node.type === BLOCKS.EMBEDDED_ENTRY) {
        return <EntryLinkBlock {...props} {...props.attributes} />;
      }
    },
    onKeyDown(e, change, editor) {
      if (isHotkey('mod+shift+e', e)) {
        asyncChange(editor, newChange => selectEntryAndInsert(widgetAPI, newChange));
      }
      if (isHotkey('enter', e)) {
        if (hasBlockOfType(change, BLOCKS.EMBEDDED_ENTRY)) {
          return change.insertBlock(BLOCKS.PARAGRAPH).focus();
        }
      }
    }
  };
};
