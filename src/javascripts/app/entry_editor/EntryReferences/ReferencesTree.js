import React, { useContext, useMemo, useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import { List, ListItem } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import ReferenceCard from './ReferenceCard';
import { track } from 'analytics/Analytics';
import { ReferencesContext } from './ReferencesContext';
import { buildTreeOfReferences } from './referenceUtils';
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
  let maxLevelReached = false;

  const [initialized, setInitialized] = useState(false);

  const renderTreeNodes = (treeNodes) => {
    const toReferenceCard = (treeNodes) => {
      if (!Array.isArray(treeNodes) || !treeNodes.length) {
        return null;
      }

      return treeNodes.map((treeNode) => {
        const { entity, isCircular, level, key: entityIndexInTree, type } = treeNode;

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
          if (!isMoreCardRendered) {
            isMoreCardRendered = true;
            return <ReferenceCard key={entity.sys.id} isMoreCard />;
          }
          return null;
        }
        isMoreCardRendered = false;

        // deleted entity is still referenced
        if (type === 'Link') {
          return (
            <ReferenceCard
              entity={entity}
              key={`deleted-${entityIndexInTree}-${entity.sys.id}`}
              isUnresolved
            />
          );
        }

        // eslint-disable-next-line
        const nextLevelCards = renderTreeNodes(treeNode.children);

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
      });
    };

    const nextLevelReferenceCards = toReferenceCard(treeNodes);

    if (!nextLevelReferenceCards) {
      return null;
    }

    return (
      <ListItem className={styles.listItem}>
        <List className={styles.list}>{nextLevelReferenceCards}</List>
      </ListItem>
    );
  };

  const { circularReferenceCount, tree, entitiesPerLevel, selectionMap } = buildTreeOfReferences(
    root,
    {
      maxLevel,
      selectedStates,
      areAllReferencesSelected: allReferencesSelected,
    }
  );
  const depth = entitiesPerLevel.length;
  const referenceCards = renderTreeNodes(tree.root.children);

  if (!initialized) {
    setInitialEntities(selectionMap);
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
        // TODO: remove slice if we want to display the amount of references, including those that may be > maxLevel levels deeper
        // (and hence not seen in the tree, as they are hidden under + More card)
        value: entitiesPerLevel.slice(0, maxLevel).reduce((a, b) => a + b, 0),
      });
    },
    [dispatch, maxLevel]
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
        // TODO: rename to setSelectedReferences or setSelectedEntities
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
