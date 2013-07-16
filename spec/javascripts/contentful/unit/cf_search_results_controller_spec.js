'use strict';

describe('cfSearchResultsController', function () {
  var controller, scope;

  beforeEach(module('contentful/test'));

  beforeEach(inject(function ($controller, $rootScope, $parse){
    scope = $rootScope;
    //$rootScope.results  = [1,2,3,4];
    //$rootScope.searchTerm = '';
    controller = $controller('CfSearchResultsCtrl', {$scope: $rootScope});
    controller.getSearchResults = $parse('results');
    controller.setSearchTerm = $parse('searchTerm').assign;
  }));

  it('should adjust selectedIndex, numResults', function () {
    scope.results = [1,2,3,4];
    scope.$apply();
    expect(controller.selectedIndex).toBe(0);
    expect(controller.numResults).toBe(4);

    scope.results = null;
    scope.$apply();
    expect(controller.selectedIndex).toBe(-1);
    expect(controller.numResults).toBe(0);
  });
    
  it('should set searchTerm to 0 when canceled', function () {
    scope.searchTerm = 'foobar';
    controller.cancelSearch();
    expect(scope.searchTerm).toBe('');
  });

  it('should return the selected element from the searchResults in getSelected', function () {
    scope.results = [1,2,3,4];
    scope.$apply();
    expect(controller.getSelectedResult()).toBe(1);
    controller.selectNext();
    controller.selectNext();
    expect(controller.getSelectedResult()).toBe(3);
  });

  it('should never go past the upper border with selectNext', function () {
    scope.results = [1,2,3,4];
    scope.$apply();
    controller.selectedIndex = 3;
    controller.selectNext();
    expect(controller.selectedIndex).toBe(3);
  });

  it('should never go past 0 with selectPrevious', function () {
    scope.results = [1,2,3,4];
    scope.$apply();
    controller.selectedIndex = 0;
    controller.selectPrevious();
    expect(controller.selectedIndex).toBe(0);
  });

  it('should never move with empty results', function () {
    expect(controller.selectedIndex).toBe(-1);
    controller.selectNext();
    expect(controller.selectedIndex).toBe(-1);
    controller.selectPrevious();
    expect(controller.selectedIndex).toBe(-1);
  });

  it('should broadcast when moving', function () {
    scope.results = ['a', 'b', 'c'];
    scope.$apply();
    spyOn(scope, '$broadcast');
    controller.selectNext();
    expect(scope.$broadcast).toHaveBeenCalledWith('searchResultSelected', 1, 'b');
    controller.selectPrevious();
    expect(scope.$broadcast).toHaveBeenCalledWith('searchResultSelected', 0, 'a');
  });

  it('should emit when picked', function () {
    scope.results = ['a', 'b', 'c'];
    scope.$apply();
    spyOn(scope, '$emit').andReturn({
      defaultPrevented: false
    });
    controller.pickSelected();
    expect(scope.$emit).toHaveBeenCalledWith('searchResultPicked', 0, 'a');
  });

  it('should cancel Search if not prevented after pick', function () {
    scope.results = ['a', 'b', 'c'];
    scope.searchTerm = 'foobar';
    scope.$apply();

    spyOn(scope, '$emit').andReturn({ defaultPrevented: false });
    controller.pickSelected();
    expect(scope.searchTerm).toBe('');
  });

  it('should not cancel Search if prevented after pick', function () {
    scope.results = ['a', 'b', 'c'];
    scope.searchTerm = 'foobar';
    scope.$apply();

    spyOn(scope, '$emit').andReturn({ defaultPrevented: true });
    controller.pickSelected();
    expect(scope.searchTerm).toBe('foobar');
  });
});

// it should watch searchResults param
// it should watch searchTerm param
//
