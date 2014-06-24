'use strict';

describe('ListViewsController', function () {
  var controller, scope, $q;
  var getBlankView, generateDefaultViews, resetList;

  beforeEach(module('contentful/test'));
  beforeEach(inject(function ($controller, $rootScope, _$q_) {
    $q = _$q_;
    scope = $rootScope.$new();
    scope.tab = {params: {}};
    controller = $controller('ListViewsController', {
      $scope: scope,
      getBlankView: getBlankView = sinon.stub().returns({id: 'blankView'}),
      viewCollectionName: 'views',
      generateDefaultViews: generateDefaultViews = sinon.stub().returns(['defaultViews']),
      resetList: resetList = sinon.stub()
    });
    scope.$apply();
  }));
  afterEach(inject(function ($log) {
    $log.assertEmpty();
  }));

  describe('when the uiConfig changes', function () {
    it('should generate the default views', function () {
      scope.uiConfig = {};
      scope.$apply();
      expect(scope.uiConfig.views).toEqual(['defaultViews']);
    });
  });

  describe('resetViews', function () {
    it('should generate, assign and save the default Views', function () {
      scope.uiConfig = {};
      sinon.stub(scope, 'saveViews');
      scope.resetViews();
      expect(scope.uiConfig.views).toEqual(['defaultViews']);
      expect(scope.saveViews).toBeCalled();
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
      expect(scope.tab.params.view.id).toBe('blankView');
      expect(resetList).toBeCalled();
    });
  });

  describe('loadView', function () {
    it('should assign a deep copy of the view to the tab, reset the title and reset the list', function () {
      var view = {id: 'foo'};
      scope.loadView(view);
      expect(scope.tab.params.view.id).toBe('foo');
      expect(scope.tab.params.view).not.toBe(view);
      expect(scope.tab.params.view.title).toBe('New View');
      expect(resetList).toBeCalled();
    });
  });

  describe('saveViews', function () {
    it('should call saveUiConfig and return the promise', function () {
      var handler = sinon.stub();
      scope.saveUiConfig = sinon.stub().returns($q.when());
      scope.saveViews().then(handler);
      scope.$apply();
      expect(scope.saveUiConfig).toBeCalled();
      expect(handler).toBeCalled();
    });
    it('should show an error notification', function () {
      var serverError;
      inject(function (notification) {
        serverError = sinon.stub(notification, 'serverError');
      });
      var errorHandler = sinon.stub();
      scope.saveUiConfig = sinon.stub().returns($q.reject());
      scope.saveViews().catch(errorHandler);
      scope.$apply();
      expect(errorHandler).toBeCalled();
      expect(serverError).toBeCalled();
    });
  });
});
