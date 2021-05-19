import React, { useCallback, useEffect, useReducer } from 'react';
import {
  Button,
  CheckboxField,
  FieldGroup,
  Form,
  Modal,
  Notification,
  TextField,
} from '@contentful/forma-36-react-components';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { TagPropType } from 'features/content-tags/core/TagPropType';
import { useReadTags, useUpdateTag } from 'features/content-tags/core/hooks';

const FORM_RESET = 'FORM_RESET';
const FORM_NAME_CHANGED = 'FORM_NAME_CHANGED';
const FORM_CONFIRM_CHANGED = 'FORM_CONFIRM_CHANGED';
const FORM_CONFIRM_TOUCHED_CHANGED = 'FORM_CONFIRM_TOUCHED_CHANGED';
const FORM_INITIAL_STATE = { name: '', confirm: false, confirmTouched: false };

const reducer = (state, action) => {
  switch (action.type) {
    case FORM_NAME_CHANGED:
      return { ...state, name: action.payload.trim() };
    case FORM_CONFIRM_CHANGED:
      return { ...state, confirm: action.payload };
    case FORM_CONFIRM_TOUCHED_CHANGED:
      return { ...state, confirmTouched: action.payload };
    case FORM_RESET:
      return FORM_INITIAL_STATE;
  }
};

const styles = {
  controlsPanel: css({ display: 'flex' }),
  marginLeftM: css({ marginLeft: tokens.spacingM }),
};

function validate(state, initialTag, nameExistsValidator) {
  const errors = {};
  if (state.name !== initialTag.name && nameExistsValidator(state.name)) {
    errors.name = 'This name is already taken.';
  } else if (state.name.length && state.name.startsWith('contentful.')) {
    errors.name =
      'Nice try! Unfortunately, we keep the "contentful." tag name prefix for internal purposes.';
  }
  return errors;
}

/**
 * @return {null}
 */
function UpdateTagModal({ isShown, onClose, tag }) {
  const [{ name, confirm, confirmTouched }, dispatch] = useReducer(reducer, FORM_INITIAL_STATE);
  const { reset, nameExists, getTag } = useReadTags();
  const errors = validate({ name }, tag, nameExists);
  const hasAnyValidationErrors = Object.values(errors).some((item) => Boolean(item));
  const isConfirmEnabled = name && confirm && !hasAnyValidationErrors;

  const { updateTag, updateTagData, updateTagError, updateTagIsLoading, resetUpdateTag } =
    useUpdateTag();

  const close = useCallback(() => {
    onClose();
    dispatch({ type: FORM_RESET });
    resetUpdateTag();
  }, [onClose, dispatch, resetUpdateTag]);

  const handleError = useCallback(
    (error) => {
      if (error.code === 'VersionMismatch') {
        Notification.error(`Outdated tag, please try again.`);
      } else {
        Notification.error(`An error occurred updating tag.`);
      }
      resetUpdateTag();
      reset();
    },
    [reset, resetUpdateTag]
  );

  useEffect(() => {
    if (updateTagError) {
      handleError(updateTagError);
    }
  }, [updateTagError, handleError]);

  useEffect(() => {
    if (updateTagData) {
      Notification.success(`Successfully updated tag "${name}".`);
      close();
    }
  }, [updateTagData, name, close]);

  const onSubmit = useCallback(async () => {
    const latestTag = getTag(tag.sys.id);
    const currentTagVersion = latestTag ? latestTag.sys.version : tag.sys.version;
    await updateTag(tag.sys.id, name, currentTagVersion);
    await reset();
  }, [tag, name, reset, updateTag, getTag]);

  const onCancel = () => {
    close();
  };

  const onNameChange = (event) => {
    dispatch({ type: FORM_NAME_CHANGED, payload: event.target.value });
  };

  const onConfirmChange = (event) => {
    dispatch({ type: FORM_CONFIRM_CHANGED, payload: event.target.checked });
    dispatch({ type: FORM_CONFIRM_TOUCHED_CHANGED, payload: true });
  };

  if (!tag) {
    return null;
  }

  return (
    <Modal
      isShown={isShown}
      title={'Rename tag'}
      onClose={onClose}
      testId={'update-content-tag-modal'}
      shouldCloseOnOverlayClick={!updateTagIsLoading}
      shouldCloseOnEscapePress={!updateTagIsLoading}>
      <Form testId={'update-content-tag-form'} spacing={'condensed'}>
        <TextField
          required
          testId={'update-content-tag-name-field'}
          id={'name'}
          name="name"
          countCharacters={true}
          labelText={'Tag name'}
          value={name}
          validationMessage={errors.name || null}
          textInputProps={{
            autoFocus: true,
            maxLength: 64,
            type: 'text',
            autoComplete: 'off',
            placeholder: tag.name,
            testId: 'update-content-tag-name-input',
          }}
          onChange={onNameChange}
        />
        <FieldGroup>
          <CheckboxField
            testId={'update-content-tag-checkbox-field'}
            labelText={"I'm sure I want to rename this tag."}
            validationMessage={confirmTouched && !confirm ? 'please confirm renaming.' : null}
            checked={confirm}
            onChange={onConfirmChange}
            value="yes"
            labelIsLight={true}
            id="optIn"
            inputProps={{
              testId: 'update-content-tag-checkbox-input',
            }}
          />
        </FieldGroup>
        <div className={styles.controlsPanel}>
          <Button
            testId={'update-content-tag-submit-button'}
            onClick={onSubmit}
            type="submit"
            buttonType="positive"
            loading={updateTagIsLoading}
            disabled={updateTagIsLoading || !isConfirmEnabled}>
            Save tag
          </Button>
          <Button
            className={styles.marginLeftM}
            onClick={onCancel}
            disabled={updateTagIsLoading}
            buttonType="muted">
            Cancel
          </Button>
        </div>
      </Form>
    </Modal>
  );
}

UpdateTagModal.propTypes = {
  isShown: PropTypes.bool,
  onClose: PropTypes.func,
  tag: PropTypes.shape(TagPropType),
};

export { UpdateTagModal };
