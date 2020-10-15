import PropTypes from 'prop-types';
import * as React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { TagsSelection } from 'features/content-tags/editor/components/TagsSelection';
import {
  useContentLevelPermissions,
  useIsAdmin,
  useIsInitialLoadingOfTags,
  useReadTags,
} from 'features/content-tags/core/hooks';
import { orderByLabel, tagsPayloadToValues } from 'features/content-tags/editor/utils';
import { SkeletonBodyText, SkeletonContainer } from '@contentful/forma-36-react-components';
import { TagSelectionHeader } from 'features/content-tags/editor/components/TagSelectionHeader';
import { TagType } from 'features/content-tags/core/TagType';
import { FilteredTagsProvider } from 'features/content-tags';

function selectedTags(allRawTags, selectedTagIds, tagType) {
  return tagsPayloadToValues(
    allRawTags.filter((rawTag) => {
      return rawTag.sys.tagType === tagType && selectedTagIds.some((id) => rawTag.sys.id === id);
    })
  );
}

function useLocalTags(tags, setTags) {
  const { data } = useReadTags();
  const [localTags, setLocalTags] = useState([]);
  const [defaultTags, setLocalDefaultTags] = useState([]);
  const [accessTags, setLocalAccessTags] = useState([]);

  useEffect(() => {
    const tagsIds = tags.map(({ sys: { id } }) => id) || [];
    const lTags = tagsPayloadToValues(data).filter((tag) => tagsIds.some((t) => t === tag.value));
    setLocalTags(orderByLabel(lTags));
  }, [tags, setLocalTags, data]);

  useEffect(() => {
    const localTagIds = localTags.map((lTag) => lTag.value);
    setLocalDefaultTags(orderByLabel(selectedTags(data, localTagIds, TagType.Default)));
    setLocalAccessTags(orderByLabel(selectedTags(data, localTagIds, TagType.Access)));
  }, [localTags, setLocalDefaultTags, setLocalAccessTags, data]);

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

  return { defaultTags, accessTags, removeTag, addTag };
}

const EditorTagsSkeleton = ({ tags, setTags, showEmpty }) => {
  const { accessTags, defaultTags, addTag, removeTag } = useLocalTags(tags, setTags);
  const isInitialLoad = useIsInitialLoadingOfTags();
  const { contentLevelPermissionsEnabled } = useContentLevelPermissions();
  const isAdmin = useIsAdmin();

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
      <TagSelectionHeader totalSelected={defaultTags.length + accessTags.length} />
      <FilteredTagsProvider tagType={TagType.Default}>
        <TagsSelection
          showEmpty={showEmpty}
          onAdd={addTag}
          onRemove={removeTag}
          selectedTags={defaultTags}
          label={'Tags'}
        />
      </FilteredTagsProvider>
      {contentLevelPermissionsEnabled && (
        <FilteredTagsProvider tagType={TagType.Access}>
          <TagsSelection
            disabled={!isAdmin}
            showEmpty={showEmpty}
            onAdd={addTag}
            onRemove={removeTag}
            selectedTags={accessTags}
            label={'Access Tags'}
          />
        </FilteredTagsProvider>
      )}
    </React.Fragment>
  );
};

EditorTagsSkeleton.propTypes = {
  showEmpty: PropTypes.bool,
  tags: PropTypes.array,
  setTags: PropTypes.func,
};

export { EditorTagsSkeleton };
