/* eslint "rulesdir/restrict-inline-styles": "warn" */
import React from 'react';
import PropTypes from 'prop-types';
import tokens from '@contentful/forma-36-tokens';
import KnowledgeBase from 'components/shared/knowledge_base_icon/KnowledgeBase';

/**
 * @ngdoc service
 * @name ui/Content
 * @description
 * This module is a collection of templates for [phrasing content][]
 * related components.
 *
 * [phrasing content]: https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/Content_categories#Phrasing_content
 */

/**
 * Create a link to a knowledgebase article.
 *
 * The target is specified by a key. You can look up the key to URL
 * mapping in the definition of the cfKnowledgeBase directive.
 *
 * @returns {React.Element}
 */
export function DocsLink({ text, target }) {
  return KnowledgeBase({
    target,
    text,
    inlineText: 'true'
  });
}
DocsLink.propTypes = {
  text: PropTypes.string,
  target: PropTypes.string
};

/**
 * @ngdoc method
 * @name ui/Content#linkOpen
 * @description
 * Create a link to a URL that opens in a new window
 *
 *   An optional string that changes the style of the link. Possible
 *   values are 'constructive' or 'destructive'
 * @returns {React.Element}
 */
const AVAILABLE_MODIFIERS = ['', 'constructive', 'destructive'];
export function LinkOpen({ children, url, modifier }) {
  if (!AVAILABLE_MODIFIERS.includes(modifier)) {
    throw new TypeError(`Unknown text link modifier ${modifier || ''}`);
  }

  if (modifier) {
    modifier = `--${modifier}`;
  }

  return (
    <a
      className={`text-link${modifier || ''}`}
      href={url}
      target="_blank"
      rel="noopener noreferrer">
      {children}
    </a>
  );
}
LinkOpen.propTypes = {
  children: PropTypes.node,
  url: PropTypes.string.isRequired,
  modifier: PropTypes.string
};

LinkOpen.defaultProps = {
  modifier: ''
};

/**
 * Styles the content as an inline code fragment
 */
export function CodeFragment({ children, style }) {
  return (
    <span
      style={{
        display: 'inline-block',
        color: tokens.colorTextMid,
        background: tokens.colorElementLightest,
        border: `1px solid ${tokens.colorElementMid}`,
        borderRadius: '2px',
        fontFamily: 'SFMono-Regular, Consolas, Liberation Mono, Menlo, monospace',
        fontSize: '13px',
        lineHeight: '22px',
        padding: '0 5px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        ...style
      }}>
      {children}
    </span>
  );
}
CodeFragment.propTypes = {
  children: PropTypes.node,
  style: PropTypes.object
};
