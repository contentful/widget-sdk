import { useMemo, useEffect, useRef, useCallback } from 'react';
import { createListViewPersistor } from './ListViewPersistor';
import { assign, cloneDeep, set, isEmpty, noop } from 'lodash';

const createDummyViewPersistor = () => ({
  read: (initialState = {}) => initialState,
  saveKey: () => {},
  save: () => {},
});

export const useListView = ({ entityType, initialState, isPersisted, onUpdate = noop }) => {
  const viewPersistor = useMemo(
    () =>
      isPersisted
        ? createListViewPersistor({ entityType, isNative: true })
        : createDummyViewPersistor(),
    [entityType, isPersisted]
  );

  const initial = viewPersistor.read(initialState);

  const ref = useRef(initial);
  const setRef = useCallback(
    (values) => {
      ref.current = values;
      onUpdate(values);
    },
    [onUpdate]
  );

  useEffect(() => {
    !isEmpty(initialState) && setRef(initialState);
  }, [initialState, setRef]);

  const setViewKey = useCallback(
    (key, value, callback) => {
      viewPersistor.saveKey(key, value);
      const newState = set({}, key.split('.'), value);
      const updated = assign(cloneDeep(ref.current), newState);
      setRef(updated);
      callback?.(updated);
    },
    [viewPersistor, setRef]
  );

  const setViewAssigned = useCallback(
    (view, callback) => {
      const newView = assign({}, ref.current, view);
      viewPersistor.save(newView);
      setRef(newView);
      callback?.(newView);
    },
    [viewPersistor, setRef]
  );

  const setView = useCallback(
    (view, callback) => {
      viewPersistor.save(view);
      setRef(view);
      callback?.(view);
    },
    [viewPersistor, setRef]
  );

  const getDefaults = (view = {}) => {
    const defaultView = {
      searchFilters: [],
      contentTypeId: '',
      searchText: '',
      order: {},
    };
    return assign(defaultView, view);
  };

  const getView = () => getDefaults(ref.current || initial);

  return { setView, setViewAssigned, setViewKey, getView };
};
