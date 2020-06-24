import PropTypes from 'prop-types';
import * as React from 'react';
import { useCallback, useEffect, useMemo } from 'react';
import { Paragraph } from '@contentful/forma-36-react-components';
import { TagsAutocomplete } from 'features/content-tags/editor/components/TagsAutocomplete';
import { EntityTags } from 'features/content-tags/editor/components/EntityTags';
import {
  useF36Modal,
  useIsAdmin,
  useIsInitialLoadingOfTags,
  useReadTags,
} from 'features/content-tags/core/hooks';
import { NoTagsContainer } from 'features/content-tags/core/components/NoTagsContainer';
import { AdminsOnlyModal } from 'features/content-tags/editor/components/AdminsOnlyModal';
import * as Navigator from 'states/Navigator';
import { FieldFocus } from 'features/content-tags/core/components/FieldFocus';
import { orderByLabel, tagsPayloadToValues } from 'features/content-tags/editor/utils';
import { useSpaceContext } from 'features/content-tags/core/hooks';

import { css } from 'emotion';
import FeedbackButton from 'app/common/FeedbackButton';

const styles = {
  wrapper: css({
    display: 'flex',
  }),
  iconWrapper: css({
    marginLeft: 'auto',
    order: '2',
  }),
};

const TagsSelection = ({ showEmpty, onAdd, onRemove, selectedTags = [] }) => {
  const { data, isLoading, setSearch, setLimit, hasTags } = useReadTags();
  const isInitialLoad = useIsInitialLoadingOfTags();
  const spaceContext = useSpaceContext();

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

  const isAdmin = useIsAdmin();

  const onCreate = useCallback(() => {
    if (isAdmin) {
      const isMaster = spaceContext.isMasterEnvironment();
      Navigator.go({ path: `spaces.detail.${isMaster ? '' : 'environment.'}settings.tags` });
    } else {
      showUserListModal();
    }
  }, [isAdmin, showUserListModal, spaceContext]);

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
          <div className={styles.iconWrapper}>
            <FeedbackButton about="Tags" target="devWorkflows" label="Give feedback" />
          </div>
        </div>
        <TagsAutocomplete
          tags={filteredTags}
          isLoading={isLoading}
          onChange={onAdd}
          onQueryChange={onSearch}
        />
        <EntityTags tags={selectedTags} onRemove={onRemove} />
      </FieldFocus>
    );
  }, [filteredTags, selectedTags, isLoading, onAdd, onSearch, onRemove, userListModal]);

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
