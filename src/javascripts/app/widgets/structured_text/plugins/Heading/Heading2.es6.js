import React, { Component } from 'react';
import ToolbarDropdownListItem from '../shared/ToolbarDropdownListItem.es6';
import { BLOCKS } from '@contentful/structured-text-types';
import blockDecorator from '../shared/BlockSelectDecorator.es6';
import { blockTitles } from './HeadingDropdown.es6';

class Heading2 extends Component {
  render() {
    return (
      <ToolbarDropdownListItem {...this.props} data-test-id={BLOCKS.HEADING_2}>
        Heading 2
      </ToolbarDropdownListItem>
    );
  }
}

export default blockDecorator({
  type: BLOCKS.HEADING_2,
  title: blockTitles[BLOCKS.HEADING_2]
})(Heading2);
