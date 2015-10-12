'use strict';

describe('"Insert Asset" dialog controller', function () {
  var $controller, scope;

  function createController() {
    $controller('InsertAssetDialogController', { $scope: scope });
    scope.searchController = {
      paginator: { page: 0, pageLength: 10 },
      resetAssets: _.noop
    };
    scope.$apply();
    scope.context = { view: {} };
    scope.searchController.resetAssets = sinon.stub();
  }

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      $provide.removeControllers('AssetSearchController');
    });
    $controller = this.$inject('$controller');
    scope = this.$inject('$rootScope').$new();
  });

  describe('initialization', function () {
    it('does not read stored filters state', function () {
      var readStub = sinon.stub();
      var FilterQS = this.$inject('FilterQueryString');
      FilterQS.create = _.constant({ readView: readStub });
      createController();
      sinon.assert.notCalled(readStub);
    });
  });

  describe('resetting list', function () {
    beforeEach(createController);

    it('resets list when changing search term', function () {
      scope.context.view.searchTerm = 'test';
      scope.$apply();
      sinon.assert.calledOnce(scope.searchController.resetAssets);
    });

    it('resets list when paginator settings change', function () {
      scope.searchController.paginator.page = 1;
      scope.$apply();
      scope.searchController.paginator.pageLength = 20;
      scope.$apply();
      sinon.assert.calledTwice(scope.searchController.resetAssets);
    });
  });
});
