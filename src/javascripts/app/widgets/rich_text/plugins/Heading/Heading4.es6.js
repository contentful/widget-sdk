import React, { Component } from 'react';
import ToolbarDropdownListItem from '../shared/ToolbarDropdownListItem.es6';
import { BLOCKS } from '@contentful/rich-text-types';
import blockSelectDecorator from '../shared/BlockSelectDecorator.es6';
import { blockTitles } from './HeadingDropdown.es6';

class Heading4 extends Component {
  render() {
    return (
      <ToolbarDropdownListItem {...this.props} data-test-id={BLOCKS.HEADING_4}>
        Heading 4
      </ToolbarDropdownListItem>
    );
  }
}

export default blockSelectDecorator({
  type: BLOCKS.HEADING_4,
  title: blockTitles[BLOCKS.HEADING_4]
})(Heading4);
