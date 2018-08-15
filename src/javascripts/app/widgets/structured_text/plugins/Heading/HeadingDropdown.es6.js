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
    onToggle: PropTypes.func,
    isOpen: PropTypes.bool,
    onClose: PropTypes.func,
    onChange: PropTypes.object
  };

  activeOnHeadingBlocks = () =>
    haveBlocks(this.props.onChange, BLOCKS.HEADING_1) ||
    haveBlocks(this.props.onChange, BLOCKS.HEADING_2);

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
