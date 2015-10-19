'use strict';

describe('The Asset list directive', function () {

  var container, scope;
  var compileElement;

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      $provide.removeDirectives('relative');
      $provide.removeControllers('PermissionController', 'AssetListController');
    });
    inject(function ($rootScope, $compile) {
      scope = $rootScope.$new();

      scope.selection = {
        getSelected: sinon.stub(),
        isSelected: sinon.stub()
      };

      scope.tab = {
        params: {}
      };
      scope.loadView = _.noop;
      scope.spaceContext = {
        space: {
          data: {sys: {createdBy: {sys: {id: ''}}}},
          getId: sinon.stub()
        }
      };
      scope.validate = sinon.stub();

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
