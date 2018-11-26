import React, { Component } from 'react';
import ToolbarIcon from '../shared/ToolbarIcon.es6';
import markPlugin from '../shared/MarkPlugin.es6';
import markToggleDecorator from '../shared/MarkToggleDecorator.es6';
import { MARKS } from '@contentful/rich-text-types';

export const ItalicPlugin = ({ richTextAPI: { logAction } }) => {
  return markPlugin({
    type: MARKS.ITALIC,
    tagName: 'em',
    hotkey: ['cmd+i', 'ctrl+i'],
    logAction
  });
};

class Italic extends Component {
  render() {
    return <ToolbarIcon {...this.props} />;
  }
}

export default markToggleDecorator({
  type: MARKS.ITALIC,
  title: 'Italic',
  icon: 'FormatItalic'
})(Italic);
