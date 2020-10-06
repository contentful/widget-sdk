import PropTypes from 'prop-types';
import * as React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Paragraph, Tooltip } from '@contentful/forma-36-react-components';
import { TagsAutocomplete } from 'features/content-tags/editor/components/TagsAutocomplete';
import {
  useCanManageTags,
  useF36Modal,
  useIsInitialLoadingOfTags,
  useReadTags,
} from 'features/content-tags/core/hooks';
import { NoTagsContainer } from 'features/content-tags/core/components/NoTagsContainer';
import { AdminsOnlyModal } from 'features/content-tags/editor/components/AdminsOnlyModal';
import * as Navigator from 'states/Navigator';
import { FieldFocus } from 'features/content-tags/core/components/FieldFocus';
import { orderByLabel, tagsPayloadToValues } from 'features/content-tags/editor/utils';

import { css } from 'emotion';
import { EntityTags } from 'features/content-tags/editor/components/EntityTags';
import { useAllTagsGroups } from 'features/content-tags/core/hooks/useAllTagsGroups';
import { TAGS_PER_ENTITY } from 'features/content-tags/core/limits';
import { ConditionalWrapper } from 'features/content-tags/core/components/ConditionalWrapper';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';
import { isMasterEnvironment } from 'core/services/SpaceEnvContext/utils';
import { createTagsFilter } from 'features/content-tags/core/state/tags-filter';
import { TagTypePropType } from 'features/content-tags/core/TagType';

const styles = {
  wrapper: css({
    display: 'flex',
    justifyContent: 'space-between',
  }),
  tooltipWrapper: css({
    width: '100%',
  }),
};

const TagsSelection = ({
  showEmpty,
  onAdd,
  onRemove,
  selectedTags = [],
  tagType,
  disabled,
  label = 'Tags',
}) => {
  const { allData, isLoading, setLimit, hasTags } = useReadTags();
  const isInitialLoad = useIsInitialLoadingOfTags();
  const { currentEnvironment } = useSpaceEnvContext();
  const tagGroups = useAllTagsGroups();
  const [data, setData] = useState([]);
  const [match, setMatch] = useState('');
  const cachedTagsFilter = useMemo(() => createTagsFilter(allData), [allData]);
  const maxTagsReached = selectedTags.length >= TAGS_PER_ENTITY;

  useEffect(() => {
    setLimit(1000);
  }, [setLimit]);

  useEffect(() => {
    if (cachedTagsFilter) {
      const options = { match: match, tagType: tagType };
      const result = cachedTagsFilter(options);
      setData(result);
    }
  }, [cachedTagsFilter, setData, match, tagType]);

  const onSearch = useCallback(
    (searchStr) => {
      setMatch(searchStr);
    },
    [setMatch]
  );

  const filteredTags = useMemo(() => {
    const filtered = orderByLabel(
      tagsPayloadToValues(
        data.filter((tag) => !selectedTags.some((localTag) => localTag.value === tag.sys.id))
      )
    );
    return filtered.splice(0, Math.min(10, filtered.length));
  }, [data, selectedTags]);

  const selectedFilteredTags = useMemo(() => {
    return orderByLabel(
      tagsPayloadToValues(
        data.filter(
          (tag) =>
            tag.sys.tagType === tagType &&
            selectedTags.some((localTag) => localTag.value === tag.sys.id)
        )
      )
    );
  }, [selectedTags, data, tagType]);

  const { showModal: showUserListModal, modalComponent: userListModal } = useF36Modal(
    AdminsOnlyModal
  );

  const canManageTags = useCanManageTags();
  const onCreate = useCallback(() => {
    if (canManageTags) {
      const isMaster = isMasterEnvironment(currentEnvironment);
      Navigator.go({ path: `spaces.detail.${isMaster ? '' : 'environment.'}settings.tags` });
    } else {
      showUserListModal();
    }
  }, [canManageTags, showUserListModal, currentEnvironment]);

  const renderNoTags = useMemo(() => {
    return (
      <React.Fragment>
        {userListModal}
        <NoTagsContainer onCreate={onCreate} buttonLabel={'Add tags'} />
      </React.Fragment>
    );
  }, [onCreate, userListModal]);

  const renderTags = useMemo(() => {
    return (
      <FieldFocus>
        {userListModal}
        <div className={styles.wrapper}>
          <Paragraph>{label}</Paragraph>
        </div>
        <ConditionalWrapper
          condition={maxTagsReached || disabled}
          wrapper={(children) => (
            <Tooltip
              targetWrapperClassName={styles.tooltipWrapper}
              containerElement={'div'}
              content={
                disabled
                  ? `You don't have permission to edit this field. To change your permission setting contact your space admin.`
                  : `You can only add up to ${TAGS_PER_ENTITY} tags per entry or asset`
              }
              id="limitTip"
              place="top">
              {children}
            </Tooltip>
          )}>
          <TagsAutocomplete
            tags={filteredTags}
            isLoading={isLoading}
            onChange={onAdd}
            disabled={maxTagsReached || disabled}
            onQueryChange={onSearch}
          />
        </ConditionalWrapper>
        <EntityTags
          disabled={disabled}
          tags={selectedFilteredTags}
          onRemove={onRemove}
          tagGroups={tagGroups}
        />
      </FieldFocus>
    );
  }, [
    filteredTags,
    selectedFilteredTags,
    isLoading,
    onAdd,
    onSearch,
    onRemove,
    userListModal,
    tagGroups,
    maxTagsReached,
    disabled,
    label,
  ]);

  if (isInitialLoad) {
    return null;
  }

  if (!hasTags && !isLoading) {
    return showEmpty ? renderNoTags : null;
  }

  if (!isLoading) {
    return renderTags;
  }
};

TagsSelection.propTypes = {
  showEmpty: PropTypes.bool,
  entry: PropTypes.object,
  onAdd: PropTypes.func,
  onRemove: PropTypes.func,
  label: PropTypes.string,
  tagType: TagTypePropType,
  disabled: PropTypes.bool,
};

export { TagsSelection };
