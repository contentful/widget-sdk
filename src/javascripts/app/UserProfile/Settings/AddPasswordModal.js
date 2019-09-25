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
import { updateUserData } from './AccountService';
import { getValidationMessageFor } from './utils';

const styles = {
  controlsPanel: css({ display: 'flex' }),
  marginLeftM: css({ marginLeft: tokens.spacingM })
};

const createFieldData = (initialValue = null) => ({
  touched: false,
  dirty: false,
  value: initialValue,
  serverValidationMessage: null
});

const initializeReducer = currentVersion => {
  return {
    fields: {
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
  SET_ALL_FIELDS_DIRTY: state => {
    Object.values(state.fields).forEach(fieldData => {
      fieldData.dirty = true;
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

export default function AddPasswordModal({ currentVersion, onConfirm, onCancel, isShown }) {
  const [formData, dispatch] = useReducer(reducer, currentVersion, initializeReducer);

  const submit = async () => {
    dispatch({ type: 'SET_SUBMITTING', payload: true });

    const newPassword = formData.fields.newPassword.value;
    let response;

    try {
      response = await updateUserData({
        version: currentVersion,
        data: { password: newPassword }
      });
    } catch (_) {
      Notification.error('Something went wrong. Try again.');
      dispatch({ type: 'SET_SUBMITTING', payload: false });

      return;
    }

    if (response.sys.type === 'Error') {
      const error = response.details.errors[0];

      if (error.name === 'insecure') {
        dispatch({
          type: 'SERVER_VALIDATION_FAILURE',
          payload: {
            field: 'newPassword',
            value: 'The password you entered is not secure'
          }
        });
      }

      dispatch({ type: 'SET_SUBMITTING', payload: false });
    } else {
      onConfirm(response);
    }
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
  const submitButtonDisabled =
    formData.submitting ||
    fields.newPassword.value === '' ||
    fields.newPassword.value !== fields.newPasswordConfirm.value ||
    fields.newPassword.serverValidationMessage;

  return (
    <Modal
      title="Add a password"
      shouldCloseOnEscapePress={true}
      shouldCloseOnOverlayClick={true}
      isShown={isShown}
      onClose={() => {
        dispatch({ type: 'RESET', payload: { currentVersion } });
        onCancel();
      }}
      size="large">
      <Form>
        <TextField
          required
          validationMessage={getValidationMessageFor(formData.fields, 'newPassword')}
          id="new-password"
          name="new-password"
          value={fields.newPassword.value}
          onChange={e =>
            dispatch({
              type: 'UPDATE_FIELD_VALUE',
              payload: { field: 'newPassword', value: e.target.value }
            })
          }
          labelText="New password"
          textInputProps={{ type: 'password', autoComplete: 'off' }}
        />
        <TextField
          required
          id="new-password-confirm"
          name="new-password-confirm"
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
        <div className={styles.controlsPanel}>
          <Button
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
              dispatch({ type: 'RESET', payload: { currentVersion } });
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

AddPasswordModal.propTypes = {
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  isShown: PropTypes.bool.isRequired,
  currentVersion: PropTypes.number.isRequired
};
