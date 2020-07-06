import { useCallback } from 'react';
import { uniqBy } from 'lodash';
import {
  CHANGE_TYPE,
  useBulkTaggingProvider,
} from 'features/content-tags/editor/state/BulkTaggingProvider';
import { idList, tagLink } from 'features/content-tags/editor/utils';

function computeState({ tags, newTags }) {
  const state = tags.reduce(
    (result, tagState) => {
      switch (tagState.changeType) {
        case CHANGE_TYPE.ALL:
          result.all.push(tagLink(tagState.value));
          break;
        case CHANGE_TYPE.REMOVED:
          result.remove.push(tagState.value);
          break;
      }
      return result;
    },
    { all: [], remove: [] }
  );

  state.all = [...state.all, ...newTags.map((tag) => tagLink(tag.value))];
  return state;
}

function filterWithChanges(state) {
  const tagsToRemove = state.remove;
  const tagsToAdd = state.all ? idList(state.all) : [];
  return (entity) => {
    const currentTags = idList(entity.data.metadata.tags);
    return (
      tagsToAdd.some((tag) => !currentTags.includes(tag)) ||
      currentTags.some((tag) => tagsToRemove.includes(tag))
    );
  };
}

function transformEntities(entities, state) {
  return entities.filter(filterWithChanges(state)).map((entity) => {
    entity.data.metadata.tags = uniqBy(
      [
        ...entity.data.metadata.tags.filter((tag) => !state.remove.includes(tag.sys.id)),
        ...state.all,
      ],
      'sys.id'
    );
    return entity;
  });
}

function useComputeTags() {
  const { renderState } = useBulkTaggingProvider();

  const computedState = useCallback(() => {
    return computeState(renderState);
  }, [renderState])();

  const computeEntities = useCallback(
    (selectedEntities) => transformEntities(selectedEntities, computedState),
    [computedState]
  );

  return {
    computedState,
    computeEntities,
  };
}

export { useComputeTags, computeState, transformEntities };
