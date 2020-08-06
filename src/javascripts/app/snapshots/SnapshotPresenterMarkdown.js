import React from 'react';
import PropTypes from 'prop-types';

import { MarkdownPreview } from '@contentful/field-editor-markdown';
import { Note } from '@contentful/forma-36-react-components';
import EmbedlyPreview from 'components/forms/embedly_preview/EmbedlyPreview';
import { logError } from 'services/logger';

const SnapshotPresenterMarkdown = ({ className, value, direction }) => {
  return (
    <div className={className} data-test-id="snapshot-presenter-markdown">
      <ErrorBoundary>
        <MarkdownPreview
          value={value}
          mode="zen"
          direction={direction}
          previewComponents={{
            // eslint-disable-next-line
            embedly: ({ url }) => <EmbedlyPreview previewUrl={url} delay={100} />,
          }}
        />
      </ErrorBoundary>
    </div>
  );
};

SnapshotPresenterMarkdown.propTypes = {
  className: PropTypes.string,
  value: PropTypes.string.isRequired,
  direction: PropTypes.string,
};

SnapshotPresenterMarkdown.defaultProps = {
  className: '',
};

export default SnapshotPresenterMarkdown;

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    logError(`Markdown preview error: ${error.message}`, { error, data: errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return <Note noteType="negative">Error rendering markdown</Note>;
    }
    return this.props.children;
  }
}
