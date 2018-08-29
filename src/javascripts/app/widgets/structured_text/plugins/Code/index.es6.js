import React, { Component } from 'react';
import ToolbarIcon from '../shared/ToolbarIcon';
import markPlugin from '../shared/MarkPlugin';
import markToggleDecorator from '../shared/MarkToggleDecorator';
import { MARKS } from '@contentful/structured-text-types';

export const CodePlugin = () => {
  return markPlugin(
    {
      type: MARKS.CODE,
      tagName: 'code'
    },
    'cmd+/'
  );
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
