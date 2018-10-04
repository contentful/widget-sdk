import React from 'react';
import isHotkey from 'is-hotkey';

import ToolbarIcon from './ToolbarIcon.es6';
import EntityLinkBlock from './EmbeddedEntityBlock.es6';
import { BLOCKS } from '@contentful/structured-text-types';
import { getNodeType, hasBlockOfType, selectEntityAndInsert } from './Util.es6';
import asyncChange from '../shared/AsyncChange.es6';

export default ToolbarIcon;

export const EmbeddedEntityBlockPlugin = ({ type, hotkey, widgetAPI }) => {
  const pluginNodeType = getNodeType(type);
  return {
    renderNode: props => {
      if (props.node.type === pluginNodeType) {
        return <EntityLinkBlock {...props} {...props.attributes} />;
      }
    },
    onKeyDown(e, change, editor) {
      if (hotkey && isHotkey(hotkey, e)) {
        asyncChange(editor, newChange => selectEntityAndInsert(widgetAPI, newChange));
      }
      if (isHotkey('enter', e)) {
        if (hasBlockOfType(change, pluginNodeType)) {
          return change.insertBlock(BLOCKS.PARAGRAPH).focus();
        }
      }
    }
  };
};
