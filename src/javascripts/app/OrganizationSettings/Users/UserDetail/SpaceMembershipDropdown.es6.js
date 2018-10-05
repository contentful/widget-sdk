import React from 'react';
import PropTypes from 'prop-types';

import {
  IconButton,
  Dropdown,
  DropdownList,
  DropdownListItem
} from '@contentful/ui-component-library';
import { SpaceMembership } from '../PropTypes.es6';

export default class UserDropdown extends React.Component {
  static propTypes = {
    onMembershipRemove: PropTypes.func.isRequired,
    onMembershipChange: PropTypes.func.isRequired,
    membership: SpaceMembership.isRequired
  };

  state = {
    isOpen: false
  };

  removeMembership(evt) {
    evt.stopPropagation();
    this.toggleDropdown();
    this.props.onMembershipRemove(this.props.membership);
  }

  changeMembership(evt) {
    evt.stopPropagation();
    this.toggleDropdown();
    this.props.onMembershipChange(this.props.membership);
  }

  toggleDropdown(evt) {
    evt && evt.stopPropagation();
    this.setState({ isOpen: !this.state.isOpen });
  }

  render() {
    return (
      <Dropdown
        position="bottom-right"
        isOpen={this.state.isOpen}
        toggleElement={
          <IconButton
            iconProps={{
              icon: 'MoreHorizontal'
            }}
            onClick={this.toggleDropdown.bind(this)}
          />
        }>
        <DropdownList>
          <DropdownListItem onClick={this.changeMembership.bind(this)}>
            Change role
          </DropdownListItem>
        </DropdownList>
        <DropdownList border="top">
          <DropdownListItem onClick={this.removeMembership.bind(this)}>
            Remove membership
          </DropdownListItem>
        </DropdownList>
      </Dropdown>
    );
  }
}
