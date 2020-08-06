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
} from '@contentful/forma-36-react-components';
import { create } from 'access_control/EntityPermissions';
import { track } from 'analytics/Analytics';
import { ReferencesContext } from 'app/entry_editor/EntryReferences/ReferencesContext';
import ReleasesWidgetDialog from 'app/Releases/ReleasesWidget/ReleasesWidgetDialog';
import { getReleasesFeatureVariation as releasesFeatureFlagVariation } from 'app/Releases/ReleasesFeatureFlag';
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

const styles = {
  sideBarWrapper: css({
    padding: tokens.spacingM,
  }),
  buttons: css({
    marginTop: tokens.spacingM,
  }),
  paragraph: css({
    marginTop: tokens.spacingM,
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

const ReferencesSideBar = ({ entityTitle, entity }) => {
  const { state: referencesState, dispatch } = useContext(ReferencesContext);
  const { references, selectedEntities, isTooComplex } = referencesState;
  const [isRelaseDialogShown, setRelaseDialogShown] = useState(false);
  const [isAddToReleaseEnabled, setisAddToReleaseEnabled] = useState(false);

  useEffect(() => {
    async function addToReleaseEnabled() {
      const isAddToReleaseEnabled = await releasesFeatureFlagVariation();
      setisAddToReleaseEnabled(isAddToReleaseEnabled);
    }

    addToReleaseEnabled();
  });

  const displayValidation = (validationResponse) => {
    dispatch({ type: SET_VALIDATIONS, value: validationResponse });
    dispatch({ type: SET_REFERENCE_TREE_KEY, value: uniqueId('id_') });

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

  const handlePublication = () => {
    dispatch({ type: SET_VALIDATIONS, value: null });
    dispatch({ type: SET_PROCESSING_ACTION, value: 'Publishing' });
    track(trackingEvents.publish, {
      entity_id: entity.sys.id,
      references_count: selectedEntities.length,
    });

    const entitiesToPublish = mapEntities(selectedEntities);

    publishEntities({ entities: entitiesToPublish, action: 'publish' })
      .then(() => {
        dispatch({ type: SET_PROCESSING_ACTION, value: null });
        getReferencesForEntryId(entity.sys.id)
          .then(({ resolved: fetchedRefs }) =>
            dispatch({ type: SET_REFERENCES, value: fetchedRefs })
          )
          .then(() => {
            dispatch({ type: SET_REFERENCE_TREE_KEY, value: uniqueId('id_') });

            Notification.success(
              createSuccessMessage({
                selectedEntities,
                root: references[0],
                entityTitle,
              })
            );
          });
      })
      .catch((error) => {
        dispatch({ type: SET_PROCESSING_ACTION, value: null });
        /**
         * Separate validation resonse from failure response.
         * Permisson errors have a different shape (without sys).
         */
        if (error.statusCode && error.statusCode === 422) {
          const errored = error.data.details.errors;
          if (errored.length && errored[0].sys) {
            return displayValidation({ errored });
          }
        }
        Notification.error(
          createErrorMessage({
            selectedEntities,
            root: references[0],
            entityTitle,
            action: 'publish',
          })
        );
      });
  };

  const handleAddToRelease = () => {
    setRelaseDialogShown(true);
  };

  const showPublishButtons = !!references.length && create(references[0].sys).can('publish');

  const disableButton = !showPublishButtons || isTooComplex;

  return (
    <div className={styles.sideBarWrapper}>
      <header className="entity-sidebar__header">
        <Subheading className="entity-sidebar__heading">References</Subheading>
      </header>
      <div>Apply actions to all selected references</div>
      {!isTooComplex ? (
        selectedEntities.length ? (
          <Paragraph className={styles.paragraph}>
            {createCountMessage({ entityTitle, selectedEntities, root: references[0] })}
          </Paragraph>
        ) : (
          <HelpText>None selected</HelpText>
        )
      ) : null}
      <Button
        testId="publishReferencesBtn"
        buttonType="positive"
        className={styles.buttons}
        isFullWidth
        disabled={disableButton}
        onClick={handlePublication}>
        Publish all
      </Button>
      <Button
        testId="validateReferencesBtn"
        buttonType="muted"
        className={styles.buttons}
        isFullWidth
        disabled={disableButton}
        onClick={handleValidation}>
        Validate all
      </Button>
      {isAddToReleaseEnabled && (
        <Button
          testId="add-to-release"
          buttonType="muted"
          className={styles.buttons}
          isFullWidth
          disabled={disableButton}
          onClick={handleAddToRelease}>
          Add to a release
        </Button>
      )}
      {isRelaseDialogShown && (
        <ReleasesWidgetDialog
          rootEntity={entity}
          selectedEntities={selectedEntities}
          releaseContentTitle={createAddToReleaseDialogContent(
            entityTitle,
            selectedEntities,
            references[0]
          )}
          onCancel={() => setRelaseDialogShown(false)}
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
