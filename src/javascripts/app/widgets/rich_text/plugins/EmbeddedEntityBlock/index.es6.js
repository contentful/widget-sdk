import React from 'react';
import isHotkey from 'is-hotkey';

import ToolbarIcon from './ToolbarIcon.es6';
import EntityLinkBlock from './EmbeddedEntityBlock.es6';
import { BLOCKS } from '@contentful/rich-text-types';
import { hasBlockOfType, selectEntityAndInsert } from './Util.es6';
import asyncChange from '../shared/AsyncChange.es6';

export default ToolbarIcon;

export const EmbeddedEntityBlockPlugin = ({ nodeType, hotkey, widgetAPI }) => {
  return {
    renderNode: props => {
      if (props.node.type === nodeType) {
        return <EntityLinkBlock {...props} {...props.attributes} />;
      }
    },
    onKeyDown(e, change, editor) {
      if (hotkey && isHotkey(hotkey, e)) {
        asyncChange(editor, newChange => selectEntityAndInsert(nodeType, widgetAPI, newChange));
      }
      if (isHotkey('enter', e)) {
        if (hasBlockOfType(change, nodeType)) {
          return change.insertBlock(BLOCKS.PARAGRAPH).focus();
        }
      }
    }
  };
};

export const EmbeddedEntryBlockPlugin = ({ widgetAPI }) => {
  return EmbeddedEntityBlockPlugin({
    widgetAPI,
    nodeType: BLOCKS.EMBEDDED_ENTRY,
    hotkey: 'mod+shift+e'
  });
};

export const EmbeddedAssetBlockPlugin = ({ widgetAPI }) => {
  return EmbeddedEntityBlockPlugin({
    widgetAPI,
    nodeType: BLOCKS.EMBEDDED_ASSET,
    hotkey: 'mod+shift+a'
  });
};
