import React, { useReducer } from 'react';
import PropTypes from 'prop-types';
import {
  Modal,
  Form,
  TextField,
  Button,
  Notification
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { css } from 'emotion';
import { createImmerReducer } from 'redux/utils/createImmerReducer.es6';
import { updateUserData } from './AccountRepository';
import { getValidationMessageFor } from './utils';

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

const initializeReducer = currentVersion => {
  return {
    fields: {
      currentPassword: createFieldData(),
      newPassword: createFieldData(),
      newPasswordConfirm: createFieldData()
    },
    formInvalid: false,
    submitting: false,
    currentVersion
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
  RESET: () => {
    return initializeReducer();
  }
});

export default function ChangePasswordModal({ user, onConfirm, onCancel, isShown }) {
  const [formData, dispatch] = useReducer(reducer, user.sys.version, initializeReducer);

  const submit = async () => {
    dispatch({ type: 'SET_SUBMITTING', payload: true });

    const newPassword = formData.fields.newPassword.value;
    const currentPassword = formData.fields.currentPassword.value;
    let response;

    try {
      response = await updateUserData({
        version: user.sys.version,
        data: {
          password: newPassword,
          currentPassword
        }
      });
    } catch (err) {
      const { data } = err;

      if (data.sys && data.sys.type === 'Error') {
        const error = data.details.errors[0];

        if (error.name === 'insecure') {
          dispatch({
            type: 'SERVER_VALIDATION_FAILURE',
            payload: {
              field: 'newPassword',
              value: 'The password you entered is not secure'
            }
          });
        }
      } else {
        Notification.error('Something went wrong. Try again.');
      }

      dispatch({ type: 'SET_SUBMITTING', payload: false });
      return;
    }

    onConfirm(response);
  };

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
  const submitButtonDisabled = Boolean(
    formData.submitting ||
      fields.newPassword.value === '' ||
      fields.newPassword.value !== fields.newPasswordConfirm.value ||
      fields.newPassword.serverValidationMessage
  );
  const userHasPassword = user.passwordSet;

  return (
    <Modal
      testId="change-password-modal"
      title={`${userHasPassword ? 'Update' : 'Add'} password`}
      shouldCloseOnEscapePress={true}
      shouldCloseOnOverlayClick={true}
      isShown={isShown}
      onClose={() => {
        dispatch({ type: 'RESET', payload: { currentVersion: user.sys.version } });
        onCancel();
      }}
      size="large">
      <Form>
        {userHasPassword && (
          <TextField
            required
            validationMessage={getValidationMessageFor(formData.fields, 'currentPassword')}
            testId="current-password"
            id="current-password"
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
            labelText="Current password"
            textInputProps={{ type: 'password', autoComplete: 'off' }}
          />
        )}
        <TextField
          required
          validationMessage={getValidationMessageFor(formData.fields, 'newPassword')}
          testId="new-password"
          id="new-password"
          name="new-password"
          value={fields.newPassword.value}
          onChange={e =>
            dispatch({
              type: 'UPDATE_FIELD_VALUE',
              payload: { field: 'newPassword', value: e.target.value }
            })
          }
          onBlur={() => dispatch({ type: 'SET_FIELD_TOUCHED', payload: { field: 'newPassword' } })}
          labelText="New password"
          textInputProps={{ type: 'password', autoComplete: 'off' }}
        />
        <TextField
          required
          testId="new-password-confirm"
          id="new-password-confirm"
          name="new-password-confirm"
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
        <div className={styles.controlsPanel}>
          <Button
            testId="confirm-change-password"
            onClick={async () => {
              const formIsValid = validateForm();

              formIsValid && submit();
            }}
            type="submit"
            disabled={submitButtonDisabled}
            loading={formData.submitting}
            buttonType="positive">
            Save new password
          </Button>
          <Button
            className={styles.marginLeftM}
            onClick={() => {
              dispatch({ type: 'RESET', payload: { currentVersion: user.sys.version } });
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

ChangePasswordModal.propTypes = {
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  isShown: PropTypes.bool.isRequired,
  user: PropTypes.object.isRequired
};
