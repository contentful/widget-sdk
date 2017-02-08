import {h} from 'utils/hyperscript';

/**
 * @ngdoc service
 * @name ui/Content
 * @description
 * This module is a collection of templates for content related
 * components.
 */


/**
 * @ngdoc method
 * @name ui/Content/docsLink
 * @description
 * Create a link to a knowledgebase article.
 *
 * The target is specified by a key. You can look up the key to URL
 * mapping in the definition of the cfKnowledgeBase directive.
 *
 * @param {string} text    Link text
 * @param {string} target  Article target key
 */
export function docsLink (text, target) {
  return h('cf-knowledge-base', {target, text, inlineText: 'true'});
}
