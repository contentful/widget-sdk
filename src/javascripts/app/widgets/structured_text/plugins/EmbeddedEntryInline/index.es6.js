import React from 'react';
import isHotkey from 'is-hotkey';
import entitySelector from 'entitySelector';
import { INLINES } from '@contentful/structured-text-types';
import ToolbarIcon, { createInlineNode } from './ToolbarIcon.es6';
import EmbeddedEntryInline from './EmbeddedEntryInline.es6';
import asyncChange from '../shared/AsyncChange.es6';

export default ToolbarIcon;

export const EmbeddedEntryInlinePlugin = () => ({
  renderNode: props => {
    if (props.node.type === INLINES.EMBEDDED_ENTRY) {
      return <EmbeddedEntryInline {...props} {...props.attributes} />;
    }
  },
  onKeyDown: (event, _, editor) => {
    if (isHotkey('cmd+shift+2', event)) {
      asyncChange(editor, async change => {
        const entry = await entitySelector.openFromField({ linkType: 'Entry' }, 0);
        if (!entry[0]) {
          return;
        }

        const node = createInlineNode(entry[0].sys.id);

        change
          .insertInline(node)
          .moveToStartOfNextText()
          .focus();
      });
    }
  }
});
