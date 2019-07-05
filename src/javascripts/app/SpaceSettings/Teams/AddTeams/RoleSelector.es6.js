import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import { FieldGroup, RadioButtonField, CheckboxField } from '@contentful/forma-36-react-components';

const classes = {
  container: css({
    flexBasis: '40%'
  }),
  list: css({
    marginLeft: '20px',
    wordBreak: 'break-word'
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
    <FieldGroup>
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
            name="admin"
            id="admin_false"
            value="false"
            testId="RoleSelector.admin_false"
            checked={adminSelected === false}
            disabled={disabled}
            onChange={() => {
              onAdminSelected(false);
            }}
          />
          <div className={classes.list}>
            {roles.map(role => (
              <div key={role.sys.id}>
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
    </FieldGroup>
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
