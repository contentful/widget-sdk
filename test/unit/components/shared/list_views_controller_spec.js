'use strict';

describe('ListViewsController', function () {
  let scope, resetList;
  afterEach(function () {
    scope = resetList = null;
  });

  beforeEach(function () {
    module('contentful/test');
    const $controller = this.$inject('$controller');
    const ListViewPersistor = this.$inject('data/ListViewPersistor');

    this.mockService('notification');
    this.$inject('mocks/spaceContext').init();
    this.uiConfig = {
      get: sinon.stub(),
      save: sinon.stub().resolves(),
      reset: sinon.stub().resolves()
    };

    scope = this.$inject('$rootScope').$new();
    scope.context = {};
    scope.selection = {clear: sinon.spy()};
    ListViewPersistor.default = _.constant({ read: _.constant({ from_qs: 'test' }), save: _.noop });

    $controller('ListViewsController', {
      $scope: scope,
      getBlankView: sinon.stub().returns({id: 'blankView'}),
      preserveStateAs: 'test',
      uiConfig: this.uiConfig,
      resetList: resetList = sinon.stub()
    });

    scope.$apply();
  });

  describe('initialization', function () {
    it('reads view from the query string service', function () {
      expect(scope.context.view.from_qs).toBe('test');
    });
  });

  describe('clearView', function () {
    it('should assign the blank view to tab and reset the list', function () {
      scope.clearView();
      expect(scope.context.view.id).toBe('blankView');
      sinon.assert.called(resetList);
    });
  });

  describe('loading view', function () {
    it('should assign a deep copy of the view to the tab, reset the title and reset the list', function () {
      const view = {id: 'foo'};
      scope.loadView(view);
      expect(scope.context.view.id).toBe('foo');
      expect(scope.context.view).not.toBe(view);
      expect(scope.context.view.title).toBe('New View');
      sinon.assert.called(resetList);
    });
  });

  describe('saveViews', function () {
    it('calls uiConfig.save()', function () {
      scope.saveViews();
      sinon.assert.calledOnceWith(this.uiConfig.save, scope.uiConfig);
    });

    it('shows an error notification if saving fails', function () {
      const notification = this.$inject('notification');
      const logger = this.$inject('logger');
      this.uiConfig.save.rejects();
      scope.saveViews();
      scope.$apply();
      sinon.assert.called(notification.error);
      sinon.assert.called(logger.logServerWarn);
    });
  });
});
