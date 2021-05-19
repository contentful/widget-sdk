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
import * as stringUtils from 'utils/StringUtils';
import { useCreateTag, useReadTags } from 'features/content-tags/core/hooks';
import { TAGS_PER_SPACE } from 'features/content-tags/core/limits';
import { LimitsReachedNote } from 'features/content-tags/management/components/LimitsReachedNote';
import {
  TagVisibilitySelection,
  VISIBILITY,
} from 'features/content-tags/management/components/TagVisibilitySelection';
import { GroupingHint } from 'features/content-tags/management/components/GroupingHint';
import { CONTENTFUL_NAMESPACE } from 'features/content-tags/core/constants';

const styles = {
  controlsPanel: css({ display: 'flex' }),
  marginLeftM: css({ marginLeft: tokens.spacingM }),
  marginBottom: css({ marginBottom: tokens.spacingM }),
};

const FORM_NAME_CHANGED = 'FORM_NAME_CHANGED';
const FORM_ID_CHANGED = 'FORM_ID_CHANGED';
const FORM_ID_TOUCHED = 'FORM_ID_TOUCHED';
const FORM_VISIBILITY_CHANGED = 'FORM_VISIBILITY_CHANGED';
const FORM_RESET = 'FORM_RESET';

const FORM_INITIAL_STATE = {
  name: '',
  id: '',
  idTouched: false,
  visibility: VISIBILITY.PRIVATE,
};

const reducer = (state, action) => {
  switch (action.type) {
    case FORM_NAME_CHANGED:
      return { ...state, name: action.payload.trim() };
    case FORM_ID_CHANGED:
      return { ...state, id: action.payload.trim() };
    case FORM_ID_TOUCHED:
      return { ...state, idTouched: action.payload };
    case FORM_VISIBILITY_CHANGED:
      return { ...state, visibility: action.payload };
    case FORM_RESET:
      return FORM_INITIAL_STATE;
  }
};

function validate(state, nameExistsValidator, idExistsValidator) {
  const errors = { id: null };
  if (state.id.length) {
    if (state.id.startsWith(CONTENTFUL_NAMESPACE)) {
      errors.id =
        'Nice try! Unfortunately, we keep the "contentful." tag ID prefix for internal purposes.';
    } else if (!isValidResourceId(state.id)) {
      errors.id = 'Use only Latin letters, numbers, dots, hyphens and underscores.';
    } else if (idExistsValidator(state.id)) {
      errors.id = 'This id is already taken.';
    }
  }
  if (nameExistsValidator(state.name)) {
    errors.name = 'This name is already taken.';
  }
  if (state.name.length && state.name.startsWith('contentful.')) {
    errors.name =
      'Nice try! Unfortunately, we keep the "contentful." tag name prefix for internal purposes.';
  }
  return errors;
}

function CreateTagModal({ isShown, onClose, isInline, inlineData }) {
  const [{ name, id, idTouched, visibility }, dispatch] = useReducer(reducer, FORM_INITIAL_STATE);
  const [continueCreation, setContinueCreation] = useState(false);
  const { reset, nameExists, idExists, total } = useReadTags();
  const errors = validate({ name, id }, nameExists, idExists);
  const hasAnyValidationErrors = Object.values(errors).some((item) => Boolean(item));
  const isConfirmEnabled = name && id && hasAnyValidationErrors === false;
  const limitsReached = total >= TAGS_PER_SPACE;

  const { createTag, createTagIsLoading, resetCreateTag, createTagData, createTagError } =
    useCreateTag();

  const resetForm = useCallback(() => {
    resetCreateTag();
    dispatch({ type: FORM_RESET });
  }, [resetCreateTag, dispatch]);

  const close = useCallback(
    (createdTag) => {
      resetForm();
      onClose(createdTag);
    },
    [resetForm, onClose]
  );

  useEffect(() => {
    if (isInline && Object.keys(inlineData).length) {
      dispatch({ type: FORM_NAME_CHANGED, payload: inlineData.name });
      dispatch({ type: FORM_ID_CHANGED, payload: inlineData.id });
    }
  }, [isInline, inlineData]);

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
        close(createTagData);
      }
    }
  }, [resetForm, reset, createTagData, name, close, continueCreation]);

  const onSubmit = async (doContinue) => {
    setContinueCreation(doContinue);
    await createTag(id, name, visibility);
  };

  const onCancel = () => {
    close(undefined);
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

  const onVisibilityChange = (event) => {
    dispatch({ type: FORM_VISIBILITY_CHANGED, payload: event.target.value });
  };

  const renderCreateButtons = (buttons) =>
    buttons.map((button) => {
      const { className, testId, onClick, label } = button;
      return (
        <Button
          key={testId}
          testId={testId}
          className={className}
          onClick={onClick}
          type="submit"
          buttonType="positive"
          loading={createTagIsLoading}
          disabled={limitsReached || createTagIsLoading || !isConfirmEnabled}>
          {label}
        </Button>
      );
    });

  const renderButtons = () => (
    <div className={styles.controlsPanel}>
      {isInline
        ? renderCreateButtons([
            {
              testId: 'create-content-tag-inline-submit-button',
              onClick: () => onSubmit(false),
              label: 'Create and add tag',
            },
          ])
        : renderCreateButtons([
            {
              testId: 'create-content-tag-continues-submit-button',
              onClick: () => onSubmit(true),
              label: 'Save and create another',
            },
            {
              testId: 'create-content-tag-submit-button',
              className: styles.marginLeftM,
              onClick: () => onSubmit(false),
              label: 'Save tag',
            },
          ])}
      <Button
        testId={'create-content-tag-cancel-button'}
        className={styles.marginLeftM}
        onClick={onCancel}
        disabled={createTagIsLoading}
        buttonType="muted">
        Cancel
      </Button>
    </div>
  );

  return (
    <Modal
      testId={'create-content-tags-modal'}
      isShown={isShown}
      title={`Create tag`}
      onClose={onClose}
      shouldCloseOnOverlayClick={!createTagIsLoading}
      shouldCloseOnEscapePress={!createTagIsLoading}>
      {limitsReached && <LimitsReachedNote className={styles.marginBottom} />}
      <Form spacing={'condensed'} testId={'create-content-tags-form'}>
        <TextField
          required
          countCharacters
          testId={'create-content-tag-name-field'}
          id={'name'}
          name="name"
          labelText={'Tag name'}
          helpText={!isInline && 'Tip: Press ↵ on your keyboard to save and create another'}
          value={name}
          validationMessage={errors.name || null}
          textInputProps={{
            autoFocus: true,
            maxLength: 64,
            type: 'text',
            autoComplete: 'off',
            testId: 'create-content-tag-name-input',
          }}
          onChange={onNameChange}
        />
        <GroupingHint tagName={name} />
        <TagVisibilitySelection visibility={visibility} onChange={onVisibilityChange} />
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
        {renderButtons()}
      </Form>
    </Modal>
  );
}

CreateTagModal.propTypes = {
  isShown: PropTypes.bool,
  onClose: PropTypes.func,
  isInline: PropTypes.bool,
  inlineData: PropTypes.oneOfType([
    PropTypes.exact({
      id: PropTypes.string,
      name: PropTypes.string,
    }),
    PropTypes.exact({}),
  ]),
};

export { CreateTagModal };
