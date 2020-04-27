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
  marginBottom: css({ marginBottom: tokens.spacingM }),
};

export const formatNumber = (value) => {
  return new Intl.NumberFormat().format(value);
};

const FORM_RESET = 'FORM_RESET';
const FORM_CONFIRM_CHANGED = 'FORM_CONFIRM_CHANGED';
const FORM_CONFIRM_TOUCHED_CHANGED = 'FORM_CONFIRM_TOUCHED_CHANGED';
const FORM_INITIAL_STATE = { confirm: false, confirmTouched: false };

const reducer = (state, action) => {
  switch (action.type) {
    case FORM_CONFIRM_CHANGED:
      return { ...state, confirm: action.payload };
    case FORM_CONFIRM_TOUCHED_CHANGED:
      return { ...state, confirmTouched: action.payload };
    case FORM_RESET:
      return FORM_INITIAL_STATE;
  }
};

function DeleteTagModal({ tag, isShown, onClose }) {
  const [{ confirm, confirmTouched }, dispatch] = useReducer(reducer, FORM_INITIAL_STATE);
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

  const onChange = (event) => {
    dispatch({ type: FORM_CONFIRM_CHANGED, payload: event.target.checked });
    dispatch({ type: FORM_CONFIRM_TOUCHED_CHANGED, payload: true });
  };

  if (!tag) {
    return null;
  }

  return (
    <Modal title={'Delete tag'} isShown={isShown} onClose={close}>
      <Paragraph className={styles.marginBottom}>
        Are you sure you want to delete the tag {tag.name}?
      </Paragraph>
      <Note noteType={'warning'} className={styles.marginBottom}>
        There are {formatNumber(tag.entriesTagged || 0)} entries and{' '}
        {formatNumber(tag.assetsTagged || 0)} assets with this tag.
      </Note>
      <Form spacing={'condensed'} testId={'delete-tag-modal-form'}>
        <FieldGroup>
          <CheckboxField
            testId="delete-tag-modal-confirm"
            type="checkbox"
            inputProps={{ testId: 'delete-tag-modal-input' }}
            labelText={'Delete tag and remove it from all entries and assets.'}
            validationMessage={confirmTouched && !confirm ? 'please confirm deletion.' : null}
            checked={confirm}
            value="yes"
            onChange={onChange}
            labelIsLight={true}
            id="optIn"
          />
        </FieldGroup>
        <div className={styles.controlsPanel}>
          <Button
            testId="delete-tag-modal-submit"
            onClick={onSubmit}
            type="submit"
            buttonType="negative"
            loading={deleteTagIsLoading}
            disabled={!confirm || deleteTagIsLoading}>
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
