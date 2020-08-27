import { useState, useCallback, useEffect } from 'react';
import { selectionMapToEntities, extendSelectionMap, toSelectionMap } from './utils';

const Operations = {
  SELECT: 'select',
  DESELECT: 'deselect',
};

/*
  Handles exposes an api for the entity selection
  Keeps the state of a selection as a map of key-value tuples,
  where key is an entity id, while value is boolean, indicating if the entity was selected
*/
export const useSelection = ({ entities, multipleSelection }) => {
  const [selectionMap, setSelectionMap] = useState(toSelectionMap(entities));
  const [lastToggled, setLastToggled] = useState({});

  useEffect(() => {
    setSelectionMap((currentSelectionMap) =>
      extendSelectionMap(currentSelectionMap, toSelectionMap(entities))
    );
  }, [entities]);

  const isSelected = useCallback(
    (entity) => {
      if (!entity?.sys?.id) {
        return false;
      }
      return Boolean(selectionMap[entity.sys.id]);
    },
    [selectionMap]
  );

  const getSelectedEntities = useCallback(() => selectionMapToEntities(selectionMap, entities), [
    selectionMap,
    entities,
  ]);

  const toggle = useCallback(
    (entity, operation) => {
      const batchOfEntities = Array.isArray(entity) ? entity : [entity];
      const shouldBeSelected = operation === Operations.SELECT ? true : false;
      const toggledSubsetForBatch = batchOfEntities.reduce(
        (acc, e) => ({ ...acc, [e.sys.id]: shouldBeSelected }),
        {}
      );

      const updatedSelectionMap = { ...selectionMap, ...toggledSubsetForBatch };
      setSelectionMap(updatedSelectionMap);
      return updatedSelectionMap;
    },
    [selectionMap]
  );

  const toggleSelection = useCallback(
    (entity, entityIndex) => {
      let updatedSelectionMap;

      if (!multipleSelection) {
        if (Array.isArray(entity)) {
          throw new Error('Attempted to select multiple entities with multiSelection: false');
        }
        updatedSelectionMap = toggle(
          entity,
          isSelected(entity) ? Operations.DESELECT : Operations.SELECT
        );
      } else {
        let operation;
        if (Array.isArray(entity)) {
          operation = lastToggled.operation || Operations.SELECT;
          updatedSelectionMap = toggle(entity, operation);
          // mainly for tests
          if (document?.getSelection) {
            document.getSelection().removeAllRanges();
          }
        } else {
          operation = isSelected(entity) ? Operations.DESELECT : Operations.SELECT;
          updatedSelectionMap = toggle(entity, operation);
        }
        setLastToggled({ entity, operation, index: entityIndex });
      }
      return selectionMapToEntities(updatedSelectionMap, entities);
    },
    [lastToggled, toggle, multipleSelection, isSelected, entities]
  );

  return {
    lastToggledIndex: lastToggled.index,
    toggle: toggleSelection,
    isSelected,
    getSelectedEntities,
  };
};
