'use strict';

describe('cfAutocompleteResultsController', function () {
  var controller, scope;

  beforeEach(module('contentful/test'));

  beforeEach(inject(function ($controller, $rootScope){
    scope = $rootScope;
    scope.searchController = {
      clearSearch: sinon.stub()
    };
    controller = $controller('CfAutocompleteResultsController', {
      $scope: $rootScope,
      $attrs: {cfAutocompleteResults: 'results'}});
  }));

  afterEach(inject(function ($log) {
    $log.assertEmpty();
  }));

  it('should adjust selectedIndex, numResults when results change', function () {
    scope.results = [1,2,3,4];
    scope.$apply();
    expect(controller.selectedIndex).toBe(0);
    expect(controller.numResults).toBe(4);

    scope.results = null;
    scope.$apply();
    expect(controller.selectedIndex).toBe(-1);
    expect(controller.numResults).toBe(0);
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

  it('should emit event when picked', function () {
    scope.results = ['a', 'b', 'c'];
    scope.$apply();
    spyOn(scope, '$emit').and.returnValue({
      defaultPrevented: false
    });
    controller.pickSelected();
    expect(scope.$emit).toHaveBeenCalledWith('autocompleteResultPicked', 0, 'a');
  });

  it('should emit an event when the search when canceled', function () {
    spyOn(scope, '$emit').and.callThrough();
    controller.cancelAutocomplete();
    expect(scope.$emit).toHaveBeenCalledWith('autocompleteResultsCancel');
  });

  it('should handle the event if canceling search', function () {
    spyOn(scope, '$emit').and.returnValue({defaultPrevented: false});
    expect(controller.cancelAutocomplete()).toBe(true);
  });

  it('should not handle the event if canceling search doesn\'t do anything', function () {
    spyOn(scope, '$emit').and.returnValue({defaultPrevented: true});
    expect(controller.cancelAutocomplete()).toBe(false);
  });

  it('should return false from the action methods if operating on a normal list', function () {
    scope.results = [1,2,3];
    scope.$apply();
    expect(controller.selectPrevious()).toBe(true);
    expect(controller.selectNext()).toBe(true);
    expect(controller.pickSelected()).toBe(true);
    expect(controller.cancelAutocomplete()).toBe(true);
  });

  it('should return false from the action methods if operating on an empty list', function () {
    scope.results = null;
    scope.$apply();
    expect(controller.selectNext()).toBe(false);
    expect(controller.selectPrevious()).toBe(false);
    expect(controller.pickSelected()).toBe(false);
  });
});
