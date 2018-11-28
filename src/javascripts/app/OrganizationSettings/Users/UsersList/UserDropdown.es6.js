import React from 'react';
import PropTypes from 'prop-types';

import {
  Button,
  Dropdown,
  DropdownList,
  DropdownListItem
} from '@contentful/forma-36-react-components';

export default class UserDropdown extends React.Component {
  static propTypes = {
    onMembershipRemove: PropTypes.func.isRequired,
    membership: PropTypes.shape({
      user: PropTypes.object,
      sys: PropTypes.shape({
        id: PropTypes.string
      })
    }).isRequired
  };

  state = {
    isOpen: false
  };

  removeMembership(evt) {
    evt.stopPropagation();
    this.toggleDropdown();
    this.props.onMembershipRemove();
  }

  toggleDropdown(evt) {
    evt && evt.stopPropagation();
    this.setState({ isOpen: !this.state.isOpen });
  }

  render() {
    const user = this.props.membership.user;

    return (
      <Dropdown
        position="bottom-right"
        isOpen={this.state.isOpen}
        toggleElement={
          <Button
            size="small"
            buttonType="naked"
            icon="MoreHorizontal"
            onClick={this.toggleDropdown.bind(this)}
          />
        }>
        <DropdownList>
          <DropdownListItem onClick={this.removeMembership.bind(this)}>
            {user.firstName
              ? `Remove ${user.firstName} from the organization`
              : `Remove membership`}
          </DropdownListItem>
        </DropdownList>
      </Dropdown>
    );
  }
}
