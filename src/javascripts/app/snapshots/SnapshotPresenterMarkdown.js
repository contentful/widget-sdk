import React from 'react';
import PropTypes from 'prop-types';

import { MarkdownPreview } from '@contentful/field-editor-markdown';
import EmbedlyPreview from 'components/forms/embedly_preview/EmbedlyPreview';

const SnapshotPresenterMarkdown = ({ className, value }) => {
  return (
    <div className={className} data-test-id="snapshot-presenter-markdown">
      <MarkdownPreview
        value={value}
        mode="zen"
        direction="ltr"
        previewComponents={{
          // eslint-disable-next-line
          embedly: ({ url }) => <EmbedlyPreview previewUrl={url} delay={100} />
        }}
      />
    </div>
  );
};

SnapshotPresenterMarkdown.propTypes = {
  className: PropTypes.string,
  value: PropTypes.string.isRequired
};

SnapshotPresenterMarkdown.defaultProps = {
  className: ''
};

export default SnapshotPresenterMarkdown;
