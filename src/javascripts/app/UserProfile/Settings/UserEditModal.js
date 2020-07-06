import React, { useReducer } from 'react';
import PropTypes from 'prop-types';
import {
  Modal,
  Button,
  TextField,
  Form,
  CheckboxField,
  Subheading,
  Notification,
} from '@contentful/forma-36-react-components';
import _ from 'lodash';
import tokens from '@contentful/forma-36-tokens';
import { createImmerReducer } from 'core/utils/createImmerReducer';
import { updateUserData } from './AccountRepository';
import { User as UserPropType } from './propTypes';
import { getValidationMessageFor } from './utils';
import { css } from 'emotion';

const styles = {
  controlsPanel: css({ display: 'flex' }),
  marginLeftM: css({ marginLeft: tokens.spacingM }),
};

const createFieldData = (initialValue = '') => ({
  blurred: false,
  interacted: false,
  value: initialValue,
  serverValidationMessage: null,
});

const initializeReducer = (user) => {
  const fields = {
    firstName: createFieldData(user.firstName),
    lastName: createFieldData(user.lastName),
    email: createFieldData(user.email),
    currentPassword: createFieldData(),
    logAnalyticsFeature: createFieldData(user.logAnalyticsFeature),
  };

  return {
    fields,
    formInvalid: false,
    submitting: false,
  };
};

const reducer = createImmerReducer({
  UPDATE_FIELD_VALUE: (state, { payload }) => {
    state.fields[payload.field].value = payload.value;
    state.fields[payload.field].interacted = true;
    state.formInvalid = false;
    state.fields[payload.field].serverValidationMessage = null;
  },
  SET_FIELD_BLURRED: (state, { payload }) => {
    state.fields[payload.field].blurred = true;
  },
  SET_ALL_FIELDS_BLURRED: (state) => {
    Object.values(state.fields).forEach((fieldData) => {
      fieldData.blurred = true;
    });
  },
  SET_SUBMITTING: (state, { payload }) => {
    state.submitting = payload;
  },
  SET_FORM_INVALID: (state) => {
    state.formInvalid = true;
  },
  SERVER_VALIDATION_FAILURE: (state, { payload }) => {
    state.formInvalid = true;
    state.fields[payload.field].serverValidationMessage = payload.value;
  },
  RESET: (_, { payload }) => {
    return initializeReducer(payload.user);
  },
});

const submitForm = async (formData, user, dispatch, onConfirm) => {
  dispatch({ type: 'SET_SUBMITTING', payload: true });

  const fieldData = formData.fields;
  const data = {
    firstName: fieldData.firstName.value,
    lastName: fieldData.lastName.value,
    email: fieldData.email.value,
    logAnalyticsFeature: fieldData.logAnalyticsFeature.value,
  };

  if (user.passwordSet) {
    data.currentPassword = fieldData.currentPassword.value;
  }

  let response;

  try {
    response = await updateUserData({
      version: user.sys.version,
      data,
    });
  } catch (err) {
    const { data } = err;

    if (_.get(data, ['sys', 'type']) === 'Error') {
      const errorDetails = data.details.errors;

      const pathFieldMapping = {
        first_name: 'firstName',
        last_name: 'lastName',
        current_password: 'currentPassword',
        email: 'email',
      };

      errorDetails.forEach(({ path, name }) => {
        let message = 'This field is not valid';
        const fieldName = pathFieldMapping[path];

        // We are aware of the field
        if (fieldName) {
          // We are aware of the field specific error
          switch (path) {
            case 'first_name': {
              if (name === 'length') {
                message = 'The first name you entered is too long';
              }
              break;
            }
            case 'last_name': {
              if (name === 'length') {
                message = 'The last name you entered is too long';
              }
              break;
            }
            case 'email': {
              if (name === 'invalid') {
                message = 'The email you entered is not valid';
              } else if (name === 'taken') {
                message = 'The email you entered is already in use';
              }
              break;
            }
            case 'current_password': {
              if (name === 'invalid') {
                message = 'The password you entered is not valid';
              }
              break;
            }
          }

          dispatch({
            type: 'SERVER_VALIDATION_FAILURE',
            payload: { field: pathFieldMapping[path], value: message },
          });
        } else {
          Notification.error('Something went wrong. Try again.');
        }
      });
    } else {
      Notification.error('Something went wrong. Try again.');
    }

    dispatch({ type: 'SET_SUBMITTING', payload: false });

    return;
  }

  // Show a notification telling the user to check their inbox if the unconfirmed email in the response is the same
  // as the email in the formData
  if (response.unconfirmedEmail === formData.fields.email.value) {
    Notification.warning('Check your inbox to confirm your new email.');
  }

  Notification.success('Your profile has been successfully updated.');

  dispatch({ type: 'RESET', payload: { user: response } });
  onConfirm(response);
};

export default function UserEditModal({ user, onConfirm, onCancel, isShown }) {
  const [formData, dispatch] = useReducer(reducer, user, initializeReducer);

  const fields = formData.fields;
  const userHasPassword = user.passwordSet;
  const userIsSSORestricted = user.ssoLoginOnly;

  const currentPasswordIsRequired = userHasPassword && fields.email.interacted;

  // Users can only change their email if they aren't SSO restricted
  const userCanChangeEmail = !userIsSSORestricted;

  const validateForm = () => {
    dispatch({ type: 'SET_ALL_FIELDS_BLURRED' });

    const formIsInvalid = Boolean(
      Object.keys(formData.fields).find((fieldName) => {
        if (fieldName === 'currentPassword' && !currentPasswordIsRequired) {
          return null;
        }

        return getValidationMessageFor(formData.fields, fieldName);
      })
    );

    if (formIsInvalid) {
      dispatch({ type: 'SET_FORM_INVALID' });

      return false;
    }

    return true;
  };

  const submitButtonDisabled =
    !Object.values(formData.fields).find((field) => field.interacted) ||
    formData.formInvalid ||
    formData.submitting;

  return (
    <Modal
      testId="edit-account-data-modal"
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
          testId="first-name-field"
          name="first-name"
          value={fields.firstName.value}
          onChange={(e) =>
            dispatch({
              type: 'UPDATE_FIELD_VALUE',
              payload: { field: 'firstName', value: e.target.value },
            })
          }
          onBlur={() => dispatch({ type: 'SET_FIELD_BLURRED', payload: { field: 'firstName' } })}
          labelText="First Name"
          textInputProps={{
            type: 'text',
            autoComplete: 'off',
            placeholder: 'Felix',
          }}
        />
        <TextField
          required
          validationMessage={getValidationMessageFor(formData.fields, 'lastName')}
          id="last-name-field"
          testId="last-name-field"
          name="last-name"
          value={fields.lastName.value}
          onChange={(e) =>
            dispatch({
              type: 'UPDATE_FIELD_VALUE',
              payload: { field: 'lastName', value: e.target.value },
            })
          }
          onBlur={() => dispatch({ type: 'SET_FIELD_BLURRED', payload: { field: 'lastName' } })}
          labelText="Last Name"
          textInputProps={{
            type: 'text',
            autoComplete: 'off',
            placeholder: 'Müller',
          }}
        />
        {userCanChangeEmail && (
          <TextField
            validationMessage={getValidationMessageFor(formData.fields, 'email')}
            id="email-field"
            testId="email-field"
            name="email"
            value={fields.email.value}
            onChange={(e) =>
              dispatch({
                type: 'UPDATE_FIELD_VALUE',
                payload: { field: 'email', value: e.target.value },
              })
            }
            onBlur={() => dispatch({ type: 'SET_FIELD_BLURRED', payload: { field: 'email' } })}
            labelText="Email"
            textInputProps={{
              type: 'email',
              autoComplete: 'off',
              placeholder: 'felix.mueller@example.com',
            }}
            helpText={
              userHasPassword && fields.email.interacted
                ? 'Enter your password to confirm your updated email.'
                : ''
            }
          />
        )}
        {currentPasswordIsRequired && (
          <>
            <Subheading>Confirm changes</Subheading>
            <TextField
              required
              validationMessage={
                formData.fields.currentPassword.blurred
                  ? getValidationMessageFor(formData.fields, 'currentPassword')
                  : ''
              }
              id="current-password-field"
              testId="current-password-field"
              name="current-password"
              value={fields.currentPassword.value}
              onChange={(e) =>
                dispatch({
                  type: 'UPDATE_FIELD_VALUE',
                  payload: { field: 'currentPassword', value: e.target.value },
                })
              }
              onBlur={() =>
                dispatch({ type: 'SET_FIELD_BLURRED', payload: { field: 'currentPassword' } })
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
              payload: { field: 'logAnalyticsFeature', value: !fields.logAnalyticsFeature.value },
            })
          }
          checked={fields.logAnalyticsFeature.value === true}
          id="termsCheckboxYes"
        />
        <div className={styles.controlsPanel}>
          <Button
            testId="confirm-account-data-changes"
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
            testId="cancel-account-data-changes"
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
  user: UserPropType.isRequired,
};
