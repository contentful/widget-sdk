import PropTypes from 'prop-types';
import * as React from 'react';
import { useCallback, useEffect, useMemo } from 'react';
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
import FeedbackButton from 'app/common/FeedbackButton';
import { EntityTags } from 'features/content-tags/editor/components/EntityTags';
import { useAllTagsGroups } from 'features/content-tags/core/hooks/useAllTagsGroups';
import { TAGS_PER_ENTITY } from 'features/content-tags/core/limits';
import tokens from '@contentful/forma-36-tokens';
import { ConditionalWrapper } from 'features/content-tags/core/components/ConditionalWrapper';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';
import { isMasterEnvironment } from 'core/services/SpaceEnvContext/utils';

const styles = {
  wrapper: css({
    display: 'flex',
    justifyContent: 'space-between',
  }),
  innerWrapper: css({
    display: 'flex',
    justifyContent: 'flex-end',
  }),
  iconWrapper: css({
    marginLeft: tokens.spacingL,
    order: '2',
  }),
  tagLimits: css({
    marginLeft: 'auto',
  }),
  tooltipWrapper: css({
    width: '100%',
  }),
};

const TagsSelection = ({ showEmpty, onAdd, onRemove, selectedTags = [] }) => {
  const { data, isLoading, setSearch, setLimit, hasTags } = useReadTags();
  const isInitialLoad = useIsInitialLoadingOfTags();
  const { currentEnvironment } = useSpaceEnvContext();
  const tagGroups = useAllTagsGroups();

  const totalSelected = selectedTags.length;
  const disabled = totalSelected >= TAGS_PER_ENTITY;

  useEffect(() => {
    setLimit(1000);
  }, [setLimit]);

  const onSearch = useCallback(
    (tagId) => {
      setSearch(tagId);
    },
    [setSearch]
  );

  const filteredTags = useMemo(() => {
    const filtered = orderByLabel(
      tagsPayloadToValues(
        data.filter((tag) => !selectedTags.some((localTag) => localTag.value === tag.sys.id))
      )
    );
    return filtered.splice(0, Math.min(10, filtered.length));
  }, [data, selectedTags]);

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
          <Paragraph>Tags</Paragraph>
          <Paragraph className={styles.tagLimits}>
            {totalSelected} / {TAGS_PER_ENTITY}
            <span className={styles.iconWrapper}>
              <FeedbackButton about="Tags" target="devWorkflows" label="Give feedback" />
            </span>
          </Paragraph>
        </div>
        <ConditionalWrapper
          condition={disabled}
          wrapper={(children) => (
            <Tooltip
              targetWrapperClassName={styles.tooltipWrapper}
              containerElement={'div'}
              content={`You can only add up to ${TAGS_PER_ENTITY} tags per entry or asset`}
              id="limitTip"
              place="top">
              {children}
            </Tooltip>
          )}>
          <TagsAutocomplete
            tags={filteredTags}
            isLoading={isLoading}
            onChange={onAdd}
            disabled={disabled}
            onQueryChange={onSearch}
          />
        </ConditionalWrapper>
        <EntityTags tags={selectedTags} onRemove={onRemove} tagGroups={tagGroups} />
      </FieldFocus>
    );
  }, [
    filteredTags,
    selectedTags,
    isLoading,
    onAdd,
    onSearch,
    onRemove,
    userListModal,
    tagGroups,
    disabled,
    totalSelected,
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
};

export { TagsSelection };
