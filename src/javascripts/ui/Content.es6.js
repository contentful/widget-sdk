import {h} from 'ui/Framework';
import * as Colors from 'Styles/Colors';
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
 * @returns {VNode}
 */
export function linkOpen (content, url) {
  return h('a.text-link', {
    href: url,
    target: '_blank',
    rel: 'noopener noreferrer'
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
      color: Colors.byName.textMid
    }
  }, content);
}
