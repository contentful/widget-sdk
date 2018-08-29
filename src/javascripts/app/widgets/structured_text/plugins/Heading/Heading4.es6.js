import React, { Component } from 'react';
import ToolbarDropdownListItem from '../shared/ToolbarDropdownListItem';
import { BLOCKS } from '@contentful/structured-text-types';
import blockDecorator from '../shared/BlockSelectDecorator';
import { blockTitles } from './HeadingDropdown';

class Heading4 extends Component {
  render () {
    return (
      <ToolbarDropdownListItem {...this.props} data-test-id={BLOCKS.HEADING_4}>
        Heading 4
      </ToolbarDropdownListItem>
    );
  }
}

export default blockDecorator({
  type: BLOCKS.HEADING_4,
  title: blockTitles[BLOCKS.HEADING_4]
})(Heading4);
