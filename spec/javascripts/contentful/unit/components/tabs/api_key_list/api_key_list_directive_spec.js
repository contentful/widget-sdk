'use strict';

describe('The ApiKey list directive', function () {

  var container, scope;
  var compileElement;
  var canStub, reasonsStub;

  beforeEach(function () {
    canStub = sinon.stub();
    reasonsStub = sinon.stub();
    module('contentful/test', function (cfCanStubsProvider, $provide) {
      cfCanStubsProvider.setup(reasonsStub);
      $provide.removeDirectives('relative');
    });
    inject(function ($rootScope, $compile, enforcements) {
      scope = $rootScope.$new();
      scope.can = canStub;
      scope.spaceContext = {
        space: {
          data: {sys: {createdBy: {sys: {id: ''}}}},
          getApiKeys: sinon.stub()
        }
      };
      enforcements.setSpaceContext(scope.spaceContext);

      compileElement = function () {
        container = $('<div class="api-key-list"></div>');
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
      canStub.withArgs('create', 'ApiKey').returns(false);
      compileElement();
      expect(container.find('.tab-header .add-entity .primary-button')).toBeNgHidden();
    });

    it('is shown', function() {
      canStub.withArgs('create', 'ApiKey').returns(true);
      compileElement();
      expect(container.find('.tab-header .add-entity .primary-button')).not.toBeNgHidden();
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
    canStub.withArgs('create', 'ApiKey').returns(false);
    reasonsStub.returns(['usageExceeded']);
    compileElement();
    expect(container.find('.advice button').attr('disabled')).toBe('disabled');
  });

  it('save button is enabled', function () {
    canStub.withArgs('create', 'ApiKey').returns(true);
    compileElement();
    expect(container.find('.advice button').attr('disabled')).toBeUndefined();
  });



});
