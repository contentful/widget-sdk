import React, { Component } from 'react';
import ToolbarIcon from '../shared/ToolbarIcon.es6';
import markPlugin from '../shared/MarkPlugin.es6';
import markToggleDecorator from '../shared/MarkToggleDecorator.es6';
import { MARKS } from '@contentful/rich-text-types';

export const BoldPlugin = () => {
  return markPlugin(
    {
      type: MARKS.BOLD,
      tagName: 'b'
    },
    'cmd+b'
  );
};

class Bold extends Component {
  render() {
    return <ToolbarIcon {...this.props} />;
  }
}

export default markToggleDecorator({
  type: MARKS.BOLD,
  title: 'Bold',
  icon: 'FormatBold'
})(Bold);
