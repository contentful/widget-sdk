import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import {
  Button,
  Dropdown,
  DropdownList,
  DropdownListItem,
  Paragraph,
  SectionHeading
} from '@contentful/forma-36-react-components';
import { keyBy } from 'lodash';

import { orgRoles } from 'utils/MembershipUtils.es6';

const styles = {
  optionWrapper: css({
    width: 300,
    whiteSpace: 'normal'
  })
};

export class OrganizationRoleSelector extends React.Component {
  static propTypes = {
    initialRole: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    isSelf: PropTypes.bool,
    disableOwnerRole: PropTypes.bool,
    className: PropTypes.string
  };

  state = {
    isOpen: false
  };

  getOrgRole() {
    return orgRoles.find(role => role.value === this.props.initialRole);
  }

  selectRole(role) {
    this.props.onChange(role.value);
    this.toggle();
  }

  toggle = () => {
    this.setState({ isOpen: !this.state.isOpen });
  };

  renderToggle() {
    return (
      <Button buttonType="muted" size="small" indicateDropdown onClick={() => this.toggle()}>
        {this.getOrgRole().name}
      </Button>
    );
  }

  renderOption(role, disabled) {
    return (
      <DropdownListItem
        key={role.value}
        onClick={() => this.selectRole(role)}
        isDisabled={disabled}>
        <div className={styles.optionWrapper}>
          <SectionHeading element="h4">{role.name}</SectionHeading>
          <Paragraph>{role.description}</Paragraph>
        </div>
      </DropdownListItem>
    );
  }

  render() {
    const roles = keyBy(orgRoles, 'value');
    const { className } = this.props;

    return (
      <Dropdown
        onClose={this.toggle}
        toggleElement={this.renderToggle()}
        isOpen={this.state.isOpen}
        className={className}>
        <DropdownList>
          {this.renderOption(roles.owner, this.props.disableOwnerRole)}
          {this.renderOption(roles.admin)}
          {this.renderOption(roles.member)}
        </DropdownList>
      </Dropdown>
    );
  }
}
