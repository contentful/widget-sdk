import PropTypes from 'prop-types';
import * as React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { TagsSelection } from 'features/content-tags/editor/components/TagsSelection';
import { useIsInitialLoadingOfTags, useReadTags } from 'features/content-tags/core/hooks';
import { orderByLabel, tagsPayloadToValues } from 'features/content-tags/editor/utils';
import { SkeletonBodyText, SkeletonContainer } from '@contentful/forma-36-react-components';
import { TagSelectionHeader } from 'features/content-tags/editor/components/TagSelectionHeader';
import { FilteredTagsProvider } from 'features/content-tags';

function useLocalTags(tags, setTags) {
  const { data } = useReadTags();
  const [localTags, setLocalTags] = useState([]);

  useEffect(() => {
    const tagsIds = tags.map(({ sys: { id } }) => id) || [];
    const lTags = tagsPayloadToValues(data).filter((tag) => tagsIds.some((t) => t === tag.value));
    setLocalTags(orderByLabel(lTags));
  }, [tags, setLocalTags, data]);

  const addTag = useCallback(
    (tagId) => {
      setLocalTags((prevState) => {
        const nextState = orderByLabel([...prevState, tagId]);
        setTags(nextState.map(({ value }) => value));
        return nextState;
      });
    },
    [setLocalTags, setTags]
  );

  const removeTag = useCallback(
    (tagId) => {
      setLocalTags((prevState) => {
        const nextState = orderByLabel([...prevState.filter((tag) => tag.value !== tagId)]);
        setTags(nextState.map(({ value }) => value));
        return nextState;
      });
    },
    [setLocalTags, setTags]
  );

  return { localTags, removeTag, addTag };
}

const EditorTagsSkeleton = ({ disable, tags, setTags, showEmpty }) => {
  const { localTags, addTag, removeTag } = useLocalTags(tags, setTags);
  const isInitialLoad = useIsInitialLoadingOfTags();

  if (isInitialLoad) {
    return (
      <SkeletonContainer
        svgWidth="100%"
        svgHeight={170}
        ariaLabel="Loading tags"
        clipId="loading-tags">
        <SkeletonBodyText numberOfLines={4} offsetLeft={0} marginBottom={15} offsetTop={20} />
      </SkeletonContainer>
    );
  }

  return (
    <React.Fragment>
      <TagSelectionHeader totalSelected={localTags.length} />
      <FilteredTagsProvider>
        <TagsSelection
          disabled={disable}
          showEmpty={showEmpty}
          onAdd={addTag}
          onRemove={removeTag}
          selectedTags={localTags}
          label={'Tags'}
        />
      </FilteredTagsProvider>
    </React.Fragment>
  );
};

EditorTagsSkeleton.propTypes = {
  disable: PropTypes.bool,
  showEmpty: PropTypes.bool,
  tags: PropTypes.array,
  setTags: PropTypes.func,
};

export { EditorTagsSkeleton };
