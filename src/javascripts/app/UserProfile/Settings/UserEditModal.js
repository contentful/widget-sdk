import React, { useReducer } from 'react';
import PropTypes from 'prop-types';
import {
  Modal,
  Button,
  TextField,
  Form,
  CheckboxField,
  Subheading
} from '@contentful/forma-36-react-components';
import _ from 'lodash';
import tokens from '@contentful/forma-36-tokens';
import { createImmerReducer } from 'redux/utils/createImmerReducer.es6';
import { updateUserData } from './AccountService.es6';
import { User as UserPropType } from './propTypes';
import { getValidationMessageFor } from './utils';
import { css } from 'emotion';

const styles = {
  controlsPanel: css({ display: 'flex' }),
  marginLeftM: css({ marginLeft: tokens.spacingM })
};

const createFieldData = (initialValue = null) => ({
  dirty: false,
  value: initialValue,
  serverValidationMessage: null
});

const initializeReducer = user => {
  return {
    fields: {
      firstName: createFieldData(user.firstName),
      lastName: createFieldData(user.lastName),
      email: createFieldData(user.email),
      currentPassword: createFieldData(),
      newPassword: createFieldData(),
      newPasswordConfirm: createFieldData(),
      logAnalyticsFeature: createFieldData(user.logAnalyticsFeature)
    },
    formInvalid: false
  };
};

const reducer = createImmerReducer({
  UPDATE_FIELD_VALUE: (state, { payload }) => {
    state.fields[payload.field].value = payload.value;
    state.fields[payload.field].dirty = true;
    state.formInvalid = false;
    state.fields[payload.field].serverValidationMessage = null;
  },
  SET_ALL_FIELDS_DIRTY: state => {
    Object.values(state.fields).forEach(fieldData => {
      fieldData.dirty = true;
    });
  },
  SET_FORM_INVALID: state => {
    state.formInvalid = true;
  },
  SERVER_VALIDATION_FAILURE: (state, { payload }) => {
    state.fields[payload.field].serverValidationMessage = payload.value;
  },
  RESET: (_, { payload }) => {
    return initializeReducer(payload.user);
  }
});

const submitForm = async (formData, user, dispatch, onConfirm) => {
  const fieldData = formData.fields;

  const updatedUserData = await updateUserData({
    version: user.sys.version,
    data: {
      firstName: fieldData.firstName.value,
      lastName: fieldData.lastName.value,
      email: fieldData.email.value,
      password: fieldData.newPassword.value,
      currentPassword: fieldData.currentPassword.value,
      logAnalyticsFeature: fieldData.logAnalyticsFeature.value
    }
  });

  if (updatedUserData.sys.type === 'User') {
    dispatch({ type: 'RESET', payload: { user: updatedUserData } });
    onConfirm(updatedUserData);
  } else if (updatedUserData.sys.type === 'Error') {
    const errorDetails = updatedUserData.details.errors;

    errorDetails.forEach(({ path, name }) => {
      const pathFieldMapping = {
        password: 'newPassword',
        current_password: 'currentPassword',
        email: 'email'
      };
      let message;

      if (path === 'password') {
        if (name === 'insecure') {
          message = 'The password you entered is not secure';
        }
      } else if (path === 'current_password') {
        if (name === 'invalid') {
          message = 'The password you entered is not valid';
        }
      } else if (path === 'email') {
        if (name === 'invalid') {
          message = 'The email you entered is not valid';
        }
      }

      if (message) {
        dispatch({
          type: 'SERVER_VALIDATION_FAILURE',
          payload: { field: pathFieldMapping[path], value: message }
        });
      }
    });
  }
};

export default function UserEditModal({ user, onConfirm, onCancel, isShown }) {
  const [formData, dispatch] = useReducer(reducer, user, initializeReducer);

  const validateForm = () => {
    const formIsInvalid = Boolean(
      Object.keys(formData.fields).find(fieldName =>
        getValidationMessageFor(formData.fields, fieldName)
      )
    );

    if (formIsInvalid) {
      dispatch({ type: 'SET_FORM_INVALID' });

      return false;
    }

    return true;
  };

  const fields = formData.fields;
  const currentPasswordIsRequired = fields.email.value && fields.email.dirty;

  return (
    <Modal
      title="Edit account"
      shouldCloseOnEscapePress={true}
      shouldCloseOnOverlayClick={true}
      isShown={isShown}
      onClose={() => {
        dispatch({ type: 'RESET', payload: { user } });
        onCancel();
      }}
      size="large">
      <Form>
        <TextField
          required
          validationMessage={getValidationMessageFor(formData.fields, 'firstName')}
          id="first-name-field"
          name="first-name"
          value={fields.firstName.value}
          onChange={e =>
            dispatch({
              type: 'UPDATE_FIELD_VALUE',
              payload: { field: 'firstName', value: e.target.value }
            })
          }
          labelText="First Name"
          textInputProps={{ type: 'text', autoComplete: 'off' }}
        />
        <TextField
          required
          validationMessage={getValidationMessageFor(formData.fields, 'lastName')}
          id="last-name-field"
          name="last-name"
          value={fields.lastName.value}
          onChange={e =>
            dispatch({
              type: 'UPDATE_FIELD_VALUE',
              payload: { field: 'lastName', value: e.target.value }
            })
          }
          labelText="Last Name"
          textInputProps={{ type: 'text', autoComplete: 'off' }}
        />
        <TextField
          required
          id="email-field"
          name="email"
          value={fields.email.value}
          onChange={e =>
            dispatch({
              type: 'UPDATE_FIELD_VALUE',
              payload: { field: 'email', value: e.target.value }
            })
          }
          labelText="Email"
          textInputProps={{ type: 'email', autoComplete: 'off' }}
          helpText="To confirm email changes enter your current newPassword and don’t forget to confirm the new email, you will find a confirmation link in your inbox soon."
        />
        <Subheading>Change Password</Subheading>
        <TextField
          validationMessage={getValidationMessageFor(formData.fields, 'newPassword')}
          id="new-password-field"
          name="new-password"
          value={fields.newPassword.value}
          onChange={e =>
            dispatch({
              type: 'UPDATE_FIELD_VALUE',
              payload: { field: 'newPassword', value: e.target.value }
            })
          }
          labelText="New Password"
          textInputProps={{ type: 'password', autoComplete: 'off' }}
          helpText="Create a unique password at least 8 characters long"
        />
        <TextField
          validationMessage={getValidationMessageFor(formData.fields, 'newPasswordConfirm')}
          id="confirm-new-password-field"
          name="confirm-new-password"
          value={fields.newPasswordConfirm.value}
          onChange={e =>
            dispatch({
              type: 'UPDATE_FIELD_VALUE',
              payload: { field: 'newPasswordConfirm', value: e.target.value }
            })
          }
          labelText="Confirm new password"
          textInputProps={{ type: 'password', autoComplete: 'off' }}
        />
        {currentPasswordIsRequired && (
          <>
            <Subheading>Confirm changes</Subheading>
            <TextField
              required
              validationMessage={getValidationMessageFor(formData.fields, 'currentPassword')}
              id="current-password-field"
              name="current-password"
              value={fields.currentPassword.value}
              onChange={e =>
                dispatch({
                  type: 'UPDATE_FIELD_VALUE',
                  payload: { field: 'currentPassword', value: e.target.value }
                })
              }
              labelText="Current Password"
              textInputProps={{ type: 'password', autoComplete: 'off' }}
            />
          </>
        )}
        <CheckboxField
          labelText="Allow Contentful to send information to external providers to help us improve the service"
          value={fields.logAnalyticsFeature.value ? 'yes' : 'no'}
          onChange={() =>
            dispatch({
              type: 'UPDATE_FIELD_VALUE',
              payload: { field: 'logAnalyticsFeature', value: !fields.logAnalyticsFeature.value }
            })
          }
          checked={fields.logAnalyticsFeature.value === true}
          id="termsCheckboxYes"
        />
        <div className={styles.controlsPanel}>
          <Button
            onClick={() => {
              const formIsValid = validateForm(formData);
              formIsValid && submitForm(formData, user, dispatch, onConfirm);
            }}
            type="submit"
            buttonType="positive">
            Save changes
          </Button>
          <Button
            className={styles.marginLeftM}
            onClick={() => {
              dispatch({ type: 'RESET', payload: { user } });
              onCancel();
            }}
            buttonType="muted">
            Cancel
          </Button>
        </div>
      </Form>
    </Modal>
  );
}

UserEditModal.propTypes = {
  isShown: PropTypes.bool.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  user: UserPropType.isRequired
};
