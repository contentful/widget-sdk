import React, { Component } from 'react';
import ToolbarIcon from '../shared/ToolbarIcon';
import markPlugin from '../shared/MarkPlugin';
import markToggleDecorator from '../shared/MarkToggleDecorator';
import { MARKS } from '@contentful/structured-text-types';

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
  render () {
    return <ToolbarIcon {...this.props} />;
  }
}

export default markToggleDecorator({
  type: MARKS.BOLD,
  title: 'Bold',
  icon: 'FormatBold'
})(Bold);
