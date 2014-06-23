'use strict';

describe('cfAutocompleteResultsController', function () {
  var controller, scope;

  beforeEach(module('contentful/test'));

  beforeEach(inject(function ($controller, $rootScope, $parse){
    scope = $rootScope;
    scope.searchController = {
      clearSearch: sinon.stub()
    };
    controller = $controller('CfAutocompleteResultsCtrl', {
      $scope: $rootScope,
      $attrs: {cfAutocompleteResults: 'results'}});
    controller.getAutocompleteResults = $parse('results');
  }));

  afterEach(inject(function ($log) {
    $log.assertEmpty();
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

  it('should clear the search when canceled', function () {
    controller.cancelAutocomplete();
    expect(scope.searchController.clearSearch).toBeCalled();
  });

  it('should return the selected element from the autocompleteResults in getSelected', function () {
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
    expect(scope.$broadcast).toHaveBeenCalledWith('autocompleteResultSelected', 1, 'b');
    controller.selectPrevious();
    expect(scope.$broadcast).toHaveBeenCalledWith('autocompleteResultSelected', 0, 'a');
  });

  it('should emit when picked', function () {
    scope.results = ['a', 'b', 'c'];
    scope.$apply();
    spyOn(scope, '$emit').and.returnValue({
      defaultPrevented: false
    });
    controller.pickSelected();
    expect(scope.$emit).toHaveBeenCalledWith('autocompleteResultPicked', 0, 'a');
  });

  it('should cancel Autocomplete if not prevented after pick', function () {
    scope.results = ['a', 'b', 'c'];
    scope.searchTerm = 'foobar';
    scope.$apply();

    spyOn(scope, '$emit').and.returnValue({ defaultPrevented: false });
    controller.pickSelected();
    expect(scope.searchController.clearSearch).toBeCalled();
  });

  it('should not cancel Autocomplete if prevented after pick', function () {
    scope.results = ['a', 'b', 'c'];
    scope.searchTerm = 'foobar';
    scope.$apply();

    spyOn(scope, '$emit').and.returnValue({ defaultPrevented: true });
    controller.pickSelected();
    expect(scope.searchTerm).toBe('foobar');
  });
});
