import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { BLOCKS } from '@contentful/structured-text-types';
import {
  Dropdown,
  DropdownList,
  EditorToolbarButton
} from '@contentful/ui-component-library';
import { haveBlocks } from '../shared/UtilHave';

class HeadingDropdown extends Component {
  static propTypes = {
    children: PropTypes.node.isRequired,
    isOpen: PropTypes.bool,
    disabled: PropTypes.bool,
    onClose: PropTypes.func,
    onToggle: PropTypes.func,
    change: PropTypes.object
  };

  activeOnHeadingBlocks = () =>
    haveBlocks(this.props.change, BLOCKS.HEADING_1) ||
    haveBlocks(this.props.change, BLOCKS.HEADING_2);

  render () {
    const { onToggle, isOpen, onClose, children } = this.props;
    return (
      <Dropdown
        toggleElement={
          <EditorToolbarButton
            onMouseDown={onToggle}
            data-test-id="toolbar-heading-toggle"
            withDropdown
            icon="Heading"
            label="Heading"
            isActive={this.activeOnHeadingBlocks()}
            disabled={this.props.disabled}
          />
        }
        isOpen={isOpen}
        onClose={onClose}
      >
        <DropdownList>{children}</DropdownList>
      </Dropdown>
    );
  }
}

export default HeadingDropdown;
