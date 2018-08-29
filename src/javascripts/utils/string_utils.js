'use strict';

/**
 * @ngdoc service
 * @name stringUtils
 * @module cf.utils
 * @description
 * Utility functions that deal with strings.
 *
 * Some of them are also available as filters
 */
angular
  .module('cf.utils')
  .constant(
    'stringUtils',
    (() => {
      function toIdentifier(string) {
        if (shouldFallbackToEmptyString(string)) return '';
        var words = splitIntoWords(string).map(stripInvalidChars);
        if (_.isEmpty(words)) return '';
        var first = words[0].toLowerCase();
        var rest = words.slice(1).map(capitalize);
        return cleanPrefix([first].concat(rest).join(''));
      }

      function capitalize(string) {
        if (shouldFallbackToEmptyString(string)) return '';
        return string[0].toUpperCase() + string.slice(1).toLowerCase();
      }

      function capitalizeFirst(string) {
        if (shouldFallbackToEmptyString(string)) return '';
        return string[0].toUpperCase() + string.slice(1);
      }

      function uncapitalize(str) {
        if (shouldFallbackToEmptyString(str)) return '';
        return str[0].toLowerCase() + str.substr(1);
      }

      function shouldFallbackToEmptyString(str) {
        return !_.isString(str) || str.length < 1;
      }

      function cleanPrefix(string) {
        return string.replace(/^[^a-z]+/, prefix => prefix.toLowerCase().replace(/[0-9]/g, ''));
      }

      function splitIntoWords(string) {
        return _.compact(
          string
            .replace(/([a-z])([A-Z])/g, '$1 $2')
            .replace(/\b([A-Z]+)([A-Z])([a-z])/g, '$1 $2$3')
            .split(/[\s\-_.)]+/)
        );
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
        return normalizeWhiteSpace(removeExtension(str).replace(/_/g, ' '));
      }

      function titleToFileName(str, spacer) {
        return str.replace(/\s/g, spacer || '').replace(/[^\w]*/g, '');
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
      function joinAnd(stringList) {
        if (stringList.length === 0) {
          return '';
        }

        if (stringList.length === 1) {
          return stringList[0];
        }

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
      function joinAndTruncate(list, maxLength, itemsName) {
        if (list.length <= maxLength) {
          return joinAnd(list);
        }

        if (list.length === maxLength + 1) {
          maxLength = maxLength - 1;
        }

        var restLength = list.length - maxLength;
        var initialList = list.slice(0, maxLength);
        initialList.push(restLength + ' other ' + itemsName);
        return joinAnd(initialList);
      }

      /**
       * @ngdoc method
       * @name stringUtils#truncate
       * @usage[js]
       * truncate('Hello world', 5)
       * // => 'Hello…'
       *
       * @param {string} str
       * @param {number} length
       * @returns {string}
       */
      function truncate(str, length) {
        if (str && str.length > length) {
          return (
            str &&
            str
              .substr(0, length + 1) // +1 to look ahead and be replaced below.
              // Get rid of orphan letters but not one letter words (I, a, 2).
              // Try to not have “.” as last character to avoid awkward “....”.
              .replace(/(\s+\S(?=\S)|\s*)\.?.$/, '…')
          );
        } else {
          return str;
        }
      }

      /**
       * @ngdoc method
       * @name stringUtils#truncateMiddle
       * @usage[js]
       * truncateMiddle('Hello world wide web', 8, 3)
       * // => 'Hello…web'
       *
       * @param {string} str
       * @param {number} length
       * @param {number} endOfStrLength
       * @returns {string}
       */
      function truncateMiddle(str, length, endOfStrLength) {
        if (length < endOfStrLength) {
          throw new Error('`length` has to be greater or equal to `endOfStrLength`');
        }
        if (str && str.length > length) {
          var endOfStr = str.substr(-endOfStrLength).replace(/^\./, ''); // Avoid visually awkward “….”.
          var beginningOfStr = truncate(str, length - endOfStrLength);
          return beginningOfStr + endOfStr;
        } else {
          return str;
        }
      }

      /**
       * @ngdoc method
       * @name stringUtils#startsWithVowel
       * @usage[js]
       * startsWithVowel('Abracadabra')
       * // => true
       *
       * @param {string} str
       * @returns {boolean}
       */
      function startsWithVowel(str) {
        if (!_.isString(str) || str.length < 1) {
          return false;
        }
        var firstLetter = str.substr(0, 1).toLowerCase();
        return ['a', 'e', 'i', 'o', 'u'].indexOf(firstLetter) > -1;
      }

      /**
       * @ngdoc method
       * @name stringUtils#normalizeWhiteSpace
       * @usage[js]
       * normalizeWhiteSpace('  a  b  ')
       * // => 'a b'
       *
       * @description
       * Removes whitespaces from the beginning and the end and replaces
       * multiple whitespaces by one.
       *
       * @param {string} str
       * @returns {string}
       */
      function normalizeWhiteSpace(string) {
        if (string) {
          return string.trim().replace(/\s{2,}/g, ' ');
        } else {
          return string;
        }
      }

      // Adapted from gatekeeper, please don't modify unless you do it in both places
      // https://github.com/contentful/gatekeeper/blob/master/app/validators/email_validator.rb
      //
      // TODO: don't duplicate backend code, implement an endpoint for email validation in gatekeeper
      // and use it instead.
      var emailRegex = RegExp(
        '(?!.{255})' + // Lookahead assertion limiting length of email address to under 255 chars
        '(^\\s*' + // Start of string and arbitrary amount of whitespace
        '([^@\\s]{1,64})' + // Part of address before @, limited to under 64 chars
        '@' + // The @ symbol itself
        '((?:[\\w\\d-]+\\.)' + // Domain portion (limited to letters and numbers), including the period
        '+[a-z]{2,}' + // The TLD
          ')\\s*$)', // Arbitrary whitespace and end of string
        'i'
      );

      function isValidEmail(string) {
        return emailRegex.test(string);
      }

      return {
        normalizeWhiteSpace: normalizeWhiteSpace,
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
        getEntityLabel: getEntityLabel,
        truncate: truncate,
        truncateMiddle: truncateMiddle,
        startsWithVowel: startsWithVowel,
        isValidEmail: isValidEmail
      };
    })()
  )

  /**
   * @ngcdoc filter
   * @name joinAnd
   * @description
   * Takes an array of strings and joins it with commas and a final
   * “and”.
   */
  .filter('joinAnd', ['stringUtils', stringUtils => stringUtils.joinAnd])

  .filter('joinAndTruncate', ['stringUtils', stringUtils => stringUtils.joinAndTruncate]);
