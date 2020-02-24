import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import { RadioButtonField, CheckboxField } from '@contentful/forma-36-react-components';
import * as tokens from '@contentful/forma-36-tokens';

const styles = {
  container: css({
    flexBasis: '40%'
  }),
  list: css({
    marginLeft: '20px',
    wordBreak: 'break-word'
  }),
  otherRoles: css({
    marginTop: tokens.spacingM
  }),
  role: css({
    marginTop: tokens.spacingS
  })
};

export default function RoleSelector({
  roles,
  selectedRoleIds,
  onRoleSelected,
  adminSelected,
  onAdminSelected,
  disabled
}) {
  return (
    <>
      <RadioButtonField
        labelIsLight
        labelText="Admin"
        helpText="Manages everything in the space"
        name="admin"
        id="admin_true"
        value="true"
        testId="RoleSelector.admin_true"
        checked={adminSelected}
        disabled={disabled}
        onChange={() => {
          onAdminSelected(true);
        }}
      />
      {roles.length > 0 && (
        <>
          <RadioButtonField
            labelIsLight
            labelText="Other roles"
            name="other_roles"
            id="admin_false"
            value="false"
            className={styles.otherRoles}
            testId="RoleSelector.admin_false"
            checked={adminSelected === false}
            disabled={disabled}
            onChange={() => {
              onAdminSelected(false);
            }}
          />
          <div className={styles.list}>
            {roles.map(role => (
              <div key={role.sys.id} className={styles.role}>
                <CheckboxField
                  labelIsLight
                  id={role.sys.id}
                  labelText={role.name}
                  checked={Boolean(selectedRoleIds.find(id => role.sys.id === id))}
                  disabled={adminSelected || disabled}
                  onChange={e => {
                    const isChecked = e.target.checked;

                    onRoleSelected(role.sys.id, isChecked);
                  }}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}

RoleSelector.propTypes = {
  roles: PropTypes.array.isRequired,
  onRoleSelected: PropTypes.func.isRequired,
  onAdminSelected: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  adminSelected: PropTypes.bool,
  selectedRoleIds: PropTypes.array.isRequired
};
