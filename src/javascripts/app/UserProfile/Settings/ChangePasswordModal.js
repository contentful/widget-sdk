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
import { fromPairs, get } from 'lodash';

const styles = {
  controlsPanel: css({ display: 'flex' }),
  marginLeftM: css({ marginLeft: tokens.spacingM })
};

const createFieldData = (initialValue = '') => ({
  blurred: false,
  value: initialValue,
  serverValidationMessage: null
});

const initializeReducer = user => {
  const {
    sys: { version: currentVersion }
  } = user;
  const fields = {
    newPassword: createFieldData(),
    newPasswordConfirm: createFieldData()
  };

  if (user.passwordSet) {
    fields.currentPassword = createFieldData();
  }

  return {
    fields,
    formInvalid: false,
    submitting: false,
    currentVersion
  };
};

const reducer = createImmerReducer({
  UPDATE_FIELD_VALUE: (state, { payload }) => {
    state.fields[payload.field].value = payload.value;
    state.formInvalid = false;
    state.fields[payload.field].serverValidationMessage = null;
  },
  SET_FIELD_BLURRED: (state, { payload }) => {
    state.fields[payload.field].blurred = true;
  },
  SET_ALL_FIELDS_BLURRED: state => {
    Object.values(state.fields).forEach(fieldData => {
      fieldData.blurred = true;
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
    return initializeReducer(payload);
  }
});

export default function ChangePasswordModal({ user, onConfirm, onCancel, isShown }) {
  const [formData, dispatch] = useReducer(reducer, user, initializeReducer);

  const submit = async () => {
    dispatch({ type: 'SET_SUBMITTING', payload: true });

    const data = {
      password: formData.fields.newPassword.value
    };

    if (formData.fields.currentPassword) {
      data.currentPassword = formData.fields.currentPassword.value;
    }

    let response;

    try {
      response = await updateUserData({
        version: user.sys.version,
        data
      });
    } catch (err) {
      const { data } = err;

      if (get(data, ['sys', 'type']) === 'Error') {
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
    dispatch({ type: 'SET_ALL_FIELDS_BLURRED' });

    // We need to manually set each field as touched as well, since
    // the update will happen after this function call
    const fields = fromPairs(
      Object.entries(formData.fields).map(([name, data]) => {
        return [
          name,
          {
            ...data,
            blurred: true
          }
        ];
      })
    );

    const formIsInvalid = Boolean(
      Object.keys(formData.fields).find(fieldName => getValidationMessageFor(fields, fieldName))
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
        dispatch({ type: 'RESET', payload: user });
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
              dispatch({ type: 'SET_FIELD_BLURRED', payload: { field: 'currentPassword' } })
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
          onBlur={() => dispatch({ type: 'SET_FIELD_BLURRED', payload: { field: 'newPassword' } })}
          labelText="New password"
          textInputProps={{ type: 'password', autoComplete: 'off' }}
        />
        <TextField
          required
          validationMessage={getValidationMessageFor(formData.fields, 'newPasswordConfirm')}
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
            dispatch({ type: 'SET_FIELD_BLURRED', payload: { field: 'newPasswordConfirm' } })
          }
          labelText="Confirm new password"
          textInputProps={{ type: 'password', autoComplete: 'off' }}
        />
        <div className={styles.controlsPanel}>
          <Button
            testId="confirm-change-password"
            onClick={() => {
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
            testId="cancel"
            onClick={() => {
              dispatch({ type: 'RESET', payload: user });
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
