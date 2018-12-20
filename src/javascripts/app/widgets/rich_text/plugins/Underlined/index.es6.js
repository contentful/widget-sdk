import React, { Component } from 'react';
import ToolbarIcon from '../shared/ToolbarIcon.es6';
import markPlugin from '../shared/MarkPlugin.es6';
import markToggleDecorator from '../shared/MarkToggleDecorator.es6';
import { MARKS } from '@contentful/rich-text-types';

export const UnderlinedPlugin = ({ richTextAPI: { logAction } }) => {
  return markPlugin({
    type: MARKS.UNDERLINE,
    tagName: 'u',
    hotkey: ['mod+u'],
    logAction
  });
};

class Underlined extends Component {
  render() {
    return <ToolbarIcon {...this.props} />;
  }
}

export default markToggleDecorator({
  type: MARKS.UNDERLINE,
  title: 'Underline',
  icon: 'FormatUnderlined'
})(Underlined);
