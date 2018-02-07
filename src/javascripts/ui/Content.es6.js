import {h} from 'ui/Framework';
import {byName as Colors} from 'Styles/Colors';
import KnowledgeBase from 'components/shared/knowledge_base_icon/KnowledgeBase';
import { monospaceFontFamily } from 'Styles';
import $state from '$state';

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
 * @ngdoc method
 * @name ui/Content#docsLink
 * @description
 * Create a link to a knowledgebase article.
 *
 * The target is specified by a key. You can look up the key to URL
 * mapping in the definition of the cfKnowledgeBase directive.
 *
 * ~~~js
 * p([
 *   'Find out more about the CMA in ',
 *   docsLink('our documentation', 'management_api')
 * ])
 * ~~~
 *
 * @param {string} text    Link text
 * @param {string} target  Article target key
 * @returns {VNode}
 */
export function docsLink (text, target) {
  return KnowledgeBase({
    target,
    text,
    inlineText: 'true'
  });
}


/**
 * @ngdoc method
 * @name ui/Content#linkOpen
 * @description
 * Create a link to a URL that opens in a new window
 *
 * ~~~js
 * p([
 *   'Open ', linkOpen(['Google'], '//google.com'), ' in a new tab'
 * ])
 * ~~~
 *
 * @param {VNode[]} content  List of hyperscript nodes
 * @param {string} url
 * @param {string?} modifier
 *   An optional string that changes the style of the link. Possible
 *   values are 'constructive' or 'destructive'
 * @returns {VNode}
 */
const AVAILABLE_MODIFIERS = ['', 'constructive', 'destructive'];
export function linkOpen (content, url, modifier = '') {
  if (!AVAILABLE_MODIFIERS.includes(modifier)) {
    throw new TypeError(`Unknown text link modifier ${modifier}`);
  }

  if (modifier) {
    modifier = `--${modifier}`;
  }

  return h(`a.text-link${modifier}`, {
    href: url,
    target: '_blank',
    rel: 'noopener noreferrer'
  }, content);
}


/**
 * @ngdoc method
 * @name ui/Content#stateLink
 * @description
 * Create a link to an Angular UI Router state.
 *
 * ~~~js
 * p([
 *   'Go to ',
 *   stateLink('Home of some space', 'spaces.detail.home', {spaceId: 'lol'})
 * ])
 * ~~~
 *
 * @param {VNode[]}  content   Array of child nodes
 * @param {object}   stateRef  Object of `{path: 'x.y', params: {...}, options: {...}}` shape.
 *                             If `params` are not provided `$stateParams` are used.
 * @returns {VNode}
 */
export function stateLink (content, {path, params, options}) {
  return h('a', {
    href: $state.href(path, params),
    onClick: e => {
      if (e.shiftKey || e.ctrlKey || e.metaKey) {
        // allow to open in a new tab/window normally
      } else {
        // perform Angular UI router transition only
        e.preventDefault();
        $state.go(path, params, options);
      }
    }
  }, content);
}


/**
 * @ngdoc method
 * @name ui/Content#p
 * @description
 * Paragraph of text.
 *
 * Resets line height and color from bad global styles
 *
 * ~~~js
 * p([
 *   '...',
 *   '...'
 * ])
 * ~~~
 *
 * @param {VNode[]} content  List of hyperscript nodes
 * @returns {VNode}
 */
export function p (content) {
  return h('p', {
    style: {
      lineHeight: '1.5',
      color: Colors.textMid
    }
  }, content);
}


/**
 * A span that styles the content as small, uppercased, spaced letters
 * with the given color.
 *
 * @param {string?} .color
 */
export function badge ({
  color = Colors.textLight
}, children) {
  return h('span', {
    style: {
      color,
      fontSize: '11px',
      fontWeight: '600',
      letterSpacing: '1px',
      textTransform: 'uppercase'
    }
  }, children);
}


/**
 * Styles the content as an inline code fragment
 */
export function codeFragment (children) {
  return h('span', {
    style: {
      display: 'inline-block',
      color: Colors.textMid,
      background: Colors.elementLightest,
      border: `1px solid ${Colors.elementMid}`,
      borderRadius: '2px',
      fontFamily: monospaceFontFamily,
      fontSize: '13px',
      lineHeight: '22px',
      padding: '0 5px',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, children);
}
