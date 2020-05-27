import * as React from 'react';
import PropTypes from 'prop-types';
import {
  EditorTagsSkeleton,
  ReadTagsProvider,
  TagsRepoProvider,
  useDocTags,
  useTagsFeatureEnabled,
} from 'features/content-tags';

const ContentTagsField = ({ doc }) => {
  const { tags, setTags } = useDocTags(doc);
  const { tagsEnabled } = useTagsFeatureEnabled();
  return tagsEnabled && doc.isOtDocument !== true ? (
    <TagsRepoProvider>
      <ReadTagsProvider>
        <EditorTagsSkeleton showEmpty={false} tags={tags} setTags={setTags} />
      </ReadTagsProvider>
    </TagsRepoProvider>
  ) : null;
};

ContentTagsField.propTypes = {
  doc: PropTypes.object,
};

export default ContentTagsField;
