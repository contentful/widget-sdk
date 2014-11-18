'use strict';

angular.module('contentful').constant('stringUtils', (function(){
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

  return {
    toIdentifier: toIdentifier,
    capitalize: capitalize,
    capitalizeFirst: capitalizeFirst,
    uncapitalize: uncapitalize,
    splitIntoWords: splitIntoWords,
    stripInvalidChars: stripInvalidChars,
    removeQueryString: removeQueryString,
    removeExtension: removeExtension,
    fileNameToTitle: fileNameToTitle,
    titleToFileName: titleToFileName
  };
})());
