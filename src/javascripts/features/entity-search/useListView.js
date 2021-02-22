import { useMemo, useRef, useCallback } from 'react';
import { createListViewPersistor } from './ListViewPersistor';
import { assign, noop } from 'lodash';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';
import { getAvailableDisplayFields } from 'features/entity-views';

export const useListView = ({ entityType, onUpdate = noop }) => {
  const {
    currentSpaceContentTypes: contentTypes,
    currentEnvironmentId,
    currentSpaceId,
  } = useSpaceEnvContext();
  const viewPersistor = useMemo(
    () =>
      createListViewPersistor({
        entityType,
        environmentId: currentEnvironmentId,
        spaceId: currentSpaceId,
      }),
    [entityType, currentEnvironmentId, currentSpaceId]
  );

  const initial = viewPersistor.read();

  const ref = useRef(initial);
  const lastAction = useRef();

  const updateRef = useCallback(
    (callback, action) => {
      lastAction.current = action;
      viewPersistor.save(ref.current);
      callback?.(ref.current);
      onUpdate?.(ref.current);
    },
    [viewPersistor, onUpdate]
  );

  if (entityType === 'entry') {
    const { displayedFieldIds = [], contentTypeId } = ref.current;
    const fields = getAvailableDisplayFields(contentTypes, contentTypeId);

    ref.current.displayedFieldIds = displayedFieldIds?.reduce((acc, id) => {
      const displayField = fields.find((field) => field.id === id);
      if (displayField) return [...acc, id];
      return acc;
    }, []);
  }

  const assignView = useCallback(
    (view, callback) => {
      assign(ref.current, view);
      updateRef(callback, 'assignView');
    },
    [updateRef]
  );

  const setView = useCallback(
    (view, callback) => {
      ref.current = view;
      updateRef(callback, 'setView');
    },
    [updateRef]
  );

  const getView = () => ref.current;

  return {
    setView,
    assignView,
    getView,
    get lastAction() {
      return lastAction.current;
    },
  };
};
