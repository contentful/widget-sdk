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

const TagsSelection = ({ showEmpty, onAdd, onRemove, selectedTags = [] }) => {
  const { data, isLoading, setSearch, setLimit, hasTags } = useReadTags();
  const isInitialLoad = useIsInitialLoadingOfTags();

  useEffect(() => {
    setLimit(10);
  }, [setLimit]);

  const onSearch = useCallback(
    (tagId) => {
      setSearch(tagId);
    },
    [setSearch]
  );

  const filteredTags = useMemo(
    () =>
      orderByLabel(
        tagsPayloadToValues(
          data.filter((tag) => !selectedTags.some((localTag) => localTag.value === tag.sys.id))
        )
      ),
    [data, selectedTags]
  );

  const { showModal: showUserListModal, modalComponent: userListModal } = useF36Modal(
    AdminsOnlyModal
  );

  const isAdmin = useIsAdmin();

  const onCreate = useCallback(() => {
    if (isAdmin) {
      Navigator.go({ path: 'spaces.detail.settings.tags' });
    } else {
      showUserListModal();
    }
  }, [isAdmin, showUserListModal]);

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
        <Paragraph>Tags</Paragraph>
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
