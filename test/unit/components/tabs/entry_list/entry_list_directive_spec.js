'use strict';

describe('The Entry list directive', function () {
  var scope;

  beforeEach(function () {
    module('contentful/test', function (environment, $provide) {
      $provide.removeDirectives('viewCustomizer');
      $provide.removeControllers('EntryListController');
    });

    var accessChecker = this.$inject('accessChecker');
    accessChecker.shouldHide = sinon.stub().returns(false);
    accessChecker.shouldDisable = sinon.stub().returns(false);

    scope = {
      selection: {
        getSelected: sinon.stub(),
        isSelected: sinon.stub()
      },
      spaceContext: {},
      archivedStateRef: 'other'
    };
  });

  describe('list of entries is filtered', function() {
    var list;

    beforeEach(function() {
      var nameStub = sinon.stub().returns('name');
      scope.entries = [
        {getId: sinon.stub().returns(1), getName: nameStub},
        {getId: sinon.stub().returns(2), getName: nameStub},
        {getId: sinon.stub().returns(3), getName: nameStub}
      ];

      var listFilterStub = sinon.stub();
      listFilterStub.withArgs(scope.entries[0]).returns(true);
      listFilterStub.withArgs(scope.entries[1]).returns(true);
      listFilterStub.withArgs(scope.entries[2]).returns(false);
      scope.visibleInCurrentList = listFilterStub;

      var container = this.$compile('<div cf-entry-list>', scope);
      list = container.find('.main-results tbody');
    });

    it('list has 2 elements', function () {
      expect(list.find('tr').length).toBe(2);
    });
  });

});
