import React from 'react';
import isHotkey from 'is-hotkey';
import { INLINES } from '@contentful/rich-text-types';
import ToolbarIcon from './ToolbarIcon.es6';
import Hyperlink from './Hyperlink.es6';
import { editLink, mayEditLink, toggleLink, hasOnlyHyperlinkInlines } from './Util.es6';

const { HYPERLINK, ENTRY_HYPERLINK, ASSET_HYPERLINK } = INLINES;

export default ToolbarIcon;

export const HyperlinkPlugin = ({
  richTextAPI: { widgetAPI, logViewportAction, logShortcutAction }
}) => ({
  renderNode: (props, _editor, next) => {
    const { node, editor, key } = props;
    if (isHyperlink(node.type)) {
      return (
        <Hyperlink
          {...props}
          onClick={event => {
            event.preventDefault(); // Don't follow `href`

            editor.moveToRangeOfNode(node).focus();
            if (mayEditLink(editor.value)) {
              editLink(editor, widgetAPI.dialogs.createHyperlink, logViewportAction);
            }
          }}
          onEntityFetchComplete={() => logViewportAction('linkRendered', { key })}
        />
      );
    }
    return next();
  },
  onKeyDown: (event, editor, next) => {
    const hotkey = ['mod+k'];

    if (isHotkey(hotkey, event) && hasOnlyHyperlinkInlines(editor.value)) {
      if (mayEditLink(editor.value)) {
        editLink(editor, widgetAPI.dialogs.createHyperlink, logShortcutAction);
      } else {
        toggleLink(editor, widgetAPI.dialogs.createHyperlink, logShortcutAction);
      }
      return;
    }

    return next();
  },
  normalizeNode: (node, editor, next) => {
    if (isHyperlink(node.type) && node.getInlines().size > 0) {
      return () => {
        node
          .getInlines()
          .forEach(inlineNode => editor.unwrapInlineByKey(inlineNode.key, node.type));
      };
    }
    next();
  }
});

function isHyperlink(type) {
  return [HYPERLINK, ENTRY_HYPERLINK, ASSET_HYPERLINK].indexOf(type) > -1;
}