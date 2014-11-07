'use strict';

describe('The ContentType list directive', function () {

  var container, scope;
  var compileElement;

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      $provide.removeDirectives('relative');
      $provide.removeControllers('PermissionController');
    });
    inject(function ($rootScope, $compile, contentTypeListDirective, enforcements) {
      scope = $rootScope.$new();

      contentTypeListDirective[0].controller = function () {};

      scope.permissionController = {
        createContentType: {
          shouldHide: false,
          shouldDisable: false
        }
      };

      enforcements.setSpaceContext({
        space: {
          data: {sys: {createdBy: {sys: {id: ''}}}}
        }
      });

      compileElement = function () {
        container = $('<div class="content-type-list"></div>');
        $compile(container)(scope);
        scope.$digest();
      };
    });
  });

  afterEach(inject(function ($log) {
    $log.assertEmpty();
    container.remove();
  }));

  describe('the tab header add button', function() {
    it('is not shown', function() {
      scope.permissionController.createContentType.shouldHide = true;
      compileElement();
      expect(container.find('.tab-header .add-entity .btn--primary')).toBeNgHidden();
    });

    it('is shown', function() {
      compileElement();
      expect(container.find('.tab-header .add-entity .btn--primary')).not.toBeNgHidden();
    });
  });

  it('save button is disabled', function () {
    scope.permissionController.createContentType.shouldDisable = true;
    compileElement();
    expect(container.find('.advice .btn--primary').attr('disabled')).toBe('disabled');
  });

  it('save button is enabled', function () {
    compileElement();
    expect(container.find('.advice .btn--primary').attr('disabled')).toBeUndefined();
  });

  describe('list of content types is filtered', function() {
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
      scope.contentTypes = [
        {getId: idStub1, getName: nameStub},
        {getId: idStub2, getName: nameStub},
        {getId: idStub3, getName: nameStub}
      ];

      listFilterStub = sinon.stub();
      scope.visibleInCurrentList = listFilterStub;
      listFilterStub.withArgs(scope.contentTypes[0]).returns(true);
      listFilterStub.withArgs(scope.contentTypes[1]).returns(true);
      listFilterStub.withArgs(scope.contentTypes[2]).returns(false);

      compileElement();
      list = container.find('.main-results tbody');
    });

    it('list has 2 elements', function () {
      expect(list.find('tr').length).toBe(2);
    });
  });

});
