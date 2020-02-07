import React, { useState } from 'react';
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

import { orgRoles } from 'utils/MembershipUtils';

const styles = {
  optionWrapper: css({
    width: 300,
    whiteSpace: 'normal'
  })
};

export function OrganizationRoleSelector({ initialRole, onChange, disableOwnerRole, className }) {
  const [isOpen, setOpen] = useState(false);

  const getOrgRole = () => {
    return orgRoles.find(role => role.value === initialRole);
  };

  const selectRole = role => {
    onChange(role.value);
    setOpen(false);
  };

  const toggle = () => {
    setOpen(!isOpen);
  };

  const renderOption = role => {
    const disabled = role.id === 'owner' && disableOwnerRole;
    return (
      <DropdownListItem
        key={role.value}
        testId="org-role-selector.item"
        onClick={() => selectRole(role)}
        isDisabled={disabled}>
        <div className={styles.optionWrapper}>
          <SectionHeading element="h4">{role.name}</SectionHeading>
          <Paragraph>{role.description}</Paragraph>
        </div>
      </DropdownListItem>
    );
  };

  return (
    <Dropdown
      onClose={toggle}
      toggleElement={
        <Button
          buttonType="muted"
          size="small"
          indicateDropdown
          onClick={toggle}
          testId="org-role-selector.button">
          {getOrgRole().name}
        </Button>
      }
      isOpen={isOpen}
      className={className}>
      <DropdownList>{orgRoles.map(role => renderOption(role))}</DropdownList>
    </Dropdown>
  );
}

OrganizationRoleSelector.propTypes = {
  initialRole: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  disableOwnerRole: PropTypes.bool,
  className: PropTypes.string
};
