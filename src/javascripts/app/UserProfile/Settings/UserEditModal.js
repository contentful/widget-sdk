import React, { useReducer } from 'react';
import PropTypes from 'prop-types';
import {
  Modal,
  Button,
  TextField,
  Form,
  CheckboxField,
  Subheading,
  Notification
} from '@contentful/forma-36-react-components';
import _ from 'lodash';
import tokens from '@contentful/forma-36-tokens';
import { createImmerReducer } from 'redux/utils/createImmerReducer.es6';
import { updateUserData } from './AccountService';
import { User as UserPropType } from './propTypes';
import { getValidationMessageFor } from './utils';
import { css } from 'emotion';

const styles = {
  controlsPanel: css({ display: 'flex' }),
  marginLeftM: css({ marginLeft: tokens.spacingM })
};

const createFieldData = (initialValue = '') => ({
  touched: false,
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
    formInvalid: false,
    submitting: false
  };
};

const reducer = createImmerReducer({
  UPDATE_FIELD_VALUE: (state, { payload }) => {
    state.fields[payload.field].value = payload.value;
    state.fields[payload.field].dirty = true;
    state.formInvalid = false;
    state.fields[payload.field].serverValidationMessage = null;
  },
  SET_FIELD_TOUCHED: (state, { payload }) => {
    state.fields[payload.field].touched = true;
  },
  SET_ALL_FIELDS_TOUCHED: state => {
    Object.values(state.fields).forEach(fieldData => {
      fieldData.touched = true;
    });
  },
  SET_SUBMITTING: (state, { payload }) => {
    state.submitting = payload;
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
  dispatch({ type: 'SET_SUBMITTING', payload: true });

  const fieldData = formData.fields;
  let response;

  try {
    response = await updateUserData({
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
  } catch (err) {
    const { data } = err;

    if (data.sys && data.sys.type === 'Error') {
      const errorDetails = data.details.errors;

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
    } else {
      Notification.error('Something went wrong. Try again.');
    }

    dispatch({ type: 'SET_SUBMITTING', payload: false });

    return;
  }

  dispatch({ type: 'RESET', payload: { user: response } });
  onConfirm(response);
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
  const currentPasswordIsRequired =
    (user.passwordSet && fields.email.dirty) ||
    fields.newPassword.dirty ||
    fields.newPasswordConfirm.dirty;
  const userHasPassword = user.passwordSet;
  const submitButtonDisabled =
    !Object.values(formData.fields).find(field => field.dirty) ||
    formData.formInvalid ||
    formData.submitting;

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
          onBlur={() => dispatch({ type: 'SET_FIELD_TOUCHED', payload: { field: 'firstName' } })}
          labelText="First Name"
          textInputProps={{
            type: 'text',
            autoComplete: 'off',
            placeholder: 'Felix'
          }}
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
          onBlur={() => dispatch({ type: 'SET_FIELD_TOUCHED', payload: { field: 'lastName' } })}
          labelText="Last Name"
          textInputProps={{
            type: 'text',
            autoComplete: 'off',
            placeholder: 'Müller'
          }}
        />
        <TextField
          required
          validationMessage={getValidationMessageFor(formData.fields, 'email')}
          id="email-field"
          name="email"
          value={fields.email.value}
          onChange={e =>
            dispatch({
              type: 'UPDATE_FIELD_VALUE',
              payload: { field: 'email', value: e.target.value }
            })
          }
          onBlur={() => dispatch({ type: 'SET_FIELD_TOUCHED', payload: { field: 'email' } })}
          labelText="Email"
          textInputProps={{
            type: 'email',
            autoComplete: 'off',
            placeholder: 'felix.mueller@example.com'
          }}
          helpText={
            userHasPassword && fields.email.dirty
              ? 'Enter your password to confirm your updated email.'
              : ''
          }
        />
        {userHasPassword && (
          <>
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
              onBlur={() =>
                dispatch({ type: 'SET_FIELD_TOUCHED', payload: { field: 'newPassword' } })
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
              onBlur={() =>
                dispatch({ type: 'SET_FIELD_TOUCHED', payload: { field: 'newPasswordConfirm' } })
              }
              labelText="Confirm new password"
              textInputProps={{ type: 'password', autoComplete: 'off' }}
            />
          </>
        )}
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
              onBlur={() =>
                dispatch({ type: 'SET_FIELD_TOUCHED', payload: { field: 'currentPassword' } })
              }
              labelText="Current Password"
              textInputProps={{ type: 'password', autoComplete: 'off' }}
            />
          </>
        )}
        <CheckboxField
          labelText="Allow Contentful to send information to external providers to help us improve the service"
          labelIsLight
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
            disabled={submitButtonDisabled}
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
