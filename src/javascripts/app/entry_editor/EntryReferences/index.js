import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import { isEqual, uniqWith, uniqueId, get } from 'lodash';
import {
  Button,
  Note,
  Notification,
  Checkbox,
  Dropdown,
  DropdownList,
  DropdownListItem,
  SkeletonContainer,
  SkeletonText,
  Paragraph,
  HelpText,
} from '@contentful/forma-36-react-components';
import { track } from 'analytics/Analytics';
import tokens from '@contentful/forma-36-tokens';
import ErrorHandler from 'components/shared/ErrorHandlerComponent.js';
import { create } from 'access_control/EntityPermissions';
import { goToSlideInEntity, slideInStackEmitter } from 'navigation/SlideInNavigator';
import ReferencesTree from './ReferencesTree';
import LoadingOverlay from './LoadingOverlay';
import {
  getReferencesForEntryId,
  getEntityTitle,
  getDefaultLocale,
  validateEntities,
  publishEntities,
} from './referencesService';
import {
  createSuccessMessage,
  createErrorMessage,
  doesContainRoot,
  pluralize,
  createCountMessage,
} from './utils';

const MAX_LEVEL = 10;

const styles = {
  validationButton: css({
    marginRight: tokens.spacingM,
    marginBottom: tokens.spacingM,
  }),
  tooComplexNote: css({
    marginBottom: tokens.spacingM,
  }),
  actionsWrapper: css({
    display: 'flex',
    alignItems: 'baseline',
    marginBottom: tokens.spacingM,
    '& > p': {
      paddingLeft: tokens.spacingM,
    },
  }),
  actionsButton: css({
    marginLeft: 'auto',
  }),
  selectAll: css({
    '& > span': {
      paddingLeft: '5px !important',
    },
  }),
  selectAllCB: css({
    pointerEvents: 'none',
  }),
  paragraph: css({
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

export const hasLinks = (obj) => {
  let linksFound = false;
  Object.keys(obj).forEach((key) => {
    if (
      (key === 'type' && obj[key] === 'Link') ||
      (key === 'nodeType' && obj[key] === 'embedded-entry-block') ||
      (key === 'nodeType' && obj[key] === 'embedded-asset-block') ||
      (key === 'nodeType' && obj[key] === 'embedded-entry-inline') ||
      (key === 'nodeType' && obj[key] === 'entry-hyperlink')
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

const ReferencesTab = ({ entity }) => {
  const [defaultLocale, setDefaultLocale] = useState('');
  const [references, setReferences] = useState([]);
  const [linksCounter, setLinksCounter] = useState({});
  const [selectedEntities, setSelectedEntities] = useState([]);
  const [validations, setValidations] = useState(null);
  const [isTooComplex, setIsTooComplex] = useState(false);
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [processingAction, setProcessingAction] = useState(null);
  const [isActionsDisabled, setActionsDisabled] = useState(false);
  const [allReferencesSelected, setAllReferencesSelected] = useState(true);
  const [entityTitle, setEntityTitle] = useState(null);
  const [referenceTreeKey, setReferenceTreeKey] = useState(uniqueId('id_'));
  const [isTreeMaxDepthReached, setIsTreeMaxDepthReached] = useState(false);

  useEffect(() => {
    async function fetchDefaultLocale() {
      const defaultLocale = await getDefaultLocale();
      setDefaultLocale(defaultLocale.internal_code);
    }

    async function fetchReferences() {
      const { resolved: fetchedRefs, response } = await getReferencesForEntryId(entity.sys.id);
      setReferences(fetchedRefs);
      setLinksCounter({
        assets: get(response, 'includes.Asset.length') || 0,
        entries: get(response, 'includes.Entry.length') || 0,
      });
      return fetchedRefs;
    }

    async function fetchReferencesAndTitle() {
      try {
        const fetchedRefs = await fetchReferences();
        const entryTitle = await getEntityTitle(fetchedRefs[0]);
        setEntityTitle(entryTitle);
      } catch {
        setIsTooComplex(true);
      }
    }

    fetchDefaultLocale();
    fetchReferencesAndTitle();

    slideInStackEmitter.on('changed', ({ newSlideLevel }) => {
      if (newSlideLevel === 0) {
        fetchReferencesAndTitle().then(() => {
          setReferenceTreeKey(uniqueId('id_'));
        });
      }
    });
  }, [entity]);

  if (entity.sys.type === 'Asset' || !hasLinks(entity.fields)) {
    return null;
  }

  const handleReferenceCardClick = (entity) => {
    goToSlideInEntity({ type: entity.sys.type, id: entity.sys.id });
  };

  const displayValidation = (validationResponse) => {
    setValidations(validationResponse);
    setReferenceTreeKey(uniqueId('id_'));

    validationResponse.errored.length
      ? Notification.error('Some references did not pass validation')
      : Notification.success('All references passed validation');
  };

  const handleValidation = () => {
    setDropdownOpen(false);
    setProcessingAction('Validating');

    track(trackingEvents.validate, {
      entity_id: entity.sys.id,
      references_count: selectedEntities.length,
    });

    const entitiesToValidate = mapEntities(selectedEntities);

    validateEntities({ entities: entitiesToValidate, action: 'publish' })
      .then((validationResponse) => {
        setProcessingAction(null);
        displayValidation(validationResponse);
      })
      .catch((_error) => {
        setProcessingAction(null);
        Notification.error('References validation failed');
      });
  };

  const handlePublication = () => {
    setDropdownOpen(false);
    setValidations(null);
    setProcessingAction('Publishing');

    track(trackingEvents.publish, {
      entity_id: entity.sys.id,
      references_count: selectedEntities.length,
    });

    const entitiesToPublish = mapEntities(selectedEntities);

    publishEntities({ entities: entitiesToPublish, action: 'publish' })
      .then(() => {
        setProcessingAction(null);
        getReferencesForEntryId(entity.sys.id)
          .then(({ resolved: fetchedRefs }) => setReferences(fetchedRefs))
          .then(() => {
            setReferenceTreeKey(uniqueId('id_'));

            Notification.success(
              createSuccessMessage({
                selectedEntities: entitiesToPublish,
                root: references[0],
                entityTitle,
              })
            );
          });
      })
      .catch((error) => {
        setProcessingAction(null);
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

  const showPublishButtons = !!references.length && create(references[0].sys).can('publish');

  return (
    <>
      <ErrorHandler
        renderOnError={
          <Note noteType="negative">
            Sorry, we are unable to show the references for this entry at this time
          </Note>
        }>
        {processingAction && (
          <LoadingOverlay
            actionName={processingAction}
            entityTitle={doesContainRoot(selectedEntities, references[0]) ? entityTitle : null}
            referencesAmount={
              doesContainRoot(selectedEntities, references[0])
                ? selectedEntities.length - 1
                : selectedEntities.length
            }
          />
        )}
        <div>
          {!!references.length && (
            <>
              {isTreeMaxDepthReached && (
                <Note noteType="warning" className={styles.paragraph}>
                  This entry may contain more references. We are only able to return references up
                  to {MAX_LEVEL} levels deep.
                </Note>
              )}
              <Paragraph className={styles.paragraph}>
                &quot;{entityTitle}&quot; has {''}
                {linksCounter.entries + linksCounter.assets}{' '}
                {pluralize(linksCounter.entries + linksCounter.assets, 'reference')} (
                {linksCounter.entries} {pluralize(linksCounter.entries, 'entry')}
                {' and '}
                {linksCounter.assets} {pluralize(linksCounter.assets, 'asset')})
              </Paragraph>
            </>
          )}
          {showPublishButtons && (
            <div className={styles.actionsWrapper}>
              <Button
                size="small"
                buttonType="muted"
                testId="selectAllReferences"
                className={styles.selectAll}
                onClick={() => {
                  setAllReferencesSelected(!allReferencesSelected);
                  setReferenceTreeKey(uniqueId('id_'));
                }}>
                <Checkbox
                  className={styles.selectAllCB}
                  labelText={
                    allReferencesSelected ? 'All references selected' : 'No references selected'
                  }
                  checked={allReferencesSelected}
                />
                Select all
              </Button>
              {selectedEntities.length ? (
                <Paragraph>
                  {createCountMessage({ selectedEntities, root: references[0] })}
                </Paragraph>
              ) : (
                <HelpText>None selected</HelpText>
              )}
              <Dropdown
                isOpen={isDropdownOpen}
                className={styles.actionsButton}
                onClose={() => setDropdownOpen(false)}
                position="bottom-right"
                toggleElement={
                  <Button
                    size="small"
                    indicateDropdown
                    testId="referencesActionDropdown"
                    disabled={isActionsDisabled}
                    buttonType="primary"
                    onClick={() => setDropdownOpen(!isDropdownOpen)}>
                    Actions
                  </Button>
                }>
                <DropdownList>
                  <DropdownListItem testId="publishReferencesBtn" onClick={handlePublication}>
                    Publish
                  </DropdownListItem>
                  <DropdownListItem testId="validateReferencesBtn" onClick={handleValidation}>
                    Validate
                  </DropdownListItem>
                </DropdownList>
              </Dropdown>
            </div>
          )}

          {isTooComplex ? (
            <Note noteType="negative" className={styles.tooComplexNote}>
              We are currently unable to display the references for this entry. This may mean that
              this entry has hit the current limit of more than 100 references or there is a
              temporary system error. We are currently rolling out this feature and are actively
              working on improving this.
            </Note>
          ) : references.length ? (
            <ReferencesTree
              root={references[0]}
              key={referenceTreeKey}
              defaultLocale={defaultLocale}
              validations={validations}
              onSelectEntities={(entities) => {
                setSelectedEntities(entities);
                setActionsDisabled(!entities.length);
              }}
              maxLevel={MAX_LEVEL}
              allReferencesSelected={allReferencesSelected}
              onReferenceCardClick={handleReferenceCardClick}
              setIsTreeMaxDepthReached={setIsTreeMaxDepthReached}
            />
          ) : (
            <SkeletonContainer
              svgWidth={700}
              svgHeight={300}
              ariaLabel="Loading entry references ...">
              <SkeletonText width={700} />
              <SkeletonText offsetTop={30} offsetLeft={50} width={650} />
              <SkeletonText offsetTop={60} offsetLeft={100} width={600} />
              <SkeletonText offsetTop={90} offsetLeft={150} width={550} />
              <SkeletonText offsetTop={120} offsetLeft={50} width={650} />
              <SkeletonText offsetTop={150} offsetLeft={100} width={600} />
              <SkeletonText offsetTop={180} offsetLeft={150} width={550} />
              <SkeletonText offsetTop={210} offsetLeft={200} width={500} />
              <SkeletonText offsetTop={240} offsetLeft={250} width={450} />
            </SkeletonContainer>
          )}
        </div>
      </ErrorHandler>
    </>
  );
};

ReferencesTab.propTypes = {
  entity: PropTypes.object.isRequired,
};

export default ReferencesTab;
