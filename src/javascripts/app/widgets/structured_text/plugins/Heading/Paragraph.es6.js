import React, { Component } from 'react';
import ToolbarDropdownListItem from '../shared/ToolbarDropdownListItem';
import { BLOCKS } from '@contentful/structured-text-types';
import blockDecorator from '../shared/BlockSelectDecorator';
import { blockTitles } from './HeadingDropdown';

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
