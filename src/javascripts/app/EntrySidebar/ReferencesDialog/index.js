import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import { isEqual, uniqWith, uniqueId } from 'lodash';
import { getCurrentVariation } from 'utils/LaunchDarkly';
import { ALL_REFERENCES_DIALOG } from 'featureFlags';
import {
  Modal,
  Button,
  Icon,
  Note,
  Subheading,
  Notification,
} from '@contentful/forma-36-react-components';
import { track } from 'analytics/Analytics';
import tokens from '@contentful/forma-36-tokens';
import ErrorHandler from 'components/shared/ErrorHandlerComponent.js';
import { create } from 'access_control/EntityPermissions';
import { goToSlideInEntity } from 'navigation/SlideInNavigator';
import ReferencesTree from './ReferencesTree';
import ValidationNote from './ValidationNote';
import PublicationNote from './PublicationNote';
import {
  getReferencesForEntryId,
  getEntityTitle,
  getDefaultLocale,
  validateEntities,
  publishEntities,
} from './referencesDialogService';

const styles = {
  dialogButton: css({
    display: 'flex',
    alignItems: 'center',
  }),
  validationButton: css({
    marginTop: tokens.spacingXs,
  }),
  modalContent: css({
    overflowY: 'hidden',
    paddingBottom: '0px',
    display: 'flex',
    position: 'relative',
    flexDirection: 'column',
    '&:after': {
      content: '""',
      height: '40px',
      width: '100%',
      background: 'linear-gradient(to bottom,rgba(255,255,255,0) 0%,rgba(255,255,255,1) 100%)',
      marginBottom: '-10px',
      position: 'absolute',
      bottom: '0px',
      left: '0px',
    },
  }),
  icon: css({
    marginRight: tokens.spacing2Xs,
  }),
  buttonWrapper: css({
    margin: `${tokens.spacingM} 0`,
  }),
  maxLevelWarning: css({
    marginTop: tokens.spacingM,
  }),
  tooComplexNote: css({
    marginBottom: tokens.spacingM,
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

const ReferencesDialog = ({ entity }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [defaultLocale, setDefaultLocale] = useState('');
  const [references, setReferences] = useState([]);
  const [selectedEntities, setSelectedEntites] = useState([]);
  const [validations, setValidations] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isTooComplex, setIsTooComplex] = useState(false);
  const [published, setPublished] = useState(null);
  const [entityTitle, setEntityTitle] = useState(null);
  const [referenceTreeKey, setReferenceTreeKey] = useState(uniqueId('id_'));

  const maxLevel = 5;

  const hasLinks = (obj) => {
    let linksFound = false;
    Object.keys(obj).forEach((key) => {
      if (
        (key === 'type' && obj[key] === 'Link') ||
        (key === 'nodeType' && 'embedded-entry-block') ||
        (key === 'nodeType' && 'embedded-asset-block') ||
        (key === 'nodeType' && 'embedded-entry-inline') ||
        (key === 'nodeType' && 'entry-hyperlink')
      ) {
        linksFound = true;
      } else if (typeof obj[key] === 'object' && !linksFound) {
        linksFound = hasLinks(obj[key]);
      } else if (Array.isArray(obj[key]) && !linksFound) {
        obj[key].forEach((value) => {
          linksFound = hasLinks(value);
        });
      }
    });
    return linksFound;
  };

  useEffect(() => {
    async function getFeatureFlagVariation() {
      let isFeatureEnabled = false;
      try {
        isFeatureEnabled = await getCurrentVariation(ALL_REFERENCES_DIALOG);
      } finally {
        setIsEnabled(isFeatureEnabled);
      }
    }
    getFeatureFlagVariation();

    async function fetchDefaultLocale() {
      const defaultLocale = await getDefaultLocale();
      setDefaultLocale(defaultLocale.internal_code);
    }
    if (isEnabled) {
      fetchDefaultLocale();
    }
  }, [entity, isEnabled]);

  if (!isEnabled || entity.sys.type === 'Asset') {
    return null;
  }

  const fetchReferences = () =>
    getReferencesForEntryId(entity.sys.id).then((fetchedRefs) => {
      setReferences(fetchedRefs);
      return fetchedRefs;
    });

  const fetchReferencesAndOpenModal = async () => {
    try {
      const fetchedRefs = await fetchReferences();
      const entryTitle = await getEntityTitle(fetchedRefs[0]);
      setEntityTitle(entryTitle);
    } catch {
      setIsTooComplex(true);
    }

    setIsOpen(true);
    setIsLoading(false);
  };

  const closeModal = () => {
    setIsOpen(false);
    setReferences([]);
    setValidations(null);
    setPublished(null);
    setIsTooComplex(false);
  };

  const handleReferenceCardClick = (entity) => {
    goToSlideInEntity({ type: entity.sys.type, id: entity.sys.id });
    closeModal();
  };

  const handleValidation = () => {
    setIsValidating(true);
    setPublished(null);

    track(trackingEvents.validate, {
      entity_id: entity.sys.id,
      references_count: selectedEntities.length,
    });

    const entitiesToValidate = mapEntities(selectedEntities);

    validateEntities({ entities: entitiesToValidate, action: 'publish' })
      .then((validationResponse) => {
        setIsValidating(false);
        setValidations(validationResponse);
        setReferenceTreeKey(uniqueId('id_'));
      })
      .catch((_error) => {
        setIsValidating(false);
        Notification.error('References validation failed');
      });
  };

  const handlePublication = () => {
    setIsPublishing(true);
    setPublished(null);

    track(trackingEvents.publish, {
      entity_id: entity.sys.id,
      references_count: selectedEntities.length,
    });

    const entitiesToValidate = mapEntities(selectedEntities);

    publishEntities({ entities: entitiesToValidate, action: 'publish' })
      .then(() => {
        setIsPublishing(false);
        fetchReferences().then(() => {
          setPublished({ succeed: true });
          setReferenceTreeKey(uniqueId('id_'));
        });
      })
      .catch((error) => {
        setIsPublishing(false);
        /**
         * Separate validation resonse from failure response
         */
        if (error.statusCode && error.statusCode === 422) {
          const errored = error.data.details.errors;
          /**
           * Permisson errors have a different shape without sys
           */
          if (errored.length && errored[0].sys) {
            setValidations({ errored });
          }
        } else {
          setPublished({ succeed: false });
        }
        Notification.error('References publication failed');
      });
  };

  if (!hasLinks(entity.fields)) {
    return null;
  }
  return (
    <>
      <Subheading className="entity-sidebar__heading">References</Subheading>
      <ErrorHandler
        renderOnError={
          <Note noteType="negative">
            Sorry, we are unable to show the references for this entry at this time
          </Note>
        }>
        <div>
          <Button
            isFullWidth
            loading={isLoading}
            onClick={() => {
              setIsLoading(true);
              fetchReferencesAndOpenModal();
            }}
            data-test-id="referencesBtn"
            buttonType="muted">
            <span className={styles.dialogButton}>
              <Icon icon="Filter" className={styles.icon} color="secondary" />
              View all references
            </span>
          </Button>
          <Modal
            isShown={isOpen}
            shouldCloseOnEscapePress
            shouldCloseOnOverlayClick
            title="All References"
            onClose={closeModal}>
            {({ title, onClose }) => (
              <>
                <Modal.Header title={title} onClose={onClose} />
                <Modal.Content className={styles.modalContent}>
                  {isTooComplex ? (
                    <Note noteType="negative" className={styles.tooComplexNote}>
                      At the moment we are unable to handle the reference complexity for this entry
                    </Note>
                  ) : (
                    references.length && (
                      <ReferencesTree
                        root={references[0]}
                        key={referenceTreeKey}
                        defaultLocale={defaultLocale}
                        validations={validations}
                        onSelectEntities={(entities) => setSelectedEntites(entities)}
                        setIsDialogOpen={onClose}
                        maxLevel={maxLevel}
                        onReferenceCardClick={handleReferenceCardClick}
                      />
                    )
                  )}
                </Modal.Content>
                {references.length && create(references[0].sys).can('publish') && (
                  <Modal.Controls>
                    <ValidationNote validations={validations} />
                    <PublicationNote
                      publications={published}
                      entityTitle={entityTitle}
                      referencesCount={selectedEntities.length - 1}
                    />
                    <Button
                      className={styles.validationButton}
                      buttonType="positive"
                      data-test-id="publishReferencesBtn"
                      onClick={handlePublication}
                      loading={isPublishing}>
                      Publish all
                    </Button>
                    <Button
                      className={styles.validationButton}
                      buttonType="muted"
                      data-test-id="validateReferencesBtn"
                      onClick={handleValidation}
                      loading={isValidating}>
                      Validate all
                    </Button>
                  </Modal.Controls>
                )}
              </>
            )}
          </Modal>
        </div>
      </ErrorHandler>
    </>
  );
};

ReferencesDialog.propTypes = {
  entity: PropTypes.object.isRequired,
};

export default ReferencesDialog;
