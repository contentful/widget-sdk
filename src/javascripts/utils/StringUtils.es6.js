import _ from 'lodash';

/**
 * Utility functions that deal with strings.
 */

export function toIdentifier(string) {
  if (shouldFallbackToEmptyString(string)) return '';
  const words = splitIntoWords(string).map(stripInvalidChars);
  if (_.isEmpty(words)) return '';
  const first = words[0].toLowerCase();
  const rest = words.slice(1).map(capitalize);
  return cleanPrefix([first].concat(rest).join(''));
}

export function article(word) {
  if (shouldFallbackToEmptyString(word)) {
    return '';
  }

  const vowels = ['a', 'i', 'u', 'e', 'o'];

  if (vowels.includes(word[0])) {
    return 'an';
  } else {
    return 'a';
  }
}

export function capitalize(string) {
  if (shouldFallbackToEmptyString(string)) return '';
  return string[0].toUpperCase() + string.slice(1).toLowerCase();
}

export function capitalizeFirst(string) {
  if (shouldFallbackToEmptyString(string)) return '';
  return string[0].toUpperCase() + string.slice(1);
}

export function uncapitalize(str) {
  if (shouldFallbackToEmptyString(str)) return '';
  return str[0].toLowerCase() + str.substr(1);
}

export function shouldFallbackToEmptyString(str) {
  return !_.isString(str) || str.length < 1;
}

export function cleanPrefix(string) {
  return string.replace(/^[^a-z]+/, prefix => prefix.toLowerCase().replace(/[0-9]/g, ''));
}

export function splitIntoWords(string) {
  return _.compact(
    string
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/\b([A-Z]+)([A-Z])([a-z])/g, '$1 $2$3')
      .split(/[\s\-_.)]+/)
  );
}

export function stripInvalidChars(string) {
  return string.replace(/\W/g, '');
}

export function removeQueryString(str) {
  return str.replace(/(\.\w+)\?.*/, '$1');
}

export function removeExtension(str) {
  return str.replace(/\.\w+$/g, '');
}

export function fileNameToTitle(str) {
  return normalizeWhiteSpace(removeExtension(str).replace(/_/g, ' '));
}

export function titleToFileName(str, spacer) {
  return str.replace(/\s/g, spacer || '').replace(/[^\w]*/g, '');
}

export const entitiesToLabels = {
  ContentType: 'Content Type',
  Entry: 'Entry',
  Asset: 'Asset',
  ApiKey: 'API Key',
  EditingInterface: 'Editing Interface'
};

export function getEntityLabel(id) {
  return entitiesToLabels[id];
}

/**
 * Join the strings with commas and a final 'and'.
 *
 * @param {string[]} list
 */
export function joinAnd(stringList) {
  if (stringList.length === 0) {
    return '';
  }

  if (stringList.length === 1) {
    return stringList[0];
  }

  const lastPos = stringList.length - 1;
  const head = stringList.slice(0, lastPos);
  const last = stringList[lastPos];

  return head.join(', ') + ' and ' + last;
}

/**
 * Join the strings with commas and a final 'and X other items'.
 * joinAndTruncate(['a', 'b', 'c', 'd'], 2, 'items')
 * // => 'a, b and 2 other items'
 *
 * @param {string[]} list
 * @param {number} maxLength
 * @param {string} itemsName
 */
export function joinAndTruncate(list, maxLength, itemsName) {
  if (list.length <= maxLength) {
    return joinAnd(list);
  }

  if (list.length === maxLength + 1) {
    maxLength = maxLength - 1;
  }

  const restLength = list.length - maxLength;
  const initialList = list.slice(0, maxLength);
  initialList.push(restLength + ' other ' + itemsName);
  return joinAnd(initialList);
}

/**
 * Takes a string and ensures it does not exceed a given length.
 *
 * @usage[js]
 * truncate('Hello world', 5)
 * // => 'Hello…'
 *
 * @param {string} str
 * @param {number} length
 * @returns {string}
 */
export function truncate(str, length) {
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
 * truncateMiddle('Hello world wide web', 8, 3)
 * // => 'Hello…web'
 *
 * @param {string} str
 * @param {number} length
 * @param {number} endOfStrLength
 * @returns {string}
 */
export function truncateMiddle(str, length, endOfStrLength) {
  if (length < endOfStrLength) {
    throw new Error('`length` has to be greater or equal to `endOfStrLength`');
  }
  if (str && str.length > length) {
    const endOfStr = str.substr(-endOfStrLength).replace(/^\./, ''); // Avoid visually awkward “….”.
    const beginningOfStr = truncate(str, length - endOfStrLength);
    return beginningOfStr + endOfStr;
  } else {
    return str;
  }
}

/**
 * startsWithVowel('Abracadabra')
 * // => true
 *
 * @param {string} str
 * @returns {boolean}
 */
export function startsWithVowel(str) {
  if (!_.isString(str) || str.length < 1) {
    return false;
  }
  const firstLetter = str.substr(0, 1).toLowerCase();
  return ['a', 'e', 'i', 'o', 'u'].indexOf(firstLetter) > -1;
}

/**
 * Removes whitespaces from the beginning and the end and replaces
 * multiple whitespaces by one.
 *
 * normalizeWhiteSpace('  a  b  ')
 * // => 'a b'
 *
 * @param {string} str
 * @returns {string}
 */
export function normalizeWhiteSpace(string) {
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
export const emailRegex = RegExp(
  '(?!.{255})' + // Lookahead assertion limiting length of email address to under 255 chars
  '(^\\s*' + // Start of string and arbitrary amount of whitespace
  '([^@\\s]{1,64})' + // Part of address before @, limited to under 64 chars
  '@' + // The @ symbol itself
  '((?:[\\w\\d-]+\\.)' + // Domain portion (limited to letters and numbers), including the period
  '+[a-z]{2,}' + // The TLD
    ')\\s*$)', // Arbitrary whitespace and end of string
  'i'
);

export function isValidEmail(string) {
  return emailRegex.test(string);
}

export const urlRegex = /^(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-/]))?$/;

export function isValidUrl(value) {
  return urlRegex.test(value);
}

/**
 * Takes an array and joins with "," and "and".
 *
 * TODO: Do we really need/want the `oxford` parameter? It's not used anywhere.
 *
 * @usage[js]
 * joinWithAnd(['one', 'two', 'three'])
 * // => 'one, two and, three
 *
 * @param items
 * @param oxford
 * @returns {*}
 */
export function joinWithAnd(items, oxford = true) {
  if (!Array.isArray(items)) {
    return null;
  }

  return items.reduce((memo, item, i) => {
    if (i === 0) {
      return item;
    } else if (i === items.length - 1) {
      return `${memo}${oxford ? ',' : ''} and ${item}`;
    } else {
      return `${memo}, ${item}`;
    }
  }, '');
}
