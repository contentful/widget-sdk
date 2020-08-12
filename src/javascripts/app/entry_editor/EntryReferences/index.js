import React, { useState, useEffect, useContext } from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import { uniqueId, get, isObject } from 'lodash';
import {
  Button,
  Note,
  Checkbox,
  SkeletonContainer,
  SkeletonText,
  Paragraph,
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import ErrorHandler from 'components/shared/ErrorHandlerComponent.js';
import { create } from 'access_control/EntityPermissions';
import { goToSlideInEntity, slideInStackEmitter } from 'navigation/SlideInNavigator';
import ReferencesTree from './ReferencesTree';
import { getReferencesForEntryId, getEntityTitle, getDefaultLocale } from './referencesService';
import { pluralize } from './utils';

import { ReferencesContext } from './ReferencesContext';
import {
  SET_REFERENCES,
  SET_LINKS_COUNTER,
  SET_MAX_DEPTH_REACHED,
  SET_REFERENCE_TREE_KEY,
  SET_IS_TOO_COMPLEX,
} from './state/actions';

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
    } else if (isObject(obj[key]) && !linksFound) {
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
  const [allReferencesSelected, setAllReferencesSelected] = useState(true);
  const [entityTitle, setEntityTitle] = useState(null);
  const { state: referencesState, dispatch } = useContext(ReferencesContext);
  const {
    references,
    validations,
    isTreeMaxDepthReached,
    initialReferencesAmount,
    referenceTreeKey,
    isTooComplex,
  } = referencesState;

  const defaultLocale = getDefaultLocale().code;

  useEffect(() => {
    async function fetchReferences() {
      const { resolved: fetchedRefs, response } = await getReferencesForEntryId(entity.sys.id);
      dispatch({ type: SET_REFERENCES, value: fetchedRefs });
      dispatch({
        type: SET_LINKS_COUNTER,
        value: {
          assets: get(response, 'includes.Asset.length') || 0,
          entries: get(response, 'includes.Entry.length') || 0,
        },
      });

      return fetchedRefs;
    }

    async function fetchReferencesAndTitle() {
      try {
        const fetchedRefs = await fetchReferences();
        const entryTitle = await getEntityTitle(fetchedRefs[0]);
        setEntityTitle(entryTitle);
      } catch {
        dispatch({ type: SET_IS_TOO_COMPLEX, value: true });
      }
    }

    fetchReferencesAndTitle();

    slideInStackEmitter.on('changed', ({ newSlideLevel }) => {
      if (newSlideLevel === 0) {
        fetchReferencesAndTitle().then(() => {
          dispatch({ type: SET_REFERENCE_TREE_KEY, value: uniqueId('id_') });
        });
      }
    });
  }, [entity, dispatch]);

  if (entity.sys.type === 'Asset' || !hasLinks(entity.fields)) {
    return null;
  }

  const handleReferenceCardClick = (entity) => {
    goToSlideInEntity({ type: entity.sys.type, id: entity.sys.id });
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
                {initialReferencesAmount - 1} {pluralize(initialReferencesAmount - 1, 'reference')}
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
                  dispatch({ type: SET_REFERENCE_TREE_KEY, value: uniqueId('id_') });
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
            </div>
          )}

          {isTooComplex ? (
            <Note noteType="negative" className={styles.tooComplexNote}>
              We are currently unable to display the references for this entry. This may mean that
              this entry has hit the current limit of more than 200 references or there is a
              temporary system error. We are currently rolling out this feature and are actively
              working on improving this.
            </Note>
          ) : references.length ? (
            <ReferencesTree
              root={references[0]}
              key={referenceTreeKey}
              defaultLocale={defaultLocale}
              validations={validations}
              maxLevel={MAX_LEVEL}
              allReferencesSelected={allReferencesSelected}
              onReferenceCardClick={handleReferenceCardClick}
              setIsTreeMaxDepthReached={(value) => {
                dispatch({ type: SET_MAX_DEPTH_REACHED, value });
              }}
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
