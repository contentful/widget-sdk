'use strict';

describe('cfAutocompleteResultsController', () => {
  let controller, scope;
  afterEach(() => {
    controller = scope = null;
  });

  beforeEach(function() {
    module('contentful/test');

    const $rootScope = this.$inject('$rootScope');
    scope = $rootScope.$new();
    scope.searchController = {
      clearSearch: sinon.stub()
    };

    const $controller = this.$inject('$controller');
    controller = $controller('CfAutocompleteResultsController', {
      $scope: scope,
      $attrs: { cfAutocompleteResults: 'results' }
    });
  });

  it('should adjust selectedIndex, numResults when results change', () => {
    scope.results = [1, 2, 3, 4];
    scope.$apply();
    expect(controller.selectedIndex).toBe(0);
    expect(controller.numResults).toBe(4);

    scope.results = null;
    scope.$apply();
    expect(controller.selectedIndex).toBe(-1);
    expect(controller.numResults).toBe(0);
  });

  it('should return the selected element from the autocompleteResults in getSelected', () => {
    scope.results = [1, 2, 3, 4];
    scope.$apply();
    expect(controller.getSelectedResult()).toBe(1);
    controller.selectNext();
    controller.selectNext();
    expect(controller.getSelectedResult()).toBe(3);
  });

  it('should never go past the upper border with selectNext', () => {
    scope.results = [1, 2, 3, 4];
    scope.$apply();
    controller.selectedIndex = 3;
    controller.selectNext();
    expect(controller.selectedIndex).toBe(3);
  });

  it('should never go past 0 with selectPrevious', () => {
    scope.results = [1, 2, 3, 4];
    scope.$apply();
    controller.selectedIndex = 0;
    controller.selectPrevious();
    expect(controller.selectedIndex).toBe(0);
  });

  it('should never move with empty results', () => {
    expect(controller.selectedIndex).toBe(-1);
    controller.selectNext();
    expect(controller.selectedIndex).toBe(-1);
    controller.selectPrevious();
    expect(controller.selectedIndex).toBe(-1);
  });

  it('should broadcast when moving', () => {
    scope.results = ['a', 'b', 'c'];
    scope.$apply();
    spyOn(scope, '$broadcast');
    controller.selectNext();
    expect(scope.$broadcast).toHaveBeenCalledWith('autocompleteResultSelected', 1, 'b');
    controller.selectPrevious();
    expect(scope.$broadcast).toHaveBeenCalledWith('autocompleteResultSelected', 0, 'a');
  });

  it('should emit event when picked', () => {
    scope.results = ['a', 'b', 'c'];
    scope.$apply();
    spyOn(scope, '$emit').and.returnValue({
      defaultPrevented: false
    });
    controller.pickSelected();
    expect(scope.$emit).toHaveBeenCalledWith('autocompleteResultPicked', 0, 'a');
  });

  it('should emit an event when the search when canceled', () => {
    spyOn(scope, '$emit').and.callThrough();
    controller.cancelAutocomplete();
    expect(scope.$emit).toHaveBeenCalledWith('autocompleteResultsCancel');
  });

  it('should handle the event if canceling search', () => {
    spyOn(scope, '$emit').and.returnValue({ defaultPrevented: false });
    expect(controller.cancelAutocomplete()).toBe(true);
  });

  it("should not handle the event if canceling search doesn't do anything", () => {
    spyOn(scope, '$emit').and.returnValue({ defaultPrevented: true });
    expect(controller.cancelAutocomplete()).toBe(false);
  });

  it('should return false from the action methods if operating on a normal list', () => {
    scope.results = [1, 2, 3];
    scope.$apply();
    expect(controller.selectPrevious()).toBe(true);
    expect(controller.selectNext()).toBe(true);
    expect(controller.pickSelected()).toBe(true);
    expect(controller.cancelAutocomplete()).toBe(true);
  });

  it('should return false from the action methods if operating on an empty list', () => {
    scope.results = null;
    scope.$apply();
    expect(controller.selectNext()).toBe(false);
    expect(controller.selectPrevious()).toBe(false);
    expect(controller.pickSelected()).toBe(false);
  });
});
