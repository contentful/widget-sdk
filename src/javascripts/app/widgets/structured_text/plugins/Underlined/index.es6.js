import React, { Component } from 'react';
import ToolbarIcon from '../shared/ToolbarIcon';
import markPlugin from '../shared/MarkPlugin';
import markToggleDecorator from '../shared/MarkToggleDecorator';
import { MARKS } from '@contentful/structured-text-types';

export const UnderlinedPlugin = () => {
  return markPlugin(
    {
      type: MARKS.UNDERLINED,
      tagName: 'u'
    },
    'cmd+u'
  );
};

class Underlined extends Component {
  render () {
    return <ToolbarIcon {...this.props} />;
  }
}

export default markToggleDecorator({
  type: MARKS.UNDERLINED,
  title: 'Underline (cmd + u)',
  icon: 'FormatUnderlined'
})(Underlined);
