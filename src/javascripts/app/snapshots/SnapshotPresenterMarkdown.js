import React from 'react';
import PropTypes from 'prop-types';
import isHtml from 'is-html';
import { MarkdownPreview } from '@contentful/field-editor-markdown';
import { Note } from '@contentful/forma-36-react-components';
import EmbedlyPreview from 'components/forms/embedly_preview/EmbedlyPreview';
import { captureError } from 'core/monitoring';

const SnapshotPresenterMarkdown = ({ className, value, direction }) => {
  const hasHtmlTags = isHtml(value);

  return (
    <div className={className} data-test-id="snapshot-presenter-markdown">
      <ErrorBoundary>
        {hasHtmlTags ? (
          <div>{value}</div>
        ) : (
          <MarkdownPreview
            value={value}
            mode="zen"
            direction={direction}
            previewComponents={{
              // eslint-disable-next-line
              embedly: ({ url }) => <EmbedlyPreview previewUrl={url} delay={100} />,
            }}
          />
        )}
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
    captureError(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <Note noteType="negative">Error rendering markdown</Note>;
    }
    return this.props.children;
  }
}
