import { Note, SkeletonBodyText, SkeletonContainer } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { useAsync } from 'core/hooks';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';
import { DEFAULT_FEATURES_STATUS, FEATURES, getSpaceFeature } from 'data/CMA/ProductCatalog';
import { css } from 'emotion';
import { useIsInitialLoadingOfTags, useReadTags } from 'features/content-tags/core/hooks';
import { useContentLevelPermissions } from 'features/content-tags/core/hooks/useContentLevelPermissions';
import { FilteredTagsProvider } from 'features/content-tags/core/state/FilteredTagsProvider';
import { TagSelectionHeader } from 'features/content-tags/editor/components/TagSelectionHeader';
import { TagsSelection } from 'features/content-tags/editor/components/TagsSelection';
import { orderByLabel, tagsPayloadToOptions } from 'features/content-tags/editor/utils';
import PropTypes from 'prop-types';
import * as React from 'react';
import { useCallback, useEffect, useState } from 'react';

const styles = {
  note: css({
    marginBottom: tokens.spacingXl,
  }),
  nodeHeading: css({
    fontWeight: tokens.fontWeightDemiBold,
  }),
};

function useLocalTags(tags, setTags) {
  const { data } = useReadTags();
  const [localTags, setLocalTags] = useState([]);

  useEffect(() => {
    const tagsIds = tags.map(({ sys: { id } }) => id) || [];
    const lTags = tagsPayloadToOptions(data).filter((tag) => tagsIds.some((t) => t === tag.value));
    setLocalTags(orderByLabel(lTags));
  }, [tags, setLocalTags, data]);

  const addTag = useCallback(
    (tag) => {
      setLocalTags((prevState) => {
        const nextState = orderByLabel([...prevState, tag]);
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

const EditorTagsSkeleton = ({ disable, tags, setTags, showEmpty, entityType }) => {
  const { localTags, addTag, removeTag } = useLocalTags(tags, setTags);
  const isInitialLoad = useIsInitialLoadingOfTags();
  const { contentLevelPermissionsEnabled } = useContentLevelPermissions();
  const { currentSpaceId: spaceId } = useSpaceEnvContext();

  const hasCustomRolesFeatureCheck = useCallback(async () => {
    return await getSpaceFeature(
      spaceId,
      FEATURES.CUSTOM_ROLES_FEATURE,
      DEFAULT_FEATURES_STATUS.CUSTOM_ROLES_FEATURE
    );
  }, [spaceId]);

  const { data: hasCustomRolesFeature } = useAsync(hasCustomRolesFeatureCheck);

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
      {hasCustomRolesFeature && contentLevelPermissionsEnabled && (
        <Note className={styles.note}>
          <span className={styles.nodeHeading}>Carefully add and remove tags</span>
          <div>
            You could unintentionally give or revoke access to this {entityType} for anyone in this
            space, including yourself.
          </div>
        </Note>
      )}

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
  entityType: PropTypes.string,
};

export { EditorTagsSkeleton };
