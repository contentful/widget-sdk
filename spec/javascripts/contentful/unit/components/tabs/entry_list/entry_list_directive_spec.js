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

  describe('the tab header first add button', function() {
    it('is not shown if not allowed', function() {
      canStub.withArgs('create', 'Entry').returns(false);
      compileElement();
      expect(container.find('.tab-header .add-entity .primary-button').eq(0)).toBeNgHidden();
    });


    it('is not shown if there are no entries', function() {
      scope.singleContentType = {};
      scope.entries = [];
      canStub.withArgs('create', 'Entry').returns(true);
      compileElement();
      expect(container.find('.tab-header .add-entity .primary-button').eq(0)).toBeNgHidden();
    });

    it('is not shown if there is no single content type', function() {
      scope.singleContentType = null;
      scope.entries = [{}];
      canStub.withArgs('create', 'Entry').returns(true);
      compileElement();
      expect(container.find('.tab-header .add-entity .primary-button').eq(0)).toBeNgHidden();
    });

    it('is shown if all conditions are met', function() {
      scope.singleContentType = {};
      scope.entries = [{}];
      canStub.withArgs('create', 'Entry').returns(true);
      compileElement();
      expect(container.find('.tab-header .add-entity .primary-button').eq(0)).not.toBeNgHidden();
    });
  });


  describe('the tab header add dropdown button', function() {

    it('is not shown', function() {
      canStub.withArgs('create', 'Entry').returns(false);
      compileElement();
      expect(container.find('.tab-header .add-entity .primary-button').eq(1)).toBeNgHidden();
    });

    it('is shown', function() {
      canStub.withArgs('create', 'Entry').returns(true);
      compileElement();
      expect(container.find('.tab-header .add-entity .primary-button').eq(1)).not.toBeNgHidden();
    });

    describe('has dropdown items', function() {
      var idStub1, idStub2, nameStub;
      beforeEach(function() {
        canStub.withArgs('create', 'Entry').returns(true);
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
      });

      it('has 2 items', function() {
        expect(container.find('.tab-header .add-entity li').length).toBe(2);
      });
    });

  });

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
    var filterList, addList;
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
      filterList = container.find('.filter-list').eq(1);
      addList = container.find('.filter-list').eq(2);
    });

    it('filter list has 2 elements', function () {
      expect(filterList.find('li').length).toBe(2);
    });

    it('add list has 2 elements', function () {
      expect(addList.find('li').length).toBe(2);
    });

    it('filter list first element is active', function() {
      expect(filterList.find('li').eq(0)).toHaveClass('active');
    });

    it('filter list second element is inactive', function() {
      expect(filterList.find('li').eq(1)).not.toHaveClass('active');
    });
  });

  describe('add button list', function() {
    it('not shown', function() {
      canStub.withArgs('create', 'Entry').returns(false);
      compileElement();
      expect(container.find('.filter-list').eq(2)).toBeNgHidden();
    });

    it('shown', function() {
      canStub.withArgs('create', 'Entry').returns(true);
      compileElement();
      expect(container.find('.filter-list').eq(2)).not.toBeNgHidden();
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
