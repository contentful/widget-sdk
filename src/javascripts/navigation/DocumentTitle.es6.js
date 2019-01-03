import { isString } from 'lodash';
import { getModule } from 'NgRegistry.es6';

const $rootScope = getModule('$rootScope');
const $document = getModule('$document');
const $state = getModule('$state');

/**
 * @ngdoc service
 * @name navigation/DocumentTitle
 * @description
 * Exports functions for manipulating
 * browser window's title.
 */

/**
 * @ngdoc method
 * @name navigation/DocumentTitle#init
 * @description
 * Starts watching for a fallback state
 * label set in a state definition.
 */
export function init() {
  $rootScope.$watch(() => $state.current.label, setTitle);
}

/**
 * @ngdoc method
 * @name navigation/DocumentTitle#setTtile
 * @param {string} title
 * @description
 * Sets a title.
 */
export function setTitle(title) {
  $document[0].title = title || 'Contentful';
}

/**
 * @ngdoc method
 * @name navigation/DocumentTitle#setTtile
 * @param {string} title
 * @description
 * If a provided arg is a valid title,
 * set it.
 */
export function maybeOverride(title) {
  if (isString(title)) {
    setTitle(title);
  }
}
