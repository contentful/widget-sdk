import React, { Component } from 'react';
import ToolbarDropdownListItem from '../shared/ToolbarDropdownListItem.es6';
import { BLOCKS } from '@contentful/rich-text-types';
import blockSelectDecorator from '../shared/BlockSelectDecorator.es6';
import { blockTitles } from './HeadingDropdown.es6';

class Heading1 extends Component {
  render() {
    return (
      <ToolbarDropdownListItem {...this.props} data-test-id={BLOCKS.HEADING_1}>
        Heading 1
      </ToolbarDropdownListItem>
    );
  }
}

export default blockSelectDecorator({
  type: BLOCKS.HEADING_1,
  title: blockTitles[BLOCKS.HEADING_1]
})(Heading1);
