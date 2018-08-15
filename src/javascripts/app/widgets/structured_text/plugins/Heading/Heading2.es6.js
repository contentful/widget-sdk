import React, { Component } from 'react';
import ToolbarDropdownListItem from '../shared/ToolbarDropdownListItem';
import { BLOCKS } from '@contentful/structured-text-types';
import blockDecorator from '../shared/BlockToggleDecorator';

class Heading2 extends Component {
  render () {
    return <ToolbarDropdownListItem {...this.props}>Heading 2</ToolbarDropdownListItem>;
  }
}

export default blockDecorator({
  type: BLOCKS.HEADING_2,
  title: 'Heading 2 (cmd+opt+2)',
  icon: 'HeadingTwo'
})(Heading2);
