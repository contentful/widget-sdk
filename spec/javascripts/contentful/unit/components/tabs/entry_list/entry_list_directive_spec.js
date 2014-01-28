'use strict';

describe('The Entry list directive', function () {

  var container, scope;
  var canStub, reasonsStub;
  var compileElement;

  beforeEach(function () {
    canStub = sinon.stub();
    reasonsStub = sinon.stub();
    module('contentful/test', function (cfCanStubsProvider) {
      cfCanStubsProvider.setup(reasonsStub);
    });
    inject(function ($rootScope, $compile, entryListDirective) {
      scope = $rootScope.$new();
      scope.can = canStub;

      entryListDirective[0].controller = function () {};

      scope.selection = {
        getSelected: sinon.stub(),
        isSelected: sinon.stub()
      };
      scope.tab = {
        params: {}
      };
      scope.spaceContext = {
        space: {
          getId: sinon.stub()
        }
      };

      compileElement = function () {
        container = $('<div class="entry-list"></div>');
        $compile(container)(scope);
        scope.$digest();
      };
    });
  });

  afterEach(inject(function ($log) {
    container.remove();
    $log.assertEmpty();
  }));

  function makeActionTest(button, action) {
    it(button+' button not shown', function () {
      canStub.withArgs(action, 'Entry').returns(false);
      compileElement();
      expect(container.find('.tab-actions .'+button)).toBeNgHidden();
    });

    it(button+' button shown', function () {
      canStub.withArgs(action, 'Entry').returns(true);
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

  it('save button is disabled', function () {
    canStub.withArgs('create', 'Entry').returns(false);
    reasonsStub.returns(['usageExceeded']);
    compileElement();
    expect(container.find('.advice .primary-button').attr('disabled')).toBe('disabled');
  });

  it('save button is enabled', function () {
    canStub.withArgs('create', 'Entry').returns(true);
    compileElement();
    expect(container.find('.advice .primary-button').attr('disabled')).toBeUndefined();
  });

  describe('list of content type filters', function() {
    var list;
    var idStub1, idStub2, nameStub;
    beforeEach(function() {
      idStub1 = sinon.stub();
      idStub1.returns(1);
      idStub2 = sinon.stub();
      idStub2.returns(2);
      nameStub = sinon.stub();
      nameStub.returns('name');
      scope.tab.params.contentTypeId = 1;
      scope.spaceContext.publishedContentTypes = [
        {getId: idStub1, getName: nameStub},
        {getId: idStub2, getName: nameStub}
      ];
      compileElement();
      list = container.find('.filter-list').eq(1);
    });

    it('list has 2 elements', function () {
      expect(list.find('li').length).toBe(2);
    });

    it('first element is active', function() {
      expect(list.find('li').eq(0)).toHaveClass('active');
    });

    it('second element is inactive', function() {
      expect(list.find('li').eq(1)).not.toHaveClass('active');
    });
  });

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
