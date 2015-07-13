'use strict';

/**
 * @ngdoc service
 * @name stringUtils
 * @description
 * Utility functions that deal with strings.
 *
 * Some of them are also available as filters
 */
angular.module('contentful')
.constant('stringUtils', (function(){
  function toIdentifier(string) {
    if (_.isEmpty(string)) return '';
    var words = splitIntoWords(string).map(stripInvalidChars);
    if (_.isEmpty(words)) return '';
    var first = words[0].toLowerCase();
    var rest =  words.slice(1).map(capitalize);
    return cleanPrefix([first].concat(rest).join(''));
  }

  function capitalize(string) {
    if (_.isEmpty(string)) return '';
    return string[0].toUpperCase() + string.slice(1).toLowerCase();
  }

  function capitalizeFirst(string) {
    if (_.isEmpty(string)) return '';
    return string[0].toUpperCase() + string.slice(1);
  }

  function uncapitalize(str) {
    if (_.isEmpty(str)) return '';
    return str[0].toLowerCase() + str.substr(1);
  }

  function cleanPrefix(string) {
    return string.replace(/^[^a-z]+/, function(prefix) {
      return prefix.toLowerCase().replace(/[0-9]/g, '');
    });
  }

  function splitIntoWords(string) {
    return _.compact(
      string
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/\b([A-Z]+)([A-Z])([a-z])/g, '$1 $2$3')
        .split(/[\s\-_.)]+/));
  }

  function stripInvalidChars(string) {
    return string.replace(/\W/g, '');
  }

  function removeQueryString(str) {
    return str.replace(/(\.\w+)\?.*/, '$1');
  }

  function removeExtension(str) {
    return str.replace(/\.\w+$/g, '');
  }

  function fileNameToTitle(str) {
    return removeExtension(str).replace(/_/g, ' ');
  }

  function titleToFileName(str, spacer) {
    return str.replace(/\s/g, spacer||'').replace(/[^\w]*/g, '');
  }

  var entitiesToLabels = {
    ContentType: 'Content Type',
    Entry: 'Entry',
    Asset: 'Asset',
    ApiKey: 'API Key',
    EditingInterface: 'Editing Interface'
  };

  function getEntityLabel(id) {
    return entitiesToLabels[id];
  }

  /**
   * @ngdoc method
   * @name stringUtils#joinAnd
   * @description
   * Join the strings with commas and a final 'and'.
   *
   * @param {string[]} list
   */
  function joinAnd (stringList) {
    if (stringList.length === 0)
      return '';

    if (stringList.length === 1)
      return stringList[0];

    var lastPos = stringList.length - 1;
    var head = stringList.slice(0, lastPos);
    var last = stringList[lastPos];

    return head.join(', ') + ' and ' + last;
  }

  /**
   * @ngdoc method
   * @name stringUtils#joinAndTruncate
   * @usage[js]
   * joinAndTruncate(['a', 'b', 'c', 'd'], 2, 'items')
   * // => 'a, b and 2 other items'
   * @description
   * Join the strings with commas and a final 'and X other items'.
   *
   * @param {string[]} list
   * @param {number} maxLength
   * @param {string} itemsName
   */
  function joinAndTruncate (list, maxLength, itemsName) {
    if (list.length <= maxLength)
      return joinAnd(list);

    if (list.length === maxLength + 1)
      maxLength = maxLength - 1;

    var restLength = list.length - maxLength;
    var initialList = list.slice(0, maxLength);
    initialList.push(restLength + ' other ' + itemsName);
    return joinAnd(initialList);

  }

  return {
    joinAnd: joinAnd,
    joinAndTruncate: joinAndTruncate,
    toIdentifier: toIdentifier,
    capitalize: capitalize,
    capitalizeFirst: capitalizeFirst,
    uncapitalize: uncapitalize,
    splitIntoWords: splitIntoWords,
    stripInvalidChars: stripInvalidChars,
    removeQueryString: removeQueryString,
    removeExtension: removeExtension,
    fileNameToTitle: fileNameToTitle,
    titleToFileName: titleToFileName,
    getEntityLabel: getEntityLabel
  };
})())

/**
 * @ngcdoc filter
 * @name joinAnd
 * @description
 * Takes an array of strings and joins it with commas and a final
 * “and”.
 */
.filter('joinAnd', ['stringUtils', function (stringUtils) {
  return stringUtils.joinAnd;
}])

.filter('joinAndTruncate', ['stringUtils', function (stringUtils) {
  return stringUtils.joinAndTruncate;
}]);
