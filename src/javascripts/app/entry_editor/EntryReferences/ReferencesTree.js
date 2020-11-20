import React, { useContext, useMemo, useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import { List, ListItem } from '@contentful/forma-36-react-components';
import * as EntityState from 'data/CMA/EntityState';
import tokens from '@contentful/forma-36-tokens';
import ReferenceCard from './ReferenceCard';
import { track } from 'analytics/Analytics';
import { ReferencesContext } from './ReferencesContext';
import { getReferencesFromEntry } from './referenceUtils';
import {
  SET_SELECTED_ENTITIES,
  SET_SELECTED_ENTITIES_MAP,
  SET_ACTIONS_DISABLED,
  SET_INITIAL_REFERENCES_AMOUNT,
  SET_INITIAL_UNIQUE_REFERENCES_AMOUNT,
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
    listStyleType: 'none',
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
    overflowY: 'auto',
    paddingRight: tokens.spacingL,
    height: 'calc(100vh - 305px)',
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
  validations,
  onReferenceCardClick,
  setIsTreeMaxDepthReached,
  setInitialEntities,
  handleSelect,
  selectedStates,
  setInitialReferenceAmount,
}) {
  let isMoreCardRendered = false;
  let depth = 0;
  let circularReferenceCount = 0;
  let maxLevelReached = false;

  const [initialized, setInitialized] = useState(false);
  const entitiesPerLevel = [];
  const visitedEntities = { 0: [root.sys.id] };
  const initialSelectedEntitiesMap = new Map();

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
      initialSelectedEntitiesMap.set(`${entity.sys.id}-${entity.sys.type}`, entity);
    } else if (selectedStates && selectedStates.length > 0) {
      const stateName = EntityState.stateName(EntityState.getState(entity.sys));
      selectedStates.forEach((entityState) => {
        if (stateName === entityState) {
          initialSelectedEntitiesMap.set(`${entity.sys.id}-${entity.sys.type}`, entity);
        }
      });
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

    const nextLevelReferences = getReferencesFromEntry({ fields });

    const nextLevelReferenceCards = nextLevelReferences.reduce((allCards, entity, index) => {
      const nextEntityIndexInTree = `${entityIndexInTree}.${index}`;
      visitedEntities[nextEntityIndexInTree] = [...visitedEntities[entityIndexInTree]];

      allCards = [...allCards, toReferenceCard(entity, level, nextEntityIndexInTree)];
      return allCards;
    }, []);

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
    setInitialEntities(initialSelectedEntitiesMap);
    setInitialReferenceAmount(entitiesPerLevel);
    if (maxLevelReached) {
      setIsTreeMaxDepthReached(true);
    }
    track(trackingEvents.dialogOpen, {
      entity_id: root.sys.id,
      references_depth: depth,
      references_per_level: entitiesPerLevel,
      circular_references_count: circularReferenceCount,
    });
    setInitialized(true);
  }

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
  selectedStates,
  onRootReferenceCardClick,
}) => {
  const {
    state: { selectedEntitiesMap, references },
    dispatch,
  } = useContext(ReferencesContext);
  const root = references[0];

  const selectedEntities = (entitiesMap) => [...entitiesMap.values()];

  const handleSelect = useCallback(
    (selected, selectedEntity) => {
      const {
        sys: { id, type },
      } = selectedEntity;
      selected
        ? selectedEntitiesMap.set(`${id}-${type}`, selectedEntity)
        : selectedEntitiesMap.delete(`${id}-${type}`);

      dispatch({ type: SET_SELECTED_ENTITIES, value: selectedEntities(selectedEntitiesMap) });
      dispatch({ type: SET_ACTIONS_DISABLED, value: !selectedEntitiesMap.size });
    },
    [dispatch, selectedEntitiesMap]
  );

  const setInitialEntities = useCallback(
    (entitiesMap) => {
      dispatch({ type: SET_SELECTED_ENTITIES_MAP, value: entitiesMap });
      dispatch({ type: SET_SELECTED_ENTITIES, value: selectedEntities(entitiesMap) });
      dispatch({ type: SET_INITIAL_UNIQUE_REFERENCES_AMOUNT, value: entitiesMap.size });
      dispatch({ type: SET_ACTIONS_DISABLED, value: !entitiesMap.size });
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
        selectedStates={selectedStates}
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
      selectedStates,
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
  selectedStates: PropTypes.arrayOf(PropTypes.string),
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
