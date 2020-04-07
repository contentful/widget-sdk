import { useState, useEffect } from 'react';
import { pick } from 'lodash';
const useSelectedEntities = ({ entities }) => {
  const [selectedObject, setSelected] = useState({});

  useEffect(() => {
    setSelected((oldVal) => {
      return pick(
        oldVal,
        entities.map((entity) => entity.getId())
      );
    });
  }, [entities]);

  const selected = Object.values(selectedObject);
  const allSelected = Boolean(entities.length > 0 && entities.length === selected.length);

  const clearSelected = () => setSelected({});
  const setAllSelected = () => {
    const allEntities = entities.reduce(
      (acc, entity) => ({ ...acc, [entity.getId()]: entity }),
      {}
    );
    setSelected(allEntities);
  };
  const isSelected = (entity) => {
    return Boolean(selectedObject[entity.getId()]);
  };

  const toggleSelected = (entity) =>
    setSelected((oldVal) => {
      const entityId = entity.getId();
      if (isSelected(entity)) {
        return Object.entries(oldVal).reduce((acc, [id, entity]) => {
          if (id === entityId) return acc;
          return { ...acc, [id]: entity };
        }, {});
      } else {
        return { ...oldVal, [entityId]: entity };
      }
    });

  const toggleAllSelected = () => {
    if (allSelected) {
      clearSelected();
    } else {
      setAllSelected();
    }
  };

  return [
    {
      selected,
      allSelected,
    },
    {
      isSelected,
      clearSelected,
      toggleSelected,
      toggleAllSelected,
    },
  ];
};

export default useSelectedEntities;
