import React, { useCallback, useMemo } from 'react';
import { cloneDeep } from 'lodash';
import { useHistoryReducer } from 'features/content-tags/core/hooks/useHistoryReducer';
import { orderByLabel } from 'features/content-tags/editor/utils';

type TagRecordState = { value: string; occurrence: number; label: string };
type TagRecordStateWithChangeType = TagRecordState & { changeType: string };
type State = Map<string, TagRecordState>;

type RenderState = {
  tags: Array<TagRecordStateWithChangeType>;
  newTags: Array<TagRecordStateWithChangeType>;
};

type BulkTaggingContext = {
  hasChanges: boolean;
  push: (state: State) => void;
  back: () => void;
  forward: () => void;
  currentState: State | null;
  renderState: RenderState;
  tagRemove: (tag: string) => void;
  tagApplyToAll: (tag: string, occurrence: number) => void;
  tagAdd: (tag: TagRecordState) => void;
  tagReset: (tag: string) => void;
};

export const CHANGE_TYPE = {
  NONE: 'NONE',
  REMOVED: 'REMOVED',
  ALL: 'ALL',
  NEW: 'NEW',
};

export const BulkTagging = React.createContext({} as BulkTaggingContext);

export const BulkTaggingProvider: React.FC = ({ children }) => {
  const [{ present, past }, dispatch] = useHistoryReducer<State>();

  const currentState = useMemo(() => {
    return present as State;
  }, [present]);

  const initialState = useMemo(() => {
    return (past.length > 0 ? past[0] : present) as State;
  }, [present, past]);

  const push = useCallback(
    (pushState: State) => {
      if (pushState) {
        dispatch({ type: 'push', state: pushState });
      }
    },
    [dispatch]
  );

  const back = useCallback(() => {
    dispatch({ type: 'back' });
  }, [dispatch]);

  const forward = useCallback(() => {
    dispatch({ type: 'forward' });
  }, [dispatch]);

  const getChangeType = useCallback(
    (tag: string): string => {
      if (past.length === 0) {
        return CHANGE_TYPE.NONE;
      }
      const initialEntry = initialState.get(tag);
      const currentEntry = currentState.get(tag);

      if (initialEntry && !currentEntry) {
        return CHANGE_TYPE.REMOVED;
      }

      if (!initialEntry && currentEntry) {
        return CHANGE_TYPE.NEW;
      }

      if (initialEntry!.occurrence < currentEntry!.occurrence) {
        return CHANGE_TYPE.ALL;
      }

      if (initialEntry!.occurrence > 0 && currentEntry!.occurrence === 0) {
        return CHANGE_TYPE.REMOVED;
      }

      return CHANGE_TYPE.NONE;
    },
    [currentState, initialState, past.length]
  );

  const renderState = useMemo(() => {
    const initialResult: RenderState = { tags: [], newTags: [] };

    if (!currentState) {
      return initialResult;
    }

    const states = Array.from(currentState.values()).reduce<RenderState>((result, tagState) => {
      const entry = {
        ...tagState,
        changeType: getChangeType(tagState.value),
      } as TagRecordStateWithChangeType;
      if (initialState.has(tagState.value)) {
        result.tags.push(entry);
      } else {
        result.newTags.push(entry);
      }
      return result;
    }, initialResult);

    states.tags = orderByLabel(states.tags);
    states.newTags = orderByLabel(states.newTags);

    return states;
  }, [currentState, initialState, getChangeType]);

  const tagRemove = (tag: string): void => {
    const newState = cloneDeep(currentState);
    if (initialState.has(tag)) {
      newState.get(tag)!.occurrence = 0;
    } else {
      newState.delete(tag);
    }
    push(newState);
  };

  const tagApplyToAll = (tag: string, occurrence: number): void => {
    const newState = cloneDeep(currentState);
    newState.set(tag, { ...newState.get(tag), occurrence } as TagRecordStateWithChangeType);
    push(newState);
  };
  const tagAdd = (tag: TagRecordState): void => {
    const newState = cloneDeep(currentState);
    newState.set(tag.value, tag);
    push(newState);
  };
  const tagReset = (tag: string): void => {
    const newState = cloneDeep(currentState);
    newState.set(tag, cloneDeep(initialState.get(tag)) as TagRecordStateWithChangeType);
    push(newState);
  };

  const hasChanges =
    renderState.newTags.length !== 0 ||
    renderState.tags.some((tag) => tag.changeType !== CHANGE_TYPE.NONE);

  return (
    <BulkTagging.Provider
      value={{
        hasChanges,
        renderState,
        currentState,
        push,
        back,
        forward,
        tagAdd,
        tagApplyToAll,
        tagRemove,
        tagReset,
      }}>
      {children}
    </BulkTagging.Provider>
  );
};

export const useBulkTaggingProvider = (): BulkTaggingContext => React.useContext(BulkTagging);
