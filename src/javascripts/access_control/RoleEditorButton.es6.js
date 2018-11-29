import React from 'react';
import { update, negate, identity } from 'lodash/fp';
import PropTypes from 'prop-types';
import {
  IconButton,
  Dropdown,
  DropdownList,
  DropdownListItem,
  Button
} from '@contentful/forma-36-react-components';

export default class RoleEditorButton extends React.Component {
  static propTypes = {
    onSave: PropTypes.func.isRequired,
    onDuplicate: PropTypes.func.isRequired,
    onDelete: PropTypes.func,
    disabled: PropTypes.bool.isRequired,
    loading: PropTypes.bool.isRequired,
    showDropdown: PropTypes.bool
  };

  state = {
    isOpen: false,
    showDropdown: false
  };

  closeAnd = onClick => event => {
    onClick(event);
    this.setState({ isOpen: false });
  };

  render() {
    const { onSave, onDuplicate, onDelete, disabled, loading, showDropdown } = this.props;

    return (
      <div className="btn-action-select">
        <Button
          extraClassNames="btn-action-select__action"
          testId="save-button"
          disabled={disabled}
          loading={loading}
          onClick={onSave}>
          Save changes
        </Button>
        {showDropdown && (
          <Dropdown
            toggleElement={
              <IconButton
                label="additional-actions"
                data-test-id="additional-role-editor"
                extraClassNames="btn-action-select__selector"
                buttonType="white"
                iconProps={{ icon: 'ChevronDown', color: 'white' }}
                onClick={() => this.setState(update('isOpen', negate(identity)))}
              />
            }
            onClose={() => this.setState({ isOpen: false })}
            isOpen={this.state.isOpen}
            position="bottom-left">
            <DropdownList>
              <DropdownListItem onClick={this.closeAnd(onDuplicate)}>Duplicate</DropdownListItem>
              {onDelete && (
                <DropdownListItem onClick={this.closeAnd(onDelete)}>
                  Delete permanently
                </DropdownListItem>
              )}
            </DropdownList>
          </Dropdown>
        )}
      </div>
    );
  }
}
