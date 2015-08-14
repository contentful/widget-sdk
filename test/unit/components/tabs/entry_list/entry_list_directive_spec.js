'use strict';

describe('The Entry list directive', function () {

  var container, scope;
  var compileElement;

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      $provide.removeDirectives('viewCustomizer');
      $provide.removeControllers('EntryListController');
    });
    inject(function ($rootScope, $compile, enforcements) {
      scope = $rootScope.$new();

      scope.selection = {
        getSelected: sinon.stub(),
        isSelected: sinon.stub()
      };
      scope.context = { view: {} };
      scope.spaceContext = {
        space: {
          data: {sys: {createdBy: {sys: {id: ''}}}},
          getId: sinon.stub()
        }
      };

      scope.permissionController = {
        get: sinon.stub()
      };
      scope.permissionController.get.returns(false);

      enforcements.setSpaceContext(scope.spaceContext);

      compileElement = function () {
        container = $('<div cf-entry-list></div>');
        $compile(container)(scope);
        scope.$digest();
      };
    });
  });

  afterEach(function () {
    container.remove();
  });

  function makeActionTest(button, action) {
    it(button+' button not shown', function () {
      scope.permissionController.get.withArgs(action+'Entry', 'shouldHide').returns(true);
      compileElement();
      expect(container.find('.workbench-actions .'+button)).toBeNgHidden();
    });

    it(button+' button shown', function () {
      compileElement();
      expect(container.find('.tab-actions .'+button)).not.toBeNgHidden();
    });
  }

  makeActionTest('duplicate', 'create');
  makeActionTest('delete', 'delete');
  makeActionTest('unarchive', 'unarchive');
  makeActionTest('archive', 'archive');
  makeActionTest('unpublish', 'unpublish');
  makeActionTest('publish', 'publish');

  describe('list of entries is filtered', function() {
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
      scope.entries = [
        {getId: idStub1, getName: nameStub},
        {getId: idStub2, getName: nameStub},
        {getId: idStub3, getName: nameStub}
      ];

      listFilterStub = sinon.stub();
      scope.visibleInCurrentList = listFilterStub;
      listFilterStub.withArgs(scope.entries[0]).returns(true);
      listFilterStub.withArgs(scope.entries[1]).returns(true);
      listFilterStub.withArgs(scope.entries[2]).returns(false);

      compileElement();
      list = container.find('.main-results tbody');
    });

    it('list has 2 elements', function () {
      expect(list.find('tr').length).toBe(2);
    });
  });

});
