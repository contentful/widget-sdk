import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { BLOCKS } from '@contentful/structured-text-types';
import { Dropdown, DropdownList, Button } from '@contentful/ui-component-library';
import { haveBlocks } from '../shared/UtilHave';

export const blockTitles = {
  [BLOCKS.HEADING_1]: 'Heading 1',
  [BLOCKS.HEADING_2]: 'Heading 2',
  [BLOCKS.HEADING_3]: 'Heading 3',
  [BLOCKS.HEADING_4]: 'Heading 4',
  [BLOCKS.HEADING_5]: 'Heading 5',
  [BLOCKS.HEADING_6]: 'Heading 6',
  [BLOCKS.PARAGRAPH]: 'Normal Text',
  [BLOCKS.EMBEDDED_ENTRY]: 'Embedded Entry'
};

class HeadingDropdown extends Component {
  static propTypes = {
    children: PropTypes.node.isRequired,
    isOpen: PropTypes.bool,
    disabled: PropTypes.bool,
    onClose: PropTypes.func,
    onToggle: PropTypes.func,
    change: PropTypes.object
  };

  getStyleNameForChange = () => {
    const currentStyle = Object.keys(blockTitles).find(key => haveBlocks(this.props.change, key));

    return blockTitles[currentStyle] || blockTitles[blockTitles.PARAGRAPH];
  };

  render() {
    const { onToggle, isOpen, onClose, children } = this.props;
    return (
      <Dropdown
        toggleElement={
          <Button
            onMouseDown={onToggle}
            data-test-id="toolbar-heading-toggle"
            extraClassNames="toolbar-heading-toggle"
            indicateDropdown
            buttonType="naked"
            size="small"
            disabled={this.props.disabled}>
            {this.getStyleNameForChange()}
          </Button>
        }
        isOpen={isOpen}
        onClose={onClose}>
        <DropdownList extraClassNames="toolbar-heading-dropdown-list">{children}</DropdownList>
      </Dropdown>
    );
  }
}

export default HeadingDropdown;
