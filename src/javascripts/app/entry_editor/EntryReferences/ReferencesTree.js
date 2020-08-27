import React, { useContext, useMemo, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { get } from 'lodash';
import { css } from 'emotion';
import { List, ListItem } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import ReferenceCard from './ReferenceCard';
import { track } from 'analytics/Analytics';
import { ReferencesContext } from './ReferencesContext';
import {
  SET_SELECTED_ENTITIES,
  SET_ACTIONS_DISABLED,
  SET_INITIAL_REFERENCES_AMOUNT,
} from './state/actions';

const styles = {
  description: css({
    marginBottom: tokens.spacingM,
  }),
  list: css({
    marginLeft: 20,
  }),
  listItem: css({
    position: 'relative',
    '&:not(:last-child):before': {
      content: '""',
      position: 'absolute',
      borderLeft: `1px solid ${tokens.colorElementMid}`,
      height: 'calc(100% + 10px)',
      left: '-10px',
      top: '-40px',
      zIndex: '-1',
    },
  }),
  parentList: css({
    paddingBottom: tokens.spacingM,
    overflowY: 'scroll',
    '& > li': {
      '&:first-child:before, &:first-child:after': {
        display: 'none',
      },
    },
  }),
};

// If there is a circular reference that is not handled this will keep us from endless.
const failsaveLevel = 10;

const trackingEvents = {
  dialogOpen: 'entry_references:dialog_open',
};

const findValidationErrorForEntity = (entityId, validations) => {
  if (!validations) {
    return null;
  }

  if (!validations.errored) {
    return null;
  }
  const errored = validations.errored.find((errored) => errored.sys.id === entityId);
  return errored ? errored.error.message : null;
};

function ReferenceCards({
  root,
  allReferencesSelected,
  maxLevel,
  defaultLocale,
  validations,
  onReferenceCardClick,
  setIsTreeMaxDepthReached,
  setInitialEntities,
  handleSelect,
  setInitialReferenceAmount,
}) {
  let isMoreCardRendered = false;
  let depth = 0;
  let circularReferenceCount = 0;
  let maxLevelReached = false;
  const [initialized, setInitialized] = useState(false);
  const entitiesPerLevel = [];
  const visitedEntities = { 0: [root.sys.id] };
  const initialSelectedEntities = [];

  const toReferenceCard = (entity, level, entityIndexInTree) => {
    if (level === maxLevel) {
      maxLevelReached = true;
    }
    /**
     * if level > than maxLevel we still want to
     * know the max depth of the client's reference
     * tree so we continue the recursion without
     * returning a reference card
     */
    if (level > maxLevel) {
      // eslint-disable-next-line
      renderLayer(entity, level + 1, entityIndexInTree);
      if (!isMoreCardRendered) {
        isMoreCardRendered = true;
        return <ReferenceCard key={entity.sys.id} isMoreCard />;
      }
      return null;
    }
    isMoreCardRendered = false;

    // deleted entity is still referenced
    if (entity.sys.type === 'Link') {
      return (
        <ReferenceCard
          entity={entity}
          key={`deleted-${entityIndexInTree}-${entity.sys.id}`}
          isUnresolved
        />
      );
    }

    // eslint-disable-next-line
    const nextLevelCards = renderLayer(entity, level + 1, entityIndexInTree);
    const isCircular =
      visitedEntities[entityIndexInTree].filter((entityId) => entityId === entity.sys.id).length >
      1;

    return (
      <React.Fragment key={`container-${entityIndexInTree}-${entity.sys.id}`}>
        <ReferenceCard
          key={`entity-${entityIndexInTree}-${entity.sys.id}`}
          entity={entity}
          onClick={onReferenceCardClick}
          isCircular={isCircular}
          validationError={findValidationErrorForEntity(entity.sys.id, validations)}
          isReferenceSelected={allReferencesSelected}
          onReferenceCheckboxClick={(checked, entity) => handleSelect(checked, entity)}
        />
        {/* recursevly get all cards for the entitiy fields */}
        {nextLevelCards}
      </React.Fragment>
    );
  };

  const renderLayer = (entity, level, entityIndexInTree) => {
    if (level > depth) {
      depth = level;
    }

    const { fields } = entity;

    // TODO: revisit the indexing to have items rendered on the correct layer
    const levelIndex = level - 1;
    entitiesPerLevel[levelIndex] = entitiesPerLevel[levelIndex]
      ? entitiesPerLevel[levelIndex] + 1
      : 1;

    if (allReferencesSelected) {
      initialSelectedEntities.push(entity);
    }

    if (!fields || level > failsaveLevel) {
      return null;
    }

    if (entityIndexInTree !== 0 && visitedEntities[entityIndexInTree].includes(entity.sys.id)) {
      circularReferenceCount++;
      return null;
    } else {
      if (entity.sys.id) {
        visitedEntities[entityIndexInTree].push(entity.sys.id);
      }
    }

    const nextLevelReferenceCards = Object.entries(fields).reduce(
      (allCards, [_, fieldValue], fieldIndex) => {
        const localizedFieldValue = fieldValue[defaultLocale];
        // if field is an array of entities
        if (Array.isArray(localizedFieldValue) && localizedFieldValue.every((value) => value.sys)) {
          return allCards.concat(
            localizedFieldValue.map((entity, index) => {
              const nextEntityIndexInTree = `${entityIndexInTree}.${fieldIndex}.${index}`;
              visitedEntities[nextEntityIndexInTree] = [...visitedEntities[entityIndexInTree]];
              return toReferenceCard(entity, level, nextEntityIndexInTree);
            })
          );
          // if rich text field
        } else if (Array.isArray(get(localizedFieldValue, 'content'))) {
          const getReferenceCardsFromContent = (content, parentIndex) => {
            // embedded-entry-inline is inside the nodeType paragraph, for example, so we first go depth first
            const entityContentToReferenceCards = (entity, entityIndex) =>
              Array.isArray(entity.content) && entity.content.length
                ? getReferenceCardsFromContent(entity.content, entityIndex)
                : [];
            return content.reduce((acc, entity, index) => {
              if (
                [
                  'embedded-asset-block',
                  'embedded-entry-block',
                  'embedded-entry-inline',
                  'entry-hyperlink',
                ].includes(entity.nodeType)
              ) {
                const entityPayload = entity.data.target;
                const nextEntityIndexInTree = `${parentIndex}.${fieldIndex}.${index}`;
                visitedEntities[nextEntityIndexInTree] = [...visitedEntities[parentIndex]];
                return [
                  ...acc,
                  ...entityContentToReferenceCards(entity, nextEntityIndexInTree),
                  toReferenceCard(entityPayload, level, nextEntityIndexInTree),
                ];
              } else {
                const nextEntityIndexInTree = `${parentIndex}.${fieldIndex}.${index}`;
                visitedEntities[nextEntityIndexInTree] = [...visitedEntities[parentIndex]];
                // if current node is not one of the embedded cards, we merge parsed child ref cards
                // (possibly an empty array)
                return acc.concat(entityContentToReferenceCards(entity, nextEntityIndexInTree));
              }
            }, []);
          };

          return allCards.concat(
            getReferenceCardsFromContent(localizedFieldValue.content, entityIndexInTree)
          );
          // if plain entity
        } else if (get(localizedFieldValue, 'sys')) {
          const nextEntityIndexInTree = `${entityIndexInTree}.${fieldIndex}`;
          visitedEntities[nextEntityIndexInTree] = [...visitedEntities[entityIndexInTree]];

          return [...allCards, toReferenceCard(localizedFieldValue, level, nextEntityIndexInTree)];
        }
        // otherwise, skip
        return allCards;
      },
      []
    );

    if (!nextLevelReferenceCards.length) {
      return null;
    }

    return (
      <ListItem className={styles.listItem}>
        <List className={styles.list}>{nextLevelReferenceCards}</List>
      </ListItem>
    );
  };

  const level = 1;
  const parentIndexInTree = 0;
  const referenceCards = renderLayer(root, level, parentIndexInTree);

  if (!initialized) {
    setInitialEntities(initialSelectedEntities);
    setInitialReferenceAmount(entitiesPerLevel);
    setInitialized(true);
    if (maxLevelReached) {
      setIsTreeMaxDepthReached(true);
    }
  }

  track(trackingEvents.dialogOpen, {
    entity_id: root.sys.id,
    references_depth: depth,
    references_per_level: entitiesPerLevel,
    circular_references_count: circularReferenceCount,
  });

  return referenceCards;
}

const ReferencesTree = ({
  validations,
  allReferencesSelected,
  onSelectEntities,
  setIsTreeMaxDepthReached,
  maxLevel,
  onReferenceCardClick,
  defaultLocale,
  onRootReferenceCardClick,
}) => {
  const { state: referencesState, dispatch } = useContext(ReferencesContext);
  const root = referencesState.references[0];

  const handleSelect = useCallback(
    (selected, selectedEntity) => {
      const selectedEntities = selected
        ? [...referencesState.selectedEntities, selectedEntity]
        : referencesState.selectedEntities.filter(
            (entity) => entity.sys.id !== selectedEntity.sys.id
          );
      dispatch({
        type: SET_SELECTED_ENTITIES,
        value: selectedEntities,
      });
      dispatch({ type: SET_ACTIONS_DISABLED, value: !selectedEntities.length });
    },
    [dispatch, referencesState.selectedEntities]
  );

  const setInitialEntities = useCallback(
    (selectedEntities) => {
      dispatch({ type: SET_SELECTED_ENTITIES, value: selectedEntities });
      dispatch({ type: SET_ACTIONS_DISABLED, value: !selectedEntities.length });
    },
    [dispatch]
  );

  const setInitialReferenceAmount = useCallback(
    (entitiesPerLevel) => {
      dispatch({
        type: SET_INITIAL_REFERENCES_AMOUNT,
        value: entitiesPerLevel.reduce((a, b) => a + b, 0),
      });
    },
    [dispatch]
  );

  const MemoizedReferencesCards = useMemo(
    () => (
      <ReferenceCards
        root={root}
        allReferencesSelected={allReferencesSelected}
        maxLevel={maxLevel}
        defaultLocale={defaultLocale}
        validations={validations}
        onReferenceCardClick={onReferenceCardClick}
        onSelectEntities={onSelectEntities}
        setIsTreeMaxDepthReached={setIsTreeMaxDepthReached}
        handleSelect={handleSelect}
        setInitialEntities={setInitialEntities}
        setInitialReferenceAmount={setInitialReferenceAmount}
      />
    ),
    [
      allReferencesSelected,
      maxLevel,
      defaultLocale,
      validations,
      onReferenceCardClick,
      onSelectEntities,
      setIsTreeMaxDepthReached,
      handleSelect,
      setInitialEntities,
      root,
      setInitialReferenceAmount,
    ]
  );

  return (
    <List className={styles.parentList} testId="referenceTreeList">
      <ReferenceCard
        entity={root}
        isReferenceSelected={allReferencesSelected}
        onReferenceCheckboxClick={(checked, entity) => handleSelect(checked, entity)}
        onClick={onRootReferenceCardClick}
        validationError={findValidationErrorForEntity(root.sys.id, validations)}
      />
      {MemoizedReferencesCards}
    </List>
  );
};

ReferencesTree.propTypes = {
  defaultLocale: PropTypes.string,
  maxLevel: PropTypes.number,
  allReferencesSelected: PropTypes.bool,
  validations: PropTypes.shape({
    errored: PropTypes.arrayOf(
      PropTypes.shape({
        sys: PropTypes.shape({
          type: PropTypes.string,
          linkType: PropTypes.string,
          id: PropTypes.string,
        }),
        error: PropTypes.shape({
          message: PropTypes.string,
        }),
      })
    ),
  }),
  onReferenceCardClick: PropTypes.func.isRequired,
  onSelectEntities: PropTypes.func,
  setIsTreeMaxDepthReached: PropTypes.func,
  onRootReferenceCardClick: PropTypes.func,
};

ReferencesTree.defaultProps = {
  maxLevel: 5,
  onSelectEntities: () => {},
  setIsTreeMaxDepthReached: () => {},
};

export default ReferencesTree;
