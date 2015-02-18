'use strict';

describe('The Asset list directive', function () {

  var container, scope;
  var compileElement;

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      $provide.removeDirectives('relative');
      $provide.removeControllers('PermissionController', 'AssetListController');
    });
    inject(function ($rootScope, $compile, enforcements) {
      scope = $rootScope.$new();

      scope.selection = {
        getSelected: sinon.stub(),
        isSelected: sinon.stub()
      };

      scope.tab = {
        params: {}
      };
      scope.spaceContext = {
        space: {
          data: {sys: {createdBy: {sys: {id: ''}}}},
          getId: sinon.stub()
        }
      };
      scope.validate = sinon.stub();

      enforcements.setSpaceContext(scope.spaceContext);

      scope.permissionController = {
        get: sinon.stub()
      };
      scope.permissionController.get.returns(false);

      compileElement = function () {
        container = $('<div cf-asset-list></div>');
        $compile(container)(scope);
        scope.$digest();
      };
    });
  });

  afterEach(function () {
    container.remove();
  });

  describe('the tab header add button', function() {
    it('is not shown', function() {
      scope.permissionController.get.withArgs('createAsset', 'shouldHide').returns(true);
      compileElement();
      expect(container.find('.tab-header .add-entity .btn--primary')).toBeNgHidden();
    });

    it('is shown', function() {
      compileElement();
      expect(container.find('.tab-header .add-entity .btn--primary')).not.toBeNgHidden();
    });
  });

  function makeActionTest(button, action) {
    it(button+' button not shown', function () {
      scope.permissionController.get.withArgs(action+'Asset', 'shouldHide').returns(true);
      compileElement();
      expect(container.find('.tab-actions .'+button)).toBeNgHidden();
    });

    it(button+' button shown', function () {
      compileElement();
      expect(container.find('.tab-actions .'+button)).not.toBeNgHidden();
    });
  }

  makeActionTest('delete', 'delete');
  makeActionTest('unarchive', 'unarchive');
  makeActionTest('archive', 'archive');
  makeActionTest('unpublish', 'unpublish');
  makeActionTest('publish', 'publish');

  it('create button is disabled', function () {
    scope.permissionController.get.withArgs('createAsset', 'shouldDisable').returns(true);
    compileElement();
    expect(container.find('.advice .btn--primary').attr('disabled')).toBe('disabled');
  });

  it('create button is enabled', function () {
    compileElement();
    expect(container.find('.advice .btn--primary').attr('disabled')).toBeUndefined();
  });

  describe('list of assets is filtered', function() {
    var list;
    var idStub1, idStub2, idStub3, nameStub, listFilterStub;
    beforeEach(function() {
      idStub1 = sinon.stub();
      idStub1.returns(1);
      idStub2 = sinon.stub();
      idStub2.returns(2);
      idStub3 = sinon.stub();
      idStub3.returns(3);
      nameStub = sinon.stub();
      nameStub.returns('name');
      scope.assets = [
        {getId: idStub1, getName: nameStub},
        {getId: idStub2, getName: nameStub},
        {getId: idStub3, getName: nameStub}
      ];

      listFilterStub = sinon.stub();
      scope.visibleInCurrentList = listFilterStub;
      listFilterStub.withArgs(scope.assets[0]).returns(true);
      listFilterStub.withArgs(scope.assets[1]).returns(true);
      listFilterStub.withArgs(scope.assets[2]).returns(false);

      compileElement();
      list = container.find('.main-results tbody');
    });

    it('list has 2 elements', function () {
      expect(list.find('tr').length).toBe(2);
    });
  });

});
