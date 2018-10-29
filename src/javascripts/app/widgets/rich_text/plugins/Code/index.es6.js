import React, { Component } from 'react';
import ToolbarIcon from '../shared/ToolbarIcon.es6';
import markPlugin from '../shared/MarkPlugin.es6';
import markToggleDecorator from '../shared/MarkToggleDecorator.es6';
import { MARKS } from '@contentful/rich-text-types';

export const CodePlugin = ({ richTextAPI: { logAction } }) => {
  return markPlugin({
    type: MARKS.CODE,
    tagName: 'code',
    hotkey: 'cmd+/',
    logAction
  });
};

class Code extends Component {
  render() {
    return <ToolbarIcon {...this.props} />;
  }
}

export default markToggleDecorator({
  type: MARKS.CODE,
  title: 'Code',
  icon: 'Code'
})(Code);
