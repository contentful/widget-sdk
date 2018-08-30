import React, { Component } from 'react';
import ToolbarDropdownListItem from '../shared/ToolbarDropdownListItem.es6';
import { BLOCKS } from '@contentful/structured-text-types';
import blockDecorator from '../shared/BlockSelectDecorator.es6';
import { blockTitles } from './HeadingDropdown.es6';

class Heading6 extends Component {
  render() {
    return (
      <ToolbarDropdownListItem {...this.props} data-test-id={BLOCKS.HEADING_6}>
        Heading 6
      </ToolbarDropdownListItem>
    );
  }
}

export default blockDecorator({
  type: BLOCKS.HEADING_6,
  title: blockTitles[BLOCKS.HEADING_6]
})(Heading6);
