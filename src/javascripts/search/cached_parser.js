'use strict';

angular.module('contentful').factory('search/cachedParser', [
  'require',
  require => {
    var searchParser = require('searchParser');

    return function createParser() {
      var cachedInput;
      var cachedResult = [];

      return function parse(input) {
        if (input === cachedInput) {
          return cachedResult;
        }

        try {
          cachedResult = searchParser.parse(input);
        } catch (e) {
          cachedResult = [];
        }

        cachedInput = input;
        return cachedResult;
      };
    };
  }
]);
