import { useMemo, useEffect, useRef, useCallback } from 'react';
import { createListViewPersistor, getEntityKey, getDefaults } from './ListViewPersistor';
import { assign, isEmpty, noop } from 'lodash';

const createDummyViewPersistor = ({ entityType }) => {
  const defaults = getDefaults(getEntityKey(entityType));
  return {
    read: (initialState = {}) => ({ ...defaults, ...initialState }),
    saveKey: () => {},
    save: () => {},
  };
};

export const useListView = ({ entityType, initialState, isPersisted, onUpdate = noop }) => {
  const viewPersistor = useMemo(
    () =>
      isPersisted
        ? createListViewPersistor({ entityType, isNative: true })
        : createDummyViewPersistor({ entityType }),
    [entityType, isPersisted]
  );

  const initial = viewPersistor.read(initialState);

  const ref = useRef(initial);

  const updateRef = useCallback(
    (callback) => {
      viewPersistor.save(ref.current);
      callback?.(ref.current);
      onUpdate?.(ref.current);
    },
    [viewPersistor, onUpdate]
  );

  useEffect(() => {
    if (!isEmpty(initialState)) {
      ref.current = initialState;
      onUpdate?.(initialState);
    }
  }, [initialState, onUpdate]);

  const assignView = useCallback(
    (view, callback) => {
      assign(ref.current, view);
      updateRef(callback);
    },
    [updateRef]
  );

  const setView = useCallback(
    (view, callback) => {
      ref.current = view;
      updateRef(callback);
    },
    [updateRef]
  );

  const getView = () => ref.current;

  return { setView, assignView, getView };
};
