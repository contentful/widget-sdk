import React, { useCallback, useEffect, useReducer } from 'react';
import {
  Button,
  CheckboxField,
  FieldGroup,
  Form,
  Modal,
  Note,
  Notification,
  Paragraph,
} from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import PropTypes from 'prop-types';
import { TagPropType } from 'features/content-tags/core/TagPropType';
import { useDeleteTag, useReadTags } from 'features/content-tags/core/hooks';

const styles = {
  controlsPanel: css({ display: 'flex', marginTop: tokens.spacingL }),
  marginLeftM: css({ marginLeft: tokens.spacingM }),
  marginM: css({ marginTop: tokens.spacingM, marginBottom: tokens.spacingM }),
};

const FORM_RESET = 'FORM_RESET';
const FORM_FIRST_CONFIRM_CHANGED = 'FORM_FIRST_CONFIRM_CHANGED';
const FORM_FIRST_CONFIRM_TOUCHED = 'FORM_FIRST_CONFIRM_TOUCHED';
const FORM_SECOND_CONFIRM_CHANGED = 'FORM_SECOND_CONFIRM_CHANGED';
const FORM_SECOND_CONFIRM_TOUCHED = 'FORM_SECOND_CONFIRM_TOUCHED';
const FORM_INITIAL_STATE = {
  firstConfirm: false,
  firstConfirmTouched: false,
  secondConfirm: false,
  secondConfirmTouched: false,
};

const reducer = (state, action) => {
  switch (action.type) {
    case FORM_FIRST_CONFIRM_CHANGED:
      return { ...state, firstConfirm: action.payload };
    case FORM_FIRST_CONFIRM_TOUCHED:
      return { ...state, firstConfirmTouched: action.payload };
    case FORM_SECOND_CONFIRM_CHANGED:
      return { ...state, secondConfirm: action.payload };
    case FORM_SECOND_CONFIRM_TOUCHED:
      return { ...state, secondConfirmTouched: action.payload };
    case FORM_RESET:
      return FORM_INITIAL_STATE;
  }
};

function DeleteTagModal({ tag, isShown, onClose }) {
  const [
    { firstConfirm, firstConfirmTouched, secondConfirm, secondConfirmTouched },
    dispatch,
  ] = useReducer(reducer, FORM_INITIAL_STATE);
  const { reset } = useReadTags();

  const {
    deleteTag,
    deleteTagIsLoading,
    deleteTagData,
    deleteTagError,
    resetDeleteTag,
  } = useDeleteTag();

  const close = useCallback(async () => {
    onClose();
    dispatch({ type: FORM_RESET });
    resetDeleteTag();
  }, [onClose, resetDeleteTag]);

  const onSubmit = useCallback(async () => {
    await deleteTag(tag.sys.id, tag.sys.version);
    await reset();
  }, [deleteTag, tag, reset]);

  const onCancel = useCallback(async () => {
    close();
  }, [close]);

  useEffect(() => {
    if (deleteTagError) {
      Notification.error(`Error deleting tag.`);
    }
  }, [deleteTagError]);

  useEffect(() => {
    if (deleteTagData) {
      Notification.success(`Successfully deleted "${tag.name}".`);
      close();
    }
  }, [deleteTagData, tag, close]);

  const onChangeFirst = (event) => {
    dispatch({ type: FORM_FIRST_CONFIRM_CHANGED, payload: event.target.checked });
    dispatch({ type: FORM_FIRST_CONFIRM_TOUCHED, payload: true });
  };

  const onChangeSecond = (event) => {
    dispatch({ type: FORM_SECOND_CONFIRM_CHANGED, payload: event.target.checked });
    dispatch({ type: FORM_SECOND_CONFIRM_TOUCHED, payload: true });
  };

  if (!tag) {
    return null;
  }

  return (
    <Modal title={`Delete tag "${tag.name}"`} isShown={isShown} onClose={close}>
      <Note noteType="negative" title="This may have big implications for permissions">
        Tag &quot;{tag.name}&quot; may be used to define access for a custom role in this space.
      </Note>
      <Paragraph className={styles.marginM}>Check both options to confirm:</Paragraph>
      <Form spacing={'condensed'} testId={'delete-tag-modal-form'}>
        <FieldGroup>
          <CheckboxField
            testId="delete-tag-modal-first-confirm-field"
            type="checkbox"
            inputProps={{ testId: 'delete-tag-modal-first-confirm-input' }}
            labelText={`Remove "${tag.name}" from all entries and assets`}
            helpText={'Any user may gain or lose access to content tagged with this tag'}
            validationMessage={
              firstConfirmTouched && !firstConfirm ? 'Check both options to confirm deletion' : null
            }
            checked={firstConfirm}
            value="yes"
            onChange={onChangeFirst}
            id="optInFirst"
          />
          <CheckboxField
            testId="delete-tag-modal-second-confirm-field"
            type="checkbox"
            inputProps={{ testId: 'delete-tag-modal-second-confirm-input' }}
            labelText={`Remove "${tag.name}" from all roles`}
            helpText={`Users with roles that are defined using "${tag.name}" could gain or lose access to content tagged with this tag`}
            validationMessage={
              secondConfirmTouched && !secondConfirm
                ? 'Check both options to confirm deletion'
                : null
            }
            checked={secondConfirm}
            value="yes"
            onChange={onChangeSecond}
            id="optInSecond"
          />
        </FieldGroup>
        <div className={styles.controlsPanel}>
          <Button
            testId="delete-tag-modal-submit"
            onClick={onSubmit}
            type="submit"
            buttonType="negative"
            loading={deleteTagIsLoading}
            disabled={!firstConfirm || !secondConfirm || deleteTagIsLoading}>
            Delete and remove
          </Button>
          <Button
            className={styles.marginLeftM}
            testId="cancel"
            onClick={onCancel}
            buttonType="muted">
            Cancel
          </Button>
        </div>
      </Form>
    </Modal>
  );
}

DeleteTagModal.propTypes = {
  tag: PropTypes.shape(TagPropType),
  isShown: PropTypes.bool,
  onClose: PropTypes.func,
};

export { DeleteTagModal };
