import React, { Component } from 'react';
import ToolbarDropdownListItem from '../shared/ToolbarDropdownListItem.es6';
import { BLOCKS } from '@contentful/rich-text-types';
import blockDecorator from '../shared/BlockSelectDecorator.es6';
import { blockTitles } from './HeadingDropdown.es6';

class Paragraph extends Component {
  render() {
    return (
      <ToolbarDropdownListItem {...this.props}>
        {blockTitles[BLOCKS.PARAGRAPH]}
      </ToolbarDropdownListItem>
    );
  }
}

export default blockDecorator({
  type: BLOCKS.PARAGRAPH,
  title: blockTitles[BLOCKS.PARAGRAPH],
  shouldToggle: false
})(Paragraph);
