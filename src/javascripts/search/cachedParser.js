'use strict';

angular.module('contentful')
.factory('search/cachedParser', ['$injector', function($injector) {
  var searchParser = $injector.get('searchParser');

  return function createParser () {
    var cachedInput;
    var cachedResult = [];

    return function parse (input) {
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

}]);
