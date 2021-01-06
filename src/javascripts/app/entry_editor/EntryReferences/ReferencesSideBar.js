import React, { useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import { isEqual, uniqWith, uniqueId } from 'lodash';
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
import { getReleasesFeatureVariation as releasesPCFeatureVariation } from 'app/Releases/ReleasesFeatureFlag';
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
import { getReferencesForEntryId, validateEntities, publishEntities } from './referencesService';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';
import { FLAGS, getVariation } from 'LaunchDarkly';
import { publishBulkAction } from './BulkAction/BulkActionService';

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

const mapEntities = (entities) =>
  uniqWith(
    entities.map((entity) => ({
      sys: {
        id: entity.sys.id,
        linkType: entity.sys.type,
        type: 'Link',
      },
    })),
    isEqual
  );

const SELECTED_ENTITIES_LIMIT = 200;

const ReferencesSideBar = ({ entityTitle, entity }) => {
  const { state: referencesState, dispatch } = useContext(ReferencesContext);
  const { references, selectedEntities, isTooComplex, initialReferencesAmount } = referencesState;

  const [isReleaseDialogShown, setReleaseDialogShown] = useState(false);
  const [isAddToReleaseEnabled, setisAddToReleaseEnabled] = useState(false);
  const [isBulkActionSupportEnabled, setIsBulkActionSupportEnabled] = useState(false);

  // TODO check if it's actually `currentEnvironmentAliasId`
  const { currentSpaceId: spaceId, currentEnvironmentId: environmentId } = useSpaceEnvContext();

  useEffect(() => {
    (async function () {
      const addToReleaseEnabled = await releasesPCFeatureVariation(spaceId);
      const bulkActionEnabled = await getVariation(FLAGS.REFERENCE_TREE_BULK_ACTIONS_SUPPORT, {
        spaceId,
        environmentId,
      });

      setisAddToReleaseEnabled(addToReleaseEnabled);
      setIsBulkActionSupportEnabled(bulkActionEnabled);
    })();
  });

  const displayValidation = (validationResponse) => {
    dispatch({ type: SET_VALIDATIONS, value: validationResponse });

    validationResponse.errored.length
      ? Notification.error('Some references did not pass validation')
      : Notification.success('All references passed validation');
  };

  const handleValidation = () => {
    dispatch({ type: SET_PROCESSING_ACTION, value: 'Validating' });

    track(trackingEvents.validate, {
      entity_id: entity.sys.id,
      references_count: selectedEntities.length,
    });

    const entitiesToValidate = mapEntities(selectedEntities);

    validateEntities({ entities: entitiesToValidate, action: 'publish' })
      .then((validationResponse) => {
        dispatch({ type: SET_PROCESSING_ACTION, value: null });
        displayValidation(validationResponse);
      })
      .catch((_error) => {
        dispatch({ type: SET_PROCESSING_ACTION, value: null });
        Notification.error('References validation failed');
      });
  };

  const getReferencesForEntry = () => {
    return getReferencesForEntryId(entity.sys.id)
      .then(({ resolved: fetchedRefs }) => dispatch({ type: SET_REFERENCES, value: fetchedRefs }))
      .then(() => {
        dispatch({ type: SET_REFERENCE_TREE_KEY, value: uniqueId('id_') });
      });
  };

  const publishSuccessMessage = () => {
    return createSuccessMessage({
      selectedEntities,
      root: references[0],
      entityTitle,
      action: 'publish',
    });
  };

  const publishErrorMessage = () => {
    return createErrorMessage({
      selectedEntities,
      root: references[0],
      entityTitle,
      action: 'publish',
    });
  };

  const handlePublication = async () => {
    dispatch({ type: SET_VALIDATIONS, value: null });
    dispatch({ type: SET_PROCESSING_ACTION, value: 'Publishing' });
    track(trackingEvents.publish, {
      entity_id: entity.sys.id,
      references_count: selectedEntities.length,
    });

    try {
      if (isBulkActionSupportEnabled) {
        await publishBulkAction(selectedEntities);
      } else {
        const entitiesToPublish = mapEntities(selectedEntities);
        publishEntities({ entities: entitiesToPublish, action: 'publish' });
      }

      // After publishing
      dispatch({ type: SET_PROCESSING_ACTION, value: null });
      getReferencesForEntry();

      Notification.success(publishSuccessMessage());
    } catch (error) {
      dispatch({ type: SET_PROCESSING_ACTION, value: null });

      if (error.statusCode && error.statusCode === 422) {
        const errored = error.data.details.errors;
        if (errored.length && errored[0].sys) {
          return displayValidation({ errored });
        }
      }

      Notification.error(publishErrorMessage());
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
      {isAddToReleaseEnabled && (
        <Button
          testId="addReferencesToReleaseBtn"
          buttonType="muted"
          className={styles.spacingTop}
          isFullWidth
          disabled={disableButton}
          onClick={handleAddToRelease}>
          Add to a release
        </Button>
      )}
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
