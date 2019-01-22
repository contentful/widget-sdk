import React from 'react';
import isHotkey from 'is-hotkey';
import { INLINES } from '@contentful/rich-text-types';
import ToolbarIcon from './ToolbarIcon.es6';
import Hyperlink from './Hyperlink.es6';
import { editLink, mayEditLink, toggleLink, hasOnlyHyperlinkInlines } from './Util.es6';
import asyncChange from '../shared/AsyncChange.es6';
import { actionOrigin } from '../shared/PluginApi.es6';

const { HYPERLINK, ENTRY_HYPERLINK, ASSET_HYPERLINK } = INLINES;

export default ToolbarIcon;

export const HyperlinkPlugin = ({ richTextAPI: { widgetAPI, logAction } }) => ({
  renderNode: (props, _editor, next) => {
    if (isHyperlink(props.node.type)) {
      return (
        <Hyperlink
          {...props}
          onClick={event => {
            event.preventDefault(); // Don't follow `href`
            const { editor } = props;

            editor.moveToRangeOfNode(props.node).focus();
            if (mayEditLink(editor.value)) {
              const logViewportAction = (name, data) =>
                logAction(name, { origin: actionOrigin.VIEWPORT, ...data });
              return asyncChange(editor, newChange =>
                editLink(newChange, widgetAPI.dialogs.createHyperlink, logViewportAction)
              );
            }
          }}
        />
      );
    }
    return next();
  },
  onKeyDown: (event, editor, next) => {
    const hotkey = ['mod+k'];

    if (isHotkey(hotkey, event) && hasOnlyHyperlinkInlines(editor.value)) {
      const logShortcutAction = (name, data) =>
        logAction(name, { origin: actionOrigin.SHORTCUT, ...data });
      const changeFn = mayEditLink(editor.value) ? editLink : toggleLink;
      asyncChange(editor, newChange =>
        changeFn(newChange, widgetAPI.dialogs.createHyperlink, logShortcutAction)
      );
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
