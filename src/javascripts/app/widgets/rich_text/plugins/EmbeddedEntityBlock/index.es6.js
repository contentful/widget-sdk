import React from 'react';
import isHotkey from 'is-hotkey';

import ToolbarIcon from './ToolbarIcon.es6';
import EntityLinkBlock from './EmbeddedEntityBlock.es6';
import { BLOCKS } from '@contentful/rich-text-types';
import { hasBlockOfType, selectEntityAndInsert } from './Util.es6';
import asyncChange from '../shared/AsyncChange.es6';
import { actionOrigin } from '../shared/PluginApi.es6';

export default ToolbarIcon;

export const EmbeddedEntityBlockPlugin = ({
  richTextAPI: { widgetAPI, logAction },
  nodeType,
  hotkey
}) => {
  return {
    renderNode: (props, _editor, next) => {
      if (props.node.type === nodeType) {
        return <EntityLinkBlock {...props} {...props.attributes} />;
      }
      return next();
    },
    onKeyDown(e, editor, next) {
      if (hotkey && isHotkey(hotkey, e)) {
        const logShortcutAction = (name, data) =>
          logAction(name, { origin: actionOrigin.SHORTCUT, ...data });
        asyncChange(editor, newChange =>
          selectEntityAndInsert(nodeType, widgetAPI, newChange, logShortcutAction)
        );
        return;
      }
      if (isHotkey('enter', e)) {
        if (hasBlockOfType(editor, nodeType)) {
          editor.insertBlock(BLOCKS.PARAGRAPH).focus();
          return;
        }
      }
      return next();
    }
  };
};

export const EmbeddedEntryBlockPlugin = ({ type = BLOCKS.EMBEDDED_ENTRY, richTextAPI }) => {
  return EmbeddedEntityBlockPlugin({
    richTextAPI,
    nodeType: type,
    hotkey: ['mod+shift+e']
  });
};

export const EmbeddedAssetBlockPlugin = ({ type = BLOCKS.EMBEDDED_ASSET, richTextAPI }) => {
  return EmbeddedEntityBlockPlugin({
    richTextAPI,
    nodeType: type,
    hotkey: ['mod+shift+a']
  });
};
