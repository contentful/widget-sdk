import { useState, useMemo, useEffect } from 'react';
import createViewPersistor from 'data/ListViewPersistor';
import { assign, cloneDeep, set, isEqual, isEmpty } from 'lodash';

const createDummyViewPersistor = () => ({
  read: (initialState = {}) => initialState,
  saveKey: () => {},
});

const useView = ({ entityType, initialState, isPersisted }) => {
  const viewPersistor = useMemo(
    () =>
      isPersisted
        ? createViewPersistor({ entityType, isNative: true })
        : createDummyViewPersistor(),
    [entityType, isPersisted]
  );

  const initial = viewPersistor.read(initialState);
  const [state, setState] = useState(initial);

  useEffect(() => {
    !isEmpty(initial) && !isEqual(initial, state) && setState(initial);
  }, [initial, state]);

  const setView = (key, value, callback) => {
    viewPersistor.saveKey(key, value);
    setState((prev) => {
      const newState = set({}, key.split('.'), value);
      const updated = assign(cloneDeep(prev), newState);
      callback && callback(updated);
      return updated;
    });
  };

  return [state, setView];
};

export default useView;
