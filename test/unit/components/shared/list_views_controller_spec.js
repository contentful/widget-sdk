'use strict';

describe('ListViewsController', () => {
  let $scope, resetList;
  afterEach(() => {
    $scope = resetList = null;
  });

  beforeEach(function() {
    module('contentful/test', $provide => {
      $provide.constant('data/ListViewPersistor.es6', {
        default: () => ({
          read: () => ({ from_qs: 'test' }),
          save: () => {}
        })
      });
    });

    $scope = Object.assign(this.$inject('$rootScope').$new(), { context: {} });
    resetList = sinon.stub();

    this.$inject('$controller')('ListViewsController', {
      $scope,
      entityType: 'Entry',
      getBlankView: () => ({ id: 'blankView' }),
      resetList
    });

    $scope.$apply();
  });

  describe('initialization', () => {
    it('reads view from the query string service', () => {
      expect($scope.context.view.from_qs).toBe('test');
    });
  });

  describe('loading view', () => {
    it('should assign a deep copy of the view to the tab and reset the list', () => {
      const view = { id: 'foo' };
      $scope.loadView(view);
      expect($scope.context.view.id).toBe('foo');
      expect($scope.context.view).not.toBe(view);
      sinon.assert.called(resetList);
    });
  });
});
