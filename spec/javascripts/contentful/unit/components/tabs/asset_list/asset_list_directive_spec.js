'use strict';

describe('The Asset list directive', function () {

  var container, scope;
  var compileElement;
  var canStub;
  var reasonsStub;

  beforeEach(function () {
    canStub = sinon.stub();
    reasonsStub = sinon.stub();
    module('contentful/test', function (cfCanStubsProvider) {
      cfCanStubsProvider.setup(reasonsStub);
    });
    inject(function ($rootScope, $compile, assetListDirective) {
      scope = $rootScope.$new();

      assetListDirective[0].controller = function () {};

      scope.selection = {
        getSelected: sinon.stub(),
        isSelected: sinon.stub()
      };

      scope.can = canStub;
      scope.tab = {
        params: {}
      };
      scope.spaceContext = {
        space: {
          getId: sinon.stub()
        }
      };
      scope.validate = sinon.stub();

      compileElement = function () {
        container = $('<div class="asset-list"></div>');
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
      canStub.withArgs(action, 'Asset').returns(false);
      compileElement();
      expect(container.find('.tab-actions .'+button)).toBeNgHidden();
    });

    it(button+' button shown', function () {
      canStub.withArgs(action, 'Asset').returns(true);
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
    canStub.withArgs('create', 'Asset').returns(false);
    reasonsStub.returns(['usageExceeded']);
    compileElement();
    expect(container.find('.results-empty-advice .primary-button').attr('disabled')).toBe('disabled');
  });

  it('create button is enabled', function () {
    canStub.withArgs('create', 'Asset').returns(true);
    compileElement();
    expect(container.find('.results-empty-advice .primary-button').attr('disabled')).toBeUndefined();
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
