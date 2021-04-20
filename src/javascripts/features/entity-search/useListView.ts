import { useMemo, useRef, useCallback } from 'react';
import { createListViewPersistor } from './ListViewPersistor';
import { assign, noop } from 'lodash';
import { useContentTypes, useSpaceEnvContext } from 'core/services/SpaceEnvContext';
import { getAvailableDisplayFields } from 'features/entity-views';

export type View = Record<string, any>;
export type ViewCallback = (view: View) => void;

export const useListView = ({
  entityType,
  onUpdate = noop,
}: {
  entityType: 'asset' | 'entry';
  onUpdate: ViewCallback;
}) => {
  const { currentEnvironmentId, currentSpaceId } = useSpaceEnvContext();
  const { currentSpaceContentTypes: contentTypes } = useContentTypes();

  const viewPersistor = useMemo(
    () =>
      createListViewPersistor({
        entityType,
        environmentId: currentEnvironmentId as string,
        spaceId: currentSpaceId,
      }),
    [entityType, currentEnvironmentId, currentSpaceId]
  );

  const initial: View = viewPersistor.read();

  const ref = useRef(initial);
  const lastAction = useRef<string | undefined>();

  const updateRef = useCallback(
    (callback: ViewCallback, action: string) => {
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
    (view: View, callback: ViewCallback) => {
      assign(ref.current, view);
      updateRef(callback, 'assignView');
    },
    [updateRef]
  );

  const setView = useCallback(
    (view: View, callback: ViewCallback) => {
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

export type ListViewContext = ReturnType<typeof useListView>;
