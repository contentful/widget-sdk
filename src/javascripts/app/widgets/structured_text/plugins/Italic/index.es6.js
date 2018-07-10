import React, { Component } from 'react';
import ToolbarIcon from '../shared/ToolbarIcon';
import markPlugin from '../shared/MarkPlugin';
import markToggleDecorator from '../shared/MarkToggleDecorator';
import { ITALIC } from '../../constants/Marks';

export const ItalicPlugin = () => {
  return markPlugin(
    {
      type: ITALIC,
      tagName: 'em'
    },
    'cmd+i'
  );
};

class Italic extends Component {
  render () {
    return <ToolbarIcon {...this.props} />;
  }
}

export default markToggleDecorator({
  type: ITALIC,
  title: 'Italic (cmd + i)',
  icon: 'FormatItalic'
})(Italic);
