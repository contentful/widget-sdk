import * as React from 'react';
import PropTypes from 'prop-types';
import { EditorTagsSkeleton, MetadataTags, useDocTags } from 'features/content-tags';
import { PolicyBuilderConfig } from 'access_control/PolicyBuilder/PolicyBuilderConfig';

export const ContentTagsTab = ({ doc, showEmpty }) => {
  const canEditTags = doc.permissions.canEditFieldLocale(
    PolicyBuilderConfig.TAGS,
    PolicyBuilderConfig.PATH_WILDCARD
  );

  const { tags, setTags } = useDocTags(doc);

  return (
    <MetadataTags>
      <EditorTagsSkeleton
        disable={!canEditTags}
        showEmpty={showEmpty}
        tags={tags}
        setTags={setTags}
      />
    </MetadataTags>
  );
};

ContentTagsTab.propTypes = {
  showEmpty: PropTypes.bool.isRequired,
  doc: PropTypes.shape({
    getValueAt: PropTypes.func.isRequired,
    setValueAt: PropTypes.func.isRequired,
    permissions: PropTypes.shape({
      canEditFieldLocale: PropTypes.func.isRequired,
    }).isRequired,
  }),
};

ContentTagsTab.defaultPropes = {
  showEmpty: false,
};
