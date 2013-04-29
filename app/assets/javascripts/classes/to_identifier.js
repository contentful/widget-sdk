'use strict';

angular.module('contentful/classes').
  constant('toIdentifier', toIdentifier);

function capitalize(string) {
  if (_.isEmpty(string)) return '';
  return string[0].toUpperCase() + string.slice(1).toLowerCase();
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

function toIdentifier(string) {
  var words = splitIntoWords(string).map(stripInvalidChars);
  if (_.isEmpty(words)) return;
  var first = words[0].toLowerCase();
  var rest =  words.slice(1).map(capitalize);
  return cleanPrefix([first].concat(rest).join(''));
}
