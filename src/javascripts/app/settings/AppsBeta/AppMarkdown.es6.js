import React from 'react';
import { css } from 'emotion';
import PropTypes from 'prop-types';
import tokens from '@contentful/forma-36-tokens';
import makePreviewRender from 'markdown_editor/PreviewRender.es6';

const previewRender = makePreviewRender({
  forceMaxWidth: 1000
});

// eslint-disable-next-line
const rootStyle = css`
  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    margin-top: 0;
  }
  h1,
  h2,
  h3 {
    margin-bottom: ${tokens.spacingL};
  }
  h4,
  h5,
  h6 {
    margin-bottom: ${tokens.spacingM};
  }
  p {
    margin-bottom: ${tokens.spacingM};
  }

  ul,
  ol {
    margin: ${tokens.spacingS} 0;
    padding-left: ${tokens.spacingM};
  }
  ul > li {
    list-style-type: disc;
    margin-bottom: 0;
  }
  ol > li {
    list-style-type: decimal;
    margin-bottom: 0;
  }

  .markdown-image-placeholder {
    text-align: center;
  }

  .markdown-image-placeholder img {
    max-width: 100%;
    margin: ${tokens.spacingL} auto;
  }
`;

export default function AppMarkdown({ source }) {
  let description = source;

  try {
    const tree = previewRender(source);
    description = tree.root;
  } catch (e) {
    // do nothing
  }

  return <div className={rootStyle}>{description}</div>;
}

AppMarkdown.propTypes = {
  source: PropTypes.string.isRequired
};
