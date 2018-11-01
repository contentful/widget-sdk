import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Dropdown, DropdownList, Button } from '@contentful/ui-component-library';

class EntryEmbedDropdown extends Component {
  static propTypes = {
    children: PropTypes.node.isRequired,
    isOpen: PropTypes.bool,
    disabled: PropTypes.bool,
    onClose: PropTypes.func,
    onToggle: PropTypes.func,
    change: PropTypes.object
  };

  render() {
    const { onToggle, isOpen, onClose, children } = this.props;
    return (
      <Dropdown
        extraClassNames="toolbar-entry-dropdown"
        position="bottom-right"
        toggleElement={
          <Button
            onMouseDown={onToggle}
            data-test-id="toolbar-entry-dropdown-toggle"
            extraClassNames="toolbar-entry-dropdown-toggle"
            indicateDropdown
            buttonType="muted"
            size="small"
            icon="Plus"
            disabled={this.props.disabled}>
            Embed
          </Button>
        }
        isOpen={isOpen}
        onClose={onClose}>
        <DropdownList extraClassNames="toolbar-entry-dropdown-list">{children}</DropdownList>
      </Dropdown>
    );
  }
}

export default EntryEmbedDropdown;
