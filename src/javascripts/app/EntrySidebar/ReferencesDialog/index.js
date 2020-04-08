import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
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
import tokens from '@contentful/forma-36-tokens';
import ErrorHandler from 'components/shared/ErrorHandlerComponent.js';
import { goToSlideInEntity } from 'navigation/SlideInNavigator';
import ReferencesTree from './ReferencesTree';
import ValidationNote from './ValidationNote';
import {
  getReferencesForEntryId,
  getDefaultLocale,
  validateEntities,
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

const ReferencesDialog = ({ entity }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [defaultLocale, setDefaultLocale] = useState('');
  const [references, setReferences] = useState([]);
  const [selectedEntities, setSelectedEntites] = useState([]);
  const [validations, setValidations] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isTooComplex, setIsTooComplex] = useState(false);

  const maxLevel = 5;

  useEffect(() => {
    async function getFeatureFlagVariation() {
      const isFeatureEnabled = await getCurrentVariation(ALL_REFERENCES_DIALOG);
      setIsEnabled(isFeatureEnabled);
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

  const fetchReferencesAndOpenModal = async () => {
    try {
      const fetchedRefs = await getReferencesForEntryId(entity.sys.id);
      setReferences(fetchedRefs);
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
    setIsTooComplex(false);
  };

  const handleReferenceCardClick = (entity) => {
    goToSlideInEntity({ type: entity.sys.type, id: entity.sys.id });
    closeModal();
  };

  const handleValidation = () => {
    setIsValidating(true);

    const entitiesToValidate = selectedEntities.map((entity) => ({
      sys: {
        id: entity.sys.id,
        linkType: entity.sys.type,
        type: 'Link',
      },
    }));

    validateEntities({ entities: entitiesToValidate, action: 'publish' })
      .then((validationResponse) => {
        setIsValidating(false);
        setValidations(validationResponse);
      })
      .catch((_error) => {
        setIsValidating(false);
        Notification.error('References validation failed');
      });
  };

  return (
    <>
      <Subheading className="entity-sidebar__heading">Validate references</Subheading>
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
            title="Validate References"
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
                        key={validations}
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
                <Modal.Controls>
                  <ValidationNote validations={validations} />
                  <Button
                    className={styles.validationButton}
                    buttonType="positive"
                    data-test-id="validateReferencesBtn"
                    onClick={handleValidation}
                    loading={isValidating}>
                    Validate all
                  </Button>
                </Modal.Controls>
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
