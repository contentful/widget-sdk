import React, { Component } from 'react';
import ToolbarIcon from '../shared/ToolbarIcon';
import { BLOCKS } from '@contentful/structured-text-types';
import blockDecorator from '../shared/BlockToggleDecorator';

class Heading1 extends Component {
  render () {
    return <ToolbarIcon {...this.props} />;
  }
}

export default blockDecorator({
  type: BLOCKS.HEADING_1,
  title: 'Heading 1 (ctrl+opt+1)',
  icon: 'HeadingOne'
})(Heading1);
