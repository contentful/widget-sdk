'use strict';

describe('ListViewsController', function () {
  let scope, generateDefaultViews, resetList;
  afterEach(function () {
    scope = generateDefaultViews = resetList = null;
  });

  beforeEach(function () {
    module('contentful/test');
    const $controller = this.$inject('$controller');
    const ListViewPersistor = this.$inject('data/ListViewPersistor');

    this.mockService('notification');
    this.$inject('mocks/spaceContext').init();
    scope = this.$inject('$rootScope').$new();
    scope.context = {};
    scope.selection = {clear: sinon.spy()};
    ListViewPersistor.default = _.constant({ read: _.constant({ from_qs: 'test' }), save: _.noop });

    $controller('ListViewsController', {
      $scope: scope,
      getBlankView: sinon.stub().returns({id: 'blankView'}),
      viewCollectionName: 'views',
      preserveStateAs: 'test',
      generateDefaultViews: generateDefaultViews = sinon.stub().returns(['defaultViews']),
      resetList: resetList = sinon.stub()
    });

    scope.$apply();
  });

  describe('initialization', function () {
    it('reads view from the query string service', function () {
      expect(scope.context.view.from_qs).toBe('test');
    });
  });

  describe('when the uiConfig changes', function () {
    it('should generate the default views', function () {
      scope.uiConfig = {};
      scope.$apply();
      sinon.assert.calledWith(generateDefaultViews, true);
      expect(scope.uiConfig.views).toEqual(['defaultViews']);
    });
  });

  describe('resetViews', function () {
    it('should generate, assign and save the default Views', function () {
      scope.uiConfig = {};
      sinon.stub(scope, 'saveViews');
      scope.resetViews();
      expect(scope.uiConfig.views).toEqual(['defaultViews']);
      sinon.assert.called(scope.saveViews);
    });
    xit('should do ??? when scope.uiConfig is missing', function () {
      sinon.stub(scope, 'saveViews');
      scope.resetViews();
      // Do what? No idea yet unspecified really, because without uiConfig, no views at all
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
    it('should call saveUiConfig and return the promise', function () {
      const handler = sinon.stub();
      scope.saveUiConfig = sinon.stub().resolves();
      scope.saveViews().then(handler);
      scope.$apply();
      sinon.assert.called(scope.saveUiConfig);
      sinon.assert.called(handler);
    });
    it('should show an error notification', function () {
      const notification = this.$inject('notification');
      const logger = this.$inject('logger');
      const errorHandler = sinon.stub();
      scope.saveUiConfig = sinon.stub().rejects();
      scope.saveViews().catch(errorHandler);
      scope.$apply();
      sinon.assert.called(errorHandler);
      sinon.assert.called(notification.error);
      sinon.assert.called(logger.logServerWarn);
    });
  });
});
