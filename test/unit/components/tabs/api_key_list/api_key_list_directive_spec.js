'use strict';

describe('The ApiKey list directive', function () {

  var container, scope;
  var compileElement;

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      $provide.removeDirectives('relative');
      $provide.removeControllers('PermissionController');
    });
    inject(function ($rootScope, $compile, enforcements, $q) {
      scope = $rootScope.$new();
      scope.spaceContext = {
        space: {
          data: {sys: {createdBy: {sys: {id: ''}}}},
          getDeliveryApiKeys: sinon.stub().returns($q.defer().promise)
        }
      };

      scope.permissionController = {
        get: sinon.stub()
      };
      scope.permissionController.get.returns(false);

      enforcements.setSpaceContext(scope.spaceContext);

      compileElement = function () {
        container = $('<div class="api-key-list"></div>');
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
      scope.permissionController.get.withArgs('createApiKey', 'shouldHide').returns(true);
      compileElement();
      expect(container.find('.tab-header .add-entity .btn--primary')).toBeNgHidden();
    });

    it('is shown', function() {
      compileElement();
      expect(container.find('.tab-header .add-entity .btn--primary')).not.toBeNgHidden();
    });
  });


  describe('list of api keys', function() {
    var list;
    var idStub1, idStub2, nameStub;
    beforeEach(function() {
      idStub1 = sinon.stub();
      idStub1.returns(1);
      idStub2 = sinon.stub();
      idStub2.returns(2);
      nameStub = sinon.stub();
      nameStub.returns('name');
      scope.apiKeys = [
        {getId: idStub1, getName: nameStub},
        {getId: idStub2, getName: nameStub}
      ];

      compileElement();
      list = container.find('.main-results tbody');
    });

    it('list has 2 elements', function () {
      expect(list.find('tr').length).toBe(2);
    });
  });

  it('save button is disabled', function () {
    scope.permissionController.get.withArgs('createApiKey', 'shouldDisable').returns(true);
    compileElement();
    expect(container.find('.advice button').attr('disabled')).toBe('disabled');
  });

  it('save button is enabled', function () {
    compileElement();
    expect(container.find('.advice button').attr('disabled')).toBeUndefined();
  });



});
