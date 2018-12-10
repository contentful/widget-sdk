'use strict';

angular.module('contentful').factory('search/cachedParser', [
  'require',
  require => {
    const searchParser = require('searchParser');

    return function createParser() {
      let cachedInput;
      let cachedResult = [];

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
