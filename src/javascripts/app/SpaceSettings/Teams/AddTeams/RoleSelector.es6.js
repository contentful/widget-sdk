import React, { useReducer } from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import { FieldGroup, RadioButtonField, CheckboxField } from '@contentful/forma-36-react-components';

import { createImmerReducer } from 'redux/utils/createImmerReducer.es6';

const classes = {
  container: css({
    flexBasis: '40%'
  }),
  list: css({
    marginLeft: '20px',
    wordBreak: 'break-word'
  })
};

const roleSelectorReducer = createImmerReducer({
  SELECT_ADMIN: (state, action) => {
    if (action.payload === true) {
      state.selectedRoleIds = [];
    }

    state.adminRoleSelected = action.payload;
  },
  SELECT_ROLE: (state, action) => {
    if (action.payload.isSelected) {
      state.selectedRoleIds.push(action.payload.id);
    } else {
      state.selectedRoleIds = state.selectedRoleIds.filter(id => id !== action.payload.id);
    }
  }
});

export default function RoleSelector({ roles, onRoleSelected, onAdminSelected, disabled }) {
  const [state, dispatch] = useReducer(roleSelectorReducer, {
    adminRoleSelected: true,
    selectedRoleIds: []
  });

  const { adminRoleSelected, selectedRoleIds } = state;

  return (
    <FieldGroup>
      <RadioButtonField
        labelIsLight
        labelText="Admin"
        helpText="Manages everything in the space"
        name="admin"
        id="admin_true"
        value={true}
        checked={adminRoleSelected === true}
        disabled={disabled}
        onChange={() => {
          dispatch({ type: 'SELECT_ADMIN', payload: true });
          onAdminSelected(true);
        }}
      />
      {roles.length > 0 && (
        <>
          <RadioButtonField
            labelIsLight
            labelText="Non-admin"
            name="admin"
            id="admin_false"
            value={false}
            checked={adminRoleSelected === false}
            disabled={disabled}
            onChange={() => {
              dispatch({ type: 'SELECT_ADMIN', payload: false });
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
                  disabled={adminRoleSelected === true || disabled}
                  onChange={e => {
                    const isChecked = e.target.checked;

                    dispatch({
                      type: 'SELECT_ROLE',
                      payload: { id: role.sys.id, isSelected: isChecked }
                    });
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
  disabled: PropTypes.bool
};
