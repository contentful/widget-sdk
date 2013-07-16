'use strict';

describe('cfSearchResultsDirective', function () {
  var scope, elem, controller;

  beforeEach(module('contentful/test'));

  beforeEach(inject(function ($compile, $rootScope){
    scope = $rootScope;
    elem = $compile('<div cf-search-results="results" search-term="searchTerm"></div>')($rootScope);
    controller = elem.controller('cfSearchResults');
  }));

  it('should set setters and getters in the controller', function () {
    scope.results = [1,2,3];
    scope.searchTerm = 'foobar';
    scope.$apply();
    expect(controller.getSelectedResult()).toBe(1);
    controller.cancelSearch();
    expect(scope.searchTerm).toBe('');
  });

});
