import React, { Component } from 'react';
import ToolbarDropdownListItem from '../shared/ToolbarDropdownListItem.es6';
import { BLOCKS } from '@contentful/rich-text-types';
import blockSelectDecorator from '../shared/BlockSelectDecorator.es6';
import { blockTitles } from './HeadingDropdown.es6';

class Heading3 extends Component {
  render() {
    return (
      <ToolbarDropdownListItem {...this.props} data-test-id={BLOCKS.HEADING_3}>
        Heading 3
      </ToolbarDropdownListItem>
    );
  }
}

export default blockSelectDecorator({
  type: BLOCKS.HEADING_3,
  title: blockTitles[BLOCKS.HEADING_3]
})(Heading3);
