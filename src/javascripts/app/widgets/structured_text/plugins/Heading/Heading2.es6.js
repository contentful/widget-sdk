import React, { Component } from 'react';
import ToolbarIcon from '../shared/ToolbarIcon';
import { HEADING_2 } from '../../constants/Blocks';
import blockDecorator from '../shared/BlockToggleDecorator';

class Heading2 extends Component {
  render () {
    return <ToolbarIcon {...this.props} />;
  }
}

export default blockDecorator({
  type: HEADING_2,
  title: 'Heading 2 (ctrl+opt+2)',
  icon: 'LooksTwo'
})(Heading2);
