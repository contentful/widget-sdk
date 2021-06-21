import React, { useState, useEffect, useContext, useCallback } from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import { uniqueId, get, isObject } from 'lodash';
import {
  Note,
  SkeletonContainer,
  SkeletonText,
  Paragraph,
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import ErrorHandler from 'components/shared/ErrorHandlerComponent.js';
import { create } from 'access_control/EntityPermissions';
import { goToSlideInEntity } from 'navigation/SlideInNavigator';
import ReferencesTree from './ReferencesTree';
import MultiSelect from './MultiSelect';
import { getReferencesForEntryId, getDefaultLocale } from './referencesService';
import { pluralize } from './utils';

import { ReferencesContext } from './ReferencesContext';
import {
  SET_REFERENCES,
  SET_LINKS_COUNTER,
  SET_MAX_DEPTH_REACHED,
  SET_REFERENCE_TREE_KEY,
  SET_IS_TOO_COMPLEX,
} from './state/actions';
import { REFERENCES_TREE_MAX_REF_NODES } from './referenceUtils';

const MAX_LEVEL = 10;

const styles = {
  validationButton: css({
    marginRight: tokens.spacingM,
    marginBottom: tokens.spacingM,
  }),
  note: css({
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

const selectStatusCheckboxList = [
  {
    label: 'Changed',
    name: 'changed',
    checked: false,
  },
  {
    label: 'Draft',
    name: 'draft',
    checked: false,
  },
  {
    label: 'Published',
    name: 'published',
    checked: false,
  },
];

const REFERENCES_LIMIT = 1000;

const SlicedResultSetNote = () => (
  <Note noteType="primary" className={styles.note}>
    For performance reasons we only display {REFERENCES_TREE_MAX_REF_NODES} references per level. We
    are currently rolling out this feature and are actively working on improving this.
  </Note>
);

const TooComplexNote = () => (
  <Note noteType="negative" className={styles.note}>
    We are currently unable to display the references for this entry. This may mean that this entry
    has hit the current limit of more than {REFERENCES_LIMIT} references or there is a temporary
    system error. We are currently rolling out this feature and are actively working on improving
    this.
  </Note>
);

const ReferencesTab = ({ entity, onRootReferenceCardClick }) => {
  const [allReferencesSelected, setAllReferencesSelected] = useState(false);
  const [selectedStates, setSelectedStates] = useState([]);
  const { state: referencesState, dispatch } = useContext(ReferencesContext);
  const {
    references,
    validations,
    isTreeMaxDepthReached,
    initialReferencesAmount,
    referenceTreeKey,
    isSliced,
    isTooComplex,
    selectedEntitiesMap,
    initialUniqueReferencesAmount,
  } = referencesState;

  const defaultLocale = getDefaultLocale().code;

  const fetchReferences = useCallback(async () => {
    try {
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
    } catch {
      dispatch({ type: SET_IS_TOO_COMPLEX, value: true });
    }
  }, [entity, dispatch]);

  useEffect(() => {
    (async () => fetchReferences())();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedEntitiesMapSize = selectedEntitiesMap ? selectedEntitiesMap.size : 0;

  useEffect(() => {
    if (initialUniqueReferencesAmount !== selectedEntitiesMapSize) {
      setAllReferencesSelected(false);
    }
  }, [initialUniqueReferencesAmount, selectedEntitiesMapSize]);

  if (entity.sys.type === 'Asset' || !hasLinks(entity.fields)) {
    return null;
  }

  const handleReferenceCardClick = (entity) => {
    goToSlideInEntity({ type: entity.sys.type, id: entity.sys.id });
  };

  const showPublishButtons = !!references.length && create(references[0]).can('publish');

  const handleSelectChange = (changeStatus) => {
    if (changeStatus.allSelected) {
      setAllReferencesSelected(changeStatus.allSelected);
    } else {
      const checkedStates = changeStatus.checkboxes.map((input) => {
        if (input.checked) {
          return input.name;
        }
      });
      setAllReferencesSelected(false);
      setSelectedStates(checkedStates);
    }
    dispatch({ type: SET_REFERENCE_TREE_KEY, value: uniqueId('id_') });
  };

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
                This entry has {''}
                {initialReferencesAmount} {pluralize(initialReferencesAmount, 'reference')}
              </Paragraph>
            </>
          )}
          {showPublishButtons && (
            <div className={styles.actionsWrapper}>
              <MultiSelect
                testId="selectAllReferences"
                onChange={handleSelectChange}
                checkboxList={selectStatusCheckboxList}
                selectAll={allReferencesSelected}
              />
            </div>
          )}
          {isSliced && !isTooComplex && <SlicedResultSetNote />}
          {isTooComplex ? (
            <TooComplexNote />
          ) : references.length ? (
            <ReferencesTree
              root={references[0]}
              key={referenceTreeKey}
              defaultLocale={defaultLocale}
              validations={validations}
              maxLevel={MAX_LEVEL}
              selectedStates={selectedStates}
              allReferencesSelected={allReferencesSelected}
              onRootReferenceCardClick={onRootReferenceCardClick}
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
  onRootReferenceCardClick: PropTypes.func,
};

export default ReferencesTab;
