import React from 'react';
import PropTypes from 'prop-types';

import { MarkdownPreview } from '@contentful/field-editor-markdown';
import EmbedlyPreview from 'components/forms/embedly_preview/EmbedlyPreview';

const SnapshotPresenterMarkdown = ({ value }) => {
  return (
    <MarkdownPreview
      value={value}
      mode="zen"
      direction="ltr"
      previewComponents={{
        // eslint-disable-next-line
        embedly: ({ url }) => <EmbedlyPreview previewUrl={url} delay={100} />
      }}
    />
  );
};

SnapshotPresenterMarkdown.propTypes = {
  value: PropTypes.string.isRequired
};

export default SnapshotPresenterMarkdown;
