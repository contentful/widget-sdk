import { useState, useCallback } from 'react';
import { uniqBy } from 'lodash';

const Operations = {
  SELECT: 'select',
  DESELECT: 'deselect',
};

/*
  Handles exposes an api for the entity selection
*/
export const useSelection = ({ multipleSelection }) => {
  const [selectedEntities, setSelectedEntities] = useState([]);
  const [lastToggled, setLastToggled] = useState({});

  const isSelected = useCallback(
    (entity) => {
      if (!entity?.sys?.id) {
        return false;
      }
      return Boolean(
        selectedEntities.find((selectedEntity) => selectedEntity.sys.id === entity.sys.id)
      );
    },
    [selectedEntities]
  );

  const toggle = useCallback(
    (entity, operation) => {
      const batchOfEntities = Array.isArray(entity) ? entity : [entity];
      const shouldBeSelected = operation === Operations.SELECT ? true : false;

      let updatedArrayOfSelectedEntities;

      if (shouldBeSelected) {
        updatedArrayOfSelectedEntities = uniqBy(
          [...selectedEntities, ...batchOfEntities],
          (entity) => entity.sys.id
        );
      } else {
        const idsToDeselect = batchOfEntities.map((entity) => entity.sys.id);
        updatedArrayOfSelectedEntities = selectedEntities.filter(
          (entity) => !idsToDeselect.includes(entity.sys.id)
        );
      }

      setSelectedEntities(updatedArrayOfSelectedEntities);

      return updatedArrayOfSelectedEntities;
    },
    [selectedEntities]
  );

  const toggleSelection = useCallback(
    (entity, entityIndex) => {
      let updatedArrayOfSelectedEntities;

      if (!multipleSelection) {
        if (Array.isArray(entity)) {
          throw new Error('Attempted to select multiple entities with multiSelection: false');
        }
        updatedArrayOfSelectedEntities = toggle(
          entity,
          isSelected(entity) ? Operations.DESELECT : Operations.SELECT
        );
      } else {
        let operation;
        if (Array.isArray(entity)) {
          operation = lastToggled.operation || Operations.SELECT;
          updatedArrayOfSelectedEntities = toggle(entity, operation);
          // mainly for tests
          if (document?.getSelection) {
            document.getSelection().removeAllRanges();
          }
        } else {
          operation = isSelected(entity) ? Operations.DESELECT : Operations.SELECT;
          updatedArrayOfSelectedEntities = toggle(entity, operation);
        }
        setLastToggled({ entity, operation, index: entityIndex });
      }
      return updatedArrayOfSelectedEntities;
    },
    [lastToggled, toggle, multipleSelection, isSelected]
  );

  return {
    lastToggledIndex: lastToggled.index,
    toggle: toggleSelection,
    isSelected,
    selectedEntities,
  };
};
