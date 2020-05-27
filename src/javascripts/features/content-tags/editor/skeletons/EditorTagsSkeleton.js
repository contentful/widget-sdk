import PropTypes from 'prop-types';
import * as React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { TagsSelection } from 'features/content-tags/editor/components/TagsSelection';
import { useIsInitialLoadingOfTags, useReadTags } from 'features/content-tags/core/hooks';
import { orderByLabel, tagsPayloadToValues } from 'features/content-tags/editor/utils';
import { SkeletonBodyText, SkeletonContainer } from '@contentful/forma-36-react-components';

const EditorTagsSkeleton = ({ tags, setTags, showEmpty }) => {
  const { allData } = useReadTags();
  const [localTags, setLocalTags] = useState();
  const isInitialLoad = useIsInitialLoadingOfTags();

  useEffect(() => {
    const tagsIds = tags.map(({ sys: { id } }) => id) || [];
    const lTags = tagsPayloadToValues(allData).filter((tag) =>
      tagsIds.some((t) => t === tag.value)
    );
    setLocalTags(orderByLabel(lTags));
  }, [tags, setLocalTags, allData]);

  const onAddTag = useCallback(
    (tag) => {
      setLocalTags((prevState) => {
        const nextState = orderByLabel([...prevState, tag]);
        setTags(nextState.map(({ value }) => value));
        return nextState;
      });
    },
    [setLocalTags, setTags]
  );

  const onRemoveTag = useCallback(
    (tagId) => {
      setLocalTags((prevState) => {
        const nextState = orderByLabel([...prevState.filter((tag) => tag.value !== tagId)]);
        setTags(nextState.map(({ value }) => value));
        return nextState;
      });
    },
    [setLocalTags, setTags]
  );

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
    <TagsSelection
      showEmpty={showEmpty}
      onAdd={onAddTag}
      onRemove={onRemoveTag}
      selectedTags={localTags}
    />
  );
};

EditorTagsSkeleton.propTypes = {
  showEmpty: PropTypes.bool,
  tags: PropTypes.array,
  setTags: PropTypes.func,
};

export { EditorTagsSkeleton };
