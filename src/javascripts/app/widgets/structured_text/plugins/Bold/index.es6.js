import React, { Component } from 'react';
import ToolbarIcon from '../shared/ToolbarIcon';
import markPlugin from '../shared/MarkPlugin';
import markToggleDecorator from '../shared/MarkToggleDecorator';
import { BOLD } from '../../constants/Marks';

export const BoldPlugin = () => {
  return markPlugin(
    {
      type: BOLD,
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
  type: BOLD,
  title: 'Make a bold move',
  icon: 'FormatBold'
})(Bold);
