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
import { getSpaceFeature, SpaceFeatures, DEFAULT_FEATURES_STATUS } from 'data/CMA/ProductCatalog';
import { useAsync } from 'core/hooks';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';
import { Conditional } from 'features/content-tags/core/components/Conditional';

const styles = {
  controlsPanel: css({ display: 'flex', marginTop: tokens.spacingL }),
  marginLeftM: css({ marginLeft: tokens.spacingM }),
  marginM: css({ marginTop: tokens.spacingM, marginBottom: tokens.spacingM }),
};

const FORM_RESET = 'FORM_RESET';
const FORM_FIRST_CONFIRM_CHANGED = 'FORM_FIRST_CONFIRM_CHANGED';
const FORM_FIRST_CONFIRM_TOUCHED = 'FORM_FIRST_CONFIRM_TOUCHED';
const FORM_INITIAL_STATE = {
  firstConfirm: false,
  firstConfirmTouched: false,
};

const reducer = (state, action) => {
  switch (action.type) {
    case FORM_FIRST_CONFIRM_CHANGED:
      return { ...state, firstConfirm: action.payload };
    case FORM_FIRST_CONFIRM_TOUCHED:
      return { ...state, firstConfirmTouched: action.payload };
    case FORM_RESET:
      return FORM_INITIAL_STATE;
  }
};

function DeleteTagModal({ tag, isShown, onClose }) {
  const [{ firstConfirm, firstConfirmTouched }, dispatch] = useReducer(reducer, FORM_INITIAL_STATE);
  const { reset } = useReadTags();

  const { currentSpaceId: spaceId } = useSpaceEnvContext();

  const hasCustomRolesFeatureCheck = useCallback(async () => {
    return await getSpaceFeature(
      spaceId,
      SpaceFeatures.CUSTOM_ROLES_FEATURE,
      DEFAULT_FEATURES_STATUS.CUSTOM_ROLES_FEATURE
    );
  }, [spaceId]);

  const { data: hasCustomRolesFeature } = useAsync(hasCustomRolesFeatureCheck);

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
      if (
        deleteTagError.code === 'ActionPreconditionsFailed' &&
        deleteTagError.data?.details?.errors?.some((error) => error.name === 'reference')
      ) {
        Notification.error('Remove the tag from all entries and assets before deleting it.', {
          title: "Can't delete tag because it is currently in use.",
          cta: {
            label: 'Learn more about this in our help center.',
            textLinkProps: {
              href: 'https://www.contentful.com/help/deleting-tags/',
            },
          },
        });
      } else {
        Notification.error(`Error deleting tag.`);
      }
      resetDeleteTag();
    }
  }, [deleteTagError, resetDeleteTag]);

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

  if (!tag) {
    return null;
  }

  return (
    <Modal
      testId={'delete-tag-modal'}
      title={`Delete tag "${tag.name}"`}
      isShown={isShown}
      onClose={close}>
      <Conditional condition={hasCustomRolesFeature}>
        <>
          <Note noteType="negative" title="This may have big implications for permissions">
            Tag &quot;{tag.name}&quot; may be used to define access for a custom role in this space.
          </Note>
          <Paragraph className={styles.marginM}>Check to confirm:</Paragraph>
          <Form spacing={'condensed'} testId={'delete-tag-modal-form'}>
            <FieldGroup>
              <CheckboxField
                testId="delete-tag-modal-first-confirm-field"
                type="checkbox"
                inputProps={{ testId: 'delete-tag-modal-first-confirm-input' }}
                labelText={`Make "${tag.name}" unavailable for all roles`}
                helpText={`Users with roles that are defined using "${tag.name}" could gain or lose access to content tagged with this tag`}
                validationMessage={
                  firstConfirmTouched && !firstConfirm ? 'Check to confirm deletion' : null
                }
                checked={firstConfirm}
                value="yes"
                onChange={onChangeFirst}
                id="optInFirst"
              />
            </FieldGroup>
            <div className={styles.controlsPanel}>
              <Button
                testId="delete-tag-modal-submit"
                onClick={onSubmit}
                type="submit"
                buttonType="negative"
                loading={deleteTagIsLoading}
                disabled={!firstConfirm || deleteTagIsLoading}>
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
        </>
      </Conditional>
      <Conditional condition={!hasCustomRolesFeature}>
        <>
          <Paragraph>Are you sure you want to delete this tag?</Paragraph>
          <div className={styles.controlsPanel}>
            <Button
              testId="delete-tag-modal-submit"
              onClick={onSubmit}
              type="submit"
              buttonType="negative"
              loading={deleteTagIsLoading}
              disabled={deleteTagIsLoading}>
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
        </>
      </Conditional>
    </Modal>
  );
}

DeleteTagModal.propTypes = {
  tag: PropTypes.shape(TagPropType),
  isShown: PropTypes.bool,
  onClose: PropTypes.func,
};

export { DeleteTagModal };
