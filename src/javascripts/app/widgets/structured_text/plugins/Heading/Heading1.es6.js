import React, { Component } from 'react';
import ToolbarDropdownListItem from '../shared/ToolbarDropdownListItem';
import { BLOCKS } from '@contentful/structured-text-types';
import blockDecorator from '../shared/BlockSelectDecorator';
import { blockTitles } from './HeadingDropdown';

class Heading1 extends Component {
  render () {
    return <ToolbarDropdownListItem {...this.props}>Heading 1</ToolbarDropdownListItem>;
  }
}

export default blockDecorator({
  type: BLOCKS.HEADING_1,
  title: blockTitles[BLOCKS.HEADING_1]
})(Heading1);
