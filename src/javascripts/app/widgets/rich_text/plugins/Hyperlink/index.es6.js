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
  renderNode: props => {
    if (isHyperlink(props.node.type)) {
      return (
        <Hyperlink
          {...props}
          onClick={event => {
            const { editor } = props;
            event.preventDefault(); // Don't follow `href`.
            if (mayEditLink(editor.value)) {
              const logViewportAction = (name, data) =>
                logAction(name, { origin: actionOrigin.VIEWPORT, ...data });
              asyncChange(editor, newChange =>
                editLink(newChange, widgetAPI.dialogs.createHyperlink, logViewportAction)
              );
            }
          }}
        />
      );
    }
  },
  onKeyDown: (event, change, editor) => {
    const hotkey = ['mod+k'];

    if (isHotkey(hotkey, event) && hasOnlyHyperlinkInlines(change.value)) {
      const logShortcutAction = (name, data) =>
        logAction(name, { origin: actionOrigin.SHORTCUT, ...data });
      const changeFn = mayEditLink(change.value) ? editLink : toggleLink;
      asyncChange(editor, newChange =>
        changeFn(newChange, widgetAPI.dialogs.createHyperlink, logShortcutAction)
      );
    }
  },
  validateNode: node => {
    if (isHyperlink(node.type) && node.getInlines().size > 0) {
      return change => {
        node
          .getInlines()
          .forEach(inlineNode => change.unwrapInlineByKey(inlineNode.key, node.type));
      };
    }
  }
});

function isHyperlink(type) {
  return [HYPERLINK, ENTRY_HYPERLINK, ASSET_HYPERLINK].indexOf(type) > -1;
}
