import React from 'react';
import isHotkey from 'is-hotkey';
import { INLINES } from '@contentful/structured-text-types';
import ToolbarIcon from './ToolbarIcon.es6';
import Hyperlink from './Hyperlink.es6';
import { editLink, mayEditLink, toggleLink } from './Util.es6';
import asyncChange from '../shared/AsyncChange.es6';

export default ToolbarIcon;

export const HyperlinkPlugin = ({ createHyperlinkDialog }) => ({
  renderNode: props => {
    if (props.node.type === INLINES.HYPERLINK) {
      return <Hyperlink {...props} />;
    }
  },

  onKeyDown: (event, _change, editor) => {
    if (isHotkey('cmd+k', event)) {
      asyncChange(editor, async change => {
        if (mayEditLink(change.value)) {
          await editLink(change, createHyperlinkDialog);
        } else {
          await toggleLink(change, createHyperlinkDialog);
        }
      });
    }
  },

  onClick(_event, change, editor) {
    if (mayEditLink(change.value)) {
      asyncChange(editor, async change => {
        await editLink(change, createHyperlinkDialog);
      });
    }
  }
});
