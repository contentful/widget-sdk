'use strict';
import _ from 'lodash';

describe('ListViewsController', () => {
  let scope, resetList;
  afterEach(() => {
    scope = resetList = null;
  });

  beforeEach(function() {
    module('contentful/test');
    const $controller = this.$inject('$controller');
    const ListViewPersistor = this.$inject('data/ListViewPersistor.es6');

    this.$inject('mocks/spaceContext').init();

    scope = this.$inject('$rootScope').$new();
    scope.context = {};
    scope.selection = { clear: sinon.spy() };
    ListViewPersistor.default = _.constant({
      read: sinon.stub().resolves({ from_qs: 'test' }),
      save: _.noop
    });

    $controller('ListViewsController', {
      $scope: scope,
      getBlankView: sinon.stub().returns({ id: 'blankView' }),
      preserveStateAs: 'test',
      resetList: (resetList = sinon.stub())
    });

    scope.$apply();
  });

  describe('initialization', () => {
    it('reads view from the query string service', () => {
      expect(scope.context.view.from_qs).toBe('test');
    });
  });

  describe('loading view', () => {
    it('should assign a deep copy of the view to the tab and reset the list', () => {
      const view = { id: 'foo' };
      scope.loadView(view);
      expect(scope.context.view.id).toBe('foo');
      expect(scope.context.view).not.toBe(view);
      sinon.assert.called(resetList);
    });
  });
});
