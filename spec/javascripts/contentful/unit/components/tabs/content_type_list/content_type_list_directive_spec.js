'use strict';

describe('The ContentType list directive', function () {

  var container, scope;
  var compileElement;
  var canStub, reasonsStub;

  beforeEach(function () {
    canStub = sinon.stub();
    reasonsStub = sinon.stub();
    module('contentful/test', function (cfCanStubsProvider) {
      cfCanStubsProvider.setup(reasonsStub);
    });
    inject(function ($rootScope, $compile, contentTypeListDirective, enforcements) {
      scope = $rootScope.$new();
      scope.can = canStub;

      contentTypeListDirective[0].controller = function () {};

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
      canStub.withArgs('create', 'ContentType').returns(false);
      compileElement();
      expect(container.find('.tab-header .add-entity .primary-button')).toBeNgHidden();
    });

    it('is shown', function() {
      canStub.withArgs('create', 'ContentType').returns(true);
      compileElement();
      expect(container.find('.tab-header .add-entity .primary-button')).not.toBeNgHidden();
    });
  });

  it('save button is disabled', function () {
    canStub.withArgs('create', 'ContentType').returns(false);
    reasonsStub.returns(['usageExceeded']);
    compileElement();
    expect(container.find('.advice .primary-button').attr('disabled')).toBe('disabled');
  });

  it('save button is enabled', function () {
    canStub.withArgs('create', 'ContentType').returns(true);
    compileElement();
    expect(container.find('.advice .primary-button').attr('disabled')).toBeUndefined();
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

  describe('add button list', function() {
    it('not shown', function() {
      canStub.withArgs('create', 'ContentType').returns(false);
      compileElement();
      expect(container.find('.filter-list').eq(1)).toBeNgHidden();
    });

    it('shown', function() {
      canStub.withArgs('create', 'ContentType').returns(true);
      compileElement();
      expect(container.find('.filter-list').eq(1)).not.toBeNgHidden();
    });
  });

});
