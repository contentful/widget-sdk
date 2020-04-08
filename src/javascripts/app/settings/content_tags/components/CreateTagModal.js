import React, { useCallback, useEffect, useReducer, useState } from 'react';
import {
  Button,
  Form,
  Modal,
  Notification,
  TextField,
} from '@contentful/forma-36-react-components';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { isValidResourceId } from 'data/utils';
import useCreateTag from '../hooks/useCreateTag';
import useReadTags from '../hooks/useReadTags';
import * as stringUtils from 'utils/StringUtils';

const styles = {
  controlsPanel: css({ display: 'flex' }),
  marginLeftM: css({ marginLeft: tokens.spacingM }),
};

const FORM_NAME_CHANGED = 'FORM_NAME_CHANGED';
const FORM_ID_CHANGED = 'FORM_ID_CHANGED';
const FORM_ID_TOUCHED = 'FORM_ID_TOUCHED';
const FORM_RESET = 'FORM_RESET';

const FORM_INITIAL_STATE = { name: '', id: '', idTouched: false };

const reducer = (state, action) => {
  switch (action.type) {
    case FORM_NAME_CHANGED:
      return { ...state, name: action.payload.trim() };
    case FORM_ID_CHANGED:
      return { ...state, id: action.payload.trim() };
    case FORM_ID_TOUCHED:
      return { ...state, idTouched: action.payload };
    case FORM_RESET:
      return FORM_INITIAL_STATE;
  }
};

function validate(state, tags) {
  const errors = { id: null };
  if (state.id.length) {
    if (!isValidResourceId(state.id)) {
      errors.id = 'Please use only letters, numbers and underscores';
    } else if (state.id.startsWith('contentful.')) {
      errors.id = 'The prefix "contentful" is reserved for internal usage.';
    }
  }
  if (tags.some((tag) => tag.name === state.name)) {
    errors.name = 'This name is already taken.';
  }
  return errors;
}

function CreateTagModal({ isShown, onClose }) {
  const [{ name, id, idTouched }, dispatch] = useReducer(reducer, FORM_INITIAL_STATE);
  const [continueCreation, setContinueCreation] = useState(false);
  const { reset, data } = useReadTags();
  const errors = validate({ name, id }, data);
  const hasAnyValidationErrors = Object.values(errors).some((item) => Boolean(item));
  const isConfirmEnabled = name && id && hasAnyValidationErrors === false;

  const {
    createTag,
    createTagIsLoading,
    resetCreateTag,
    createTagData,
    createTagError,
  } = useCreateTag(id, name);

  const resetForm = useCallback(() => {
    resetCreateTag();
    dispatch({ type: FORM_RESET });
  }, [resetCreateTag, dispatch]);

  const close = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  useEffect(() => {
    if (createTagError) {
      Notification.error(`An error occurred creating tag.`);
    }
  }, [createTagError]);

  useEffect(() => {
    if (createTagData) {
      Notification.success(`Successfully created tag "${name}".`);
      reset();
      if (continueCreation) {
        resetForm();
      } else {
        close();
      }
    }
  }, [resetForm, reset, createTagData, name, close, continueCreation]);

  const onSubmit = async (doContinue) => {
    setContinueCreation(doContinue);
    await createTag(id, name);
  };

  const onCancel = () => {
    close();
  };

  const onNameChange = (event) => {
    dispatch({ type: FORM_NAME_CHANGED, payload: event.target.value });
    if (!idTouched) {
      dispatch({ type: FORM_ID_CHANGED, payload: stringUtils.toIdentifier(event.target.value) });
    }
    resetCreateTag();
  };

  const onIdChange = (event) => {
    dispatch({ type: FORM_ID_CHANGED, payload: event.target.value });
    dispatch({ type: FORM_ID_TOUCHED, payload: event.target.value.length > 0 });
  };

  return (
    <Modal
      testId={'create-content-tags-modal'}
      isShown={isShown}
      title={'Create tag'}
      onClose={onClose}
      shouldCloseOnOverlayClick={!createTagIsLoading}
      shouldCloseOnEscapePress={!createTagIsLoading}>
      <Form spacing={'condensed'} testId={'create-content-tags-form'}>
        <TextField
          required
          countCharacters
          testId={'create-content-tag-name-field'}
          id={'name'}
          name="name"
          labelText={'Tag name'}
          value={name}
          validationMessage={errors.name || null}
          textInputProps={{
            maxLength: 64,
            type: 'text',
            autoComplete: 'off',
            testId: 'create-content-tag-name-input',
          }}
          onChange={onNameChange}
        />
        <TextField
          required
          id={'id'}
          testId={'create-content-tag-id-field'}
          name="id"
          value={id}
          labelText={'Tag ID'}
          validationMessage={errors.id || null}
          textInputProps={{
            type: 'text',
            autoComplete: 'off',
            testId: 'create-content-tag-id-input',
          }}
          onChange={onIdChange}
        />
        <div className={styles.controlsPanel}>
          <Button
            onClick={() => onSubmit(true)}
            type="submit"
            buttonType="positive"
            loading={createTagIsLoading}
            testId={'create-content-tag-continues-submit-button'}
            disabled={createTagIsLoading || !isConfirmEnabled}>
            Save and create another
          </Button>
          <Button
            className={styles.marginLeftM}
            testId={'create-content-tag-submit-button'}
            onClick={() => onSubmit(false)}
            type="submit"
            buttonType="positive"
            loading={createTagIsLoading}
            disabled={createTagIsLoading || !isConfirmEnabled}>
            Save tag
          </Button>
          <Button
            testId={'create-content-tag-cancel-button'}
            className={styles.marginLeftM}
            onClick={onCancel}
            disabled={createTagIsLoading}
            buttonType="muted">
            Cancel
          </Button>
        </div>
      </Form>
    </Modal>
  );
}

CreateTagModal.propTypes = {
  isShown: PropTypes.bool,
  onClose: PropTypes.func,
};

export default CreateTagModal;
