import React, { Component } from 'react';
import ToolbarIcon from '../shared/ToolbarIcon';
import { BLOCKS } from '@contentful/structured-text-types';
import blockDecorator from '../shared/BlockToggleDecorator';

class Heading2 extends Component {
  render () {
    return <ToolbarIcon {...this.props} />;
  }
}

export default blockDecorator({
  type: BLOCKS.HEADING_2,
  title: 'Heading 2 (ctrl+opt+2)',
  icon: 'HeadingTwo'
})(Heading2);
