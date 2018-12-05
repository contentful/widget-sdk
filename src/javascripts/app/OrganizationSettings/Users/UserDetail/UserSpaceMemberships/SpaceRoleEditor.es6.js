import React from 'react';
import PropTypes from 'prop-types';
import { SpaceRole as SpaceRoleProp } from 'app/OrganizationSettings/Users/PropTypes.es6';
import {
  Button,
  CheckboxField,
  Dropdown,
  DropdownList,
  DropdownListItem
} from '@contentful/forma-36-react-components';
import { without } from 'lodash';

const ServicesConsumer = require('../../../../../reactServiceContext').default;

class SpaceRoleEditor extends React.Component {
  static propTypes = {
    $services: PropTypes.shape({
      SpaceMembershipRepository: PropTypes.object.isRequired
    }),
    onChange: PropTypes.func.isRequired,
    isDisabled: PropTypes.bool,
    options: PropTypes.arrayOf(SpaceRoleProp),
    value: PropTypes.array
  };

  static defaultProps = {
    options: [],
    value: []
  };

  state = {
    isOpen: false
  };

  setAdmin = () => {
    const { ADMIN_ROLE_ID } = this.props.$services.SpaceMembershipRepository;

    this.props.onChange([ADMIN_ROLE_ID]);
  };

  setRole = roleId => ({ target: { checked } }) => {
    const { ADMIN_ROLE_ID } = this.props.$services.SpaceMembershipRepository;
    const isAdmin = roleId === ADMIN_ROLE_ID;

    if (checked) {
      isAdmin ? this.setAdmin() : this.addRole(roleId);
    } else {
      this.removeRole(roleId);
    }
  };

  addRole(roleId) {
    const { ADMIN_ROLE_ID } = this.props.$services.SpaceMembershipRepository;
    const { value, onChange } = this.props;
    onChange(without(value, ADMIN_ROLE_ID).concat(roleId));
  }

  removeRole(roleId) {
    const { value, onChange } = this.props;
    onChange(value.filter(id => id !== roleId));
  }

  closeDropdown = () => {
    this.setState({ isOpen: false });
  };

  toggleDropdown = () => {
    this.setState({ isOpen: !this.state.isOpen });
  };

  render() {
    const { options, value, isDisabled, $services } = this.props;
    const { ADMIN_ROLE_ID, ADMIN_ROLE } = $services.SpaceMembershipRepository;
    const isAdmin = value.includes(ADMIN_ROLE_ID);

    const selectedNames = [ADMIN_ROLE, ...options]
      .filter(option => value.includes(option.sys.id))
      .map(role => role.name)
      .join(', ');

    return (
      <Dropdown
        isOpen={this.state.isOpen}
        onClose={this.closeDropdown}
        style={{ maxWidth: '100%' }}
        toggleElement={
          <Button
            disabled={isDisabled}
            extraClassNames="select-button"
            buttonType="naked"
            indicateDropdown
            onClick={this.toggleDropdown}>
            {selectedNames || 'Select a role'}
          </Button>
        }>
        <DropdownList maxHeight={300}>
          <DropdownListItem>
            <CheckboxField
              labelIsLight
              labelText={ADMIN_ROLE.name}
              checked={isAdmin}
              onChange={this.setRole(ADMIN_ROLE_ID)}
              id={ADMIN_ROLE_ID}
            />
          </DropdownListItem>
          {options.map(option => (
            <DropdownListItem key={option.sys.id}>
              <CheckboxField
                labelIsLight
                labelText={option.name}
                checked={value.includes(option.sys.id)}
                value={option.sys.id}
                onChange={this.setRole(option.sys.id)}
                id={option.sys.id}
              />
            </DropdownListItem>
          ))}
        </DropdownList>
      </Dropdown>
    );
  }
}

export default ServicesConsumer({
  as: 'SpaceMembershipRepository',
  from: 'access_control/SpaceMembershipRepository.es6'
})(SpaceRoleEditor);
