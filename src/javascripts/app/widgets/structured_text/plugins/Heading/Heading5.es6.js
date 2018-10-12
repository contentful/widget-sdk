import React, { Component } from 'react';
import ToolbarDropdownListItem from '../shared/ToolbarDropdownListItem.es6';
import { BLOCKS } from '@contentful/rich-text-types';
import blockDecorator from '../shared/BlockSelectDecorator.es6';
import { blockTitles } from './HeadingDropdown.es6';

class Heading5 extends Component {
  render() {
    return (
      <ToolbarDropdownListItem {...this.props} data-test-id={BLOCKS.HEADING_5}>
        Heading 5
      </ToolbarDropdownListItem>
    );
  }
}

export default blockDecorator({
  type: BLOCKS.HEADING_5,
  title: blockTitles[BLOCKS.HEADING_5]
})(Heading5);
