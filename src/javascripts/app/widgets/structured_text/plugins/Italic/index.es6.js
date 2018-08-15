import React, { Component } from 'react';
import ToolbarIcon from '../shared/ToolbarIcon';
import markPlugin from '../shared/MarkPlugin';
import markToggleDecorator from '../shared/MarkToggleDecorator';
import { MARKS } from '@contentful/structured-text-types';

export const ItalicPlugin = () => {
  return markPlugin(
    {
      type: MARKS.ITALIC,
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
  type: MARKS.ITALIC,
  title: 'Italic',
  icon: 'FormatItalic'
})(Italic);
