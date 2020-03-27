import React from 'react';
import { css } from 'emotion';
import PropTypes from 'prop-types';
import Markdown from 'markdown-to-jsx';
import tokens from '@contentful/forma-36-tokens';

const styles = {
  // eslint-disable-next-line
  root: css`
    word-wrap: break-word;
    overflow-wrap: break-word;
    font-size: ${tokens.fontSizeM};
    font-family: ${tokens.fontStackPrimary};
    line-height: ${tokens.lineHeightDefault};
    color: ${tokens.colorTextMid};

    h1,
    h2,
    h3,
    h4,
    h5,
    h6 {
      margin-top: ${tokens.spacingL};
      margin-bottom: ${tokens.spacingM};
      color: ${tokens.colorTextDark};
    }
    h1:first-child,
    h2:first-child,
    h3:first-child,
    h4:first-child,
    h5:first-child,
    h6:first-child {
      margin-top: 0;
    }
    h1 {
      font-size: 1.6em;
    }
    h2 {
      font-size: 1.55em;
    }
    h3 {
      font-size: 1.4em;
    }
    h4 {
      font-size: 1.25em;
    }
    h5 {
      font-size: 1.1em;
    }
    h6 {
      font-size: 1.05em;
    }
    p {
      margin-top: 0;
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
    table {
      table-layout: fixed;
      border-right-width: 0;
      border-bottom-width: 0;
      width: 80%;
      margin: ${tokens.spacingM} auto;
      border-spacing: 0;
      border-collapse: collapse;
      border: 1px solid ${tokens.colorElementMid};
    }
    table th,
    table td {
      padding: 5px;
      border-left-width: 0;
      border-top-width: 0;
    }
    table th {
      background: ${tokens.colorElementLight};
    }
    table td {
      border: 1px solid ${tokens.colorElementMid};
    }
    a {
      color: ${tokens.colorBlueMid};
    }
    hr {
      margin-top: ${tokens.spacingL};
      margin-bottom: ${tokens.spacingL};
      height: 1px;
      background-color: ${tokens.colorElementMid};
      border: none;
    }
    blockquote {
      border-left: 4px solid ${tokens.colorElementLight};
      padding-left: ${tokens.spacingL};
      margin: 0;
      margin-top: ${tokens.spacingM};
      font-style: italic;
    }
    img {
      margin: ${tokens.spacingM} auto;
      display: block;
      max-width: 80%;
      max-height: 250px;
    }
    pre code {
      font-size: ${tokens.fontSizeS};
      font-family: ${tokens.fontStackMonospace};
    }
  `,
};

export default function MarkdownRenderer({ source }) {
  return (
    <div className={styles.root}>
      <Markdown>{source}</Markdown>
    </div>
  );
}

MarkdownRenderer.propTypes = {
  source: PropTypes.string.isRequired,
};
