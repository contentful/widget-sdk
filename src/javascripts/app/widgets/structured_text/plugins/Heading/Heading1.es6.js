import React, { Component } from 'react';
import ToolbarIcon from '../shared/ToolbarIcon';
import { HEADING_1 } from '../../constants/Blocks';
import blockDecorator from '../shared/BlockToggleDecorator';

class Heading1 extends Component {
  render () {
    return <ToolbarIcon {...this.props} />;
  }
}

export default blockDecorator({
  type: HEADING_1,
  title: 'Heading 1 (ctrl+opt+1)',
  icon: 'LooksOne'
})(Heading1);
