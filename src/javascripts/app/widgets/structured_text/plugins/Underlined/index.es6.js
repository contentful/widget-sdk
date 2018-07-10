import React, { Component } from 'react';
import ToolbarIcon from '../shared/ToolbarIcon';
import markPlugin from '../shared/MarkPlugin';
import markToggleDecorator from '../shared/MarkToggleDecorator';
import { UNDERLINED } from '../../constants/Marks';

export const UnderlinedPlugin = () => {
  return markPlugin(
    {
      type: UNDERLINED,
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
  type: UNDERLINED,
  title: 'Underline (cmd + u)',
  icon: 'FormatUnderlined'
})(Underlined);
