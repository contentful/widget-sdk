import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import { uniqueId } from 'lodash';
import tokens from '@contentful/forma-36-tokens';
import {
  Button,
  Subheading,
  Paragraph,
  HelpText,
  Notification,
  Note,
  TextLink,
} from '@contentful/forma-36-react-components';
import { create } from 'access_control/EntityPermissions';
import { track } from 'analytics/Analytics';
import { ReferencesContext } from 'app/entry_editor/EntryReferences/ReferencesContext';
import ReleasesWidgetDialog from 'app/Releases/ReleasesWidget/ReleasesWidgetDialog';
import { IfAppInstalled } from 'features/contentful-apps';
import {
  createSuccessMessage,
  createErrorMessage,
  createCountMessage,
  createAddToReleaseDialogContent,
} from './utils';
import {
  SET_REFERENCES,
  SET_VALIDATIONS,
  SET_REFERENCE_TREE_KEY,
  SET_PROCESSING_ACTION,
} from './state/actions';
import { getReferencesForEntryId } from './referencesService';
import { createPublishBulkAction, createValidateBulkAction } from './BulkAction/BulkActionService';
import { BulkActionErrorMessage, convertBulkActionErrors } from './BulkAction/BulkActionError';

const styles = {
  sideBarWrapper: css({
    padding: tokens.spacingM,
    paddingTop: 0,
  }),
  spacingTop: css({
    marginTop: tokens.spacingM,
  }),
  subHeading: css({
    marginTop: 0,
    height: '56px',
    display: 'flex',
    alignItems: 'flex-end',
  }),
};

const trackingEvents = {
  publish: 'entry_references:publish',
  validate: 'entry_references:validate',
};

const SELECTED_ENTITIES_LIMIT = 200;

const ReferencesSideBar = ({ entityTitle, entity }) => {
  const { state: referencesState, dispatch } = useContext(ReferencesContext);
  const { references, selectedEntities, isTooComplex, initialReferencesAmount } = referencesState;

  const [isReleaseDialogShown, setReleaseDialogShown] = useState(false);

  const getReferencesForEntry = async () => {
    const { resolved } = await getReferencesForEntryId(entity.sys.id);
    dispatch({ type: SET_REFERENCES, value: resolved });
    dispatch({ type: SET_REFERENCE_TREE_KEY, value: uniqueId('id_') });
  };

  const handleError = (error, action = 'published') => {
    if (error.statusCode && error.statusCode === 429) {
      return Notification.error(BulkActionErrorMessage.RateLimitExceededError);
    }

    if (error.statusCode && error.data && error.data.details) {
      const errored = convertBulkActionErrors(error.data.details.errors);

      // Expected shape on ReferenceTree.js:L56
      dispatch({ type: SET_VALIDATIONS, value: errored });
      return Notification.error('Some references did not pass validation');
    }

    Notification.error(
      createErrorMessage({
        selectedEntities,
        root: references[0],
        entityTitle,
        action,
      })
    );
  };

  const handleValidation = async () => {
    dispatch({ type: SET_PROCESSING_ACTION, value: 'Validating' });
    track(trackingEvents.validate, {
      entity_id: entity.sys.id,
      references_count: selectedEntities.length,
    });

    try {
      await createValidateBulkAction(selectedEntities);
      dispatch({ type: SET_PROCESSING_ACTION, value: null });
      // Expected shape on ReferenceTree.js:L56
      // This resets the errored list in case a failed Validation ran before
      dispatch({ type: SET_VALIDATIONS, value: { errored: [] } });

      return Notification.success('All references passed validation');
    } catch (error) {
      dispatch({ type: SET_PROCESSING_ACTION, value: null });
      handleError(error, 'validate');
    }
  };

  const handlePublication = async () => {
    dispatch({ type: SET_VALIDATIONS, value: null });
    dispatch({ type: SET_PROCESSING_ACTION, value: 'Publishing' });
    track(trackingEvents.publish, {
      entity_id: entity.sys.id,
      references_count: selectedEntities.length,
    });

    try {
      await createPublishBulkAction(selectedEntities);

      dispatch({ type: SET_PROCESSING_ACTION, value: null });
      getReferencesForEntry();

      Notification.success(
        createSuccessMessage({ selectedEntities, root: references[0], entityTitle })
      );
    } catch (error) {
      dispatch({ type: SET_PROCESSING_ACTION, value: null });
      handleError(error, 'published');
    }
  };

  const handleAddToRelease = () => {
    setReleaseDialogShown(true);
  };

  const showPublishButtons = !!references.length && create(references[0]).can('publish');

  const isSelectedEntitesMoreThanLimit = selectedEntities.length > SELECTED_ENTITIES_LIMIT;
  const disableButton =
    !showPublishButtons ||
    isTooComplex ||
    !selectedEntities.length ||
    isSelectedEntitesMoreThanLimit;

  return (
    <div className={styles.sideBarWrapper}>
      <header className="entity-sidebar__header">
        <Subheading className={`entity-sidebar__heading ${styles.subHeading}`}>
          References
        </Subheading>
      </header>
      <Paragraph>Apply actions to all selected references</Paragraph>
      {!isTooComplex ? (
        selectedEntities.length ? (
          <Paragraph className={styles.spacingTop}>
            {createCountMessage({ entityTitle, selectedEntities, root: references[0] })}
          </Paragraph>
        ) : (
          <HelpText>None selected</HelpText>
        )
      ) : null}
      {isSelectedEntitesMoreThanLimit && (
        <Note noteType="warning" className={styles.spacingTop} testId="cf-ui-note-reference-limit">
          Currently only up to {SELECTED_ENTITIES_LIMIT} references can be acted on at a time.
          Alternatively you can select only the references you want to publish.
        </Note>
      )}
      <Button
        testId="publishReferencesBtn"
        buttonType="positive"
        className={styles.spacingTop}
        isFullWidth
        disabled={disableButton}
        onClick={handlePublication}>
        {selectedEntities.length !== initialReferencesAmount ? 'Publish selected' : 'Publish all'}
      </Button>
      <Button
        testId="validateReferencesBtn"
        buttonType="muted"
        className={styles.spacingTop}
        isFullWidth
        disabled={disableButton}
        onClick={handleValidation}>
        {selectedEntities.length !== initialReferencesAmount ? 'Validate selected' : 'Validate all'}
      </Button>
      <IfAppInstalled appId="launch">
        <Button
          testId="addReferencesToReleaseBtn"
          buttonType="muted"
          className={styles.spacingTop}
          isFullWidth
          disabled={disableButton}
          onClick={handleAddToRelease}>
          Add to a release
        </Button>
      </IfAppInstalled>
      <Note className={styles.spacingTop} testId="cf-ui-note-reference-docs">
        The reference view is a new feature that gathers every linked entry and asset for a
        particular entry in a single view allowing you to apply mass actions.
        <div>
          <TextLink
            target="_blank"
            rel="noopener noreferrer"
            href="https://www.contentful.com/help/reference-view/">
            Find out more
          </TextLink>
        </div>
      </Note>
      {isReleaseDialogShown && (
        <ReleasesWidgetDialog
          rootEntity={entity}
          selectedEntities={selectedEntities}
          releaseContentTitle={createAddToReleaseDialogContent(
            entityTitle,
            selectedEntities,
            references[0]
          )}
          onCancel={() => setReleaseDialogShown(false)}
        />
      )}
    </div>
  );
};

ReferencesSideBar.propTypes = {
  entity: PropTypes.object,
  entityTitle: PropTypes.string.isRequired,
};

export default ReferencesSideBar;
