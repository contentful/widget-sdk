import React from 'react';
import isHotkey from 'is-hotkey';
import { INLINES } from '@contentful/rich-text-types';
import ToolbarIcon from './ToolbarIcon.es6';
import Hyperlink from './Hyperlink.es6';
import { editLink, mayEditLink, toggleLink, hasOnlyHyperlinkInlines } from './Util.es6';
import asyncChange from '../shared/AsyncChange.es6';

const { HYPERLINK, ENTRY_HYPERLINK, ASSET_HYPERLINK } = INLINES;

export default ToolbarIcon;

export const HyperlinkPlugin = ({ createHyperlinkDialog }) => ({
  renderNode: props => {
    if (isHyperlink(props.node.type)) {
      return (
        <Hyperlink
          {...props}
          onClick={event => {
            event.preventDefault(); // Don't follow `href`.
            if (mayEditLink(props.editor.value)) {
              asyncChange(props.editor, newChange => editLink(newChange, createHyperlinkDialog));
            }
          }}
        />
      );
    }
  },

  onKeyDown: (event, change, editor) => {
    if (isHotkey('cmd+k', event) && hasOnlyHyperlinkInlines(change.value)) {
      if (mayEditLink(change.value)) {
        asyncChange(editor, newChange => editLink(newChange, createHyperlinkDialog));
      } else {
        asyncChange(editor, newChange => toggleLink(newChange, createHyperlinkDialog));
      }
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
