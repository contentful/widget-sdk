'use strict';

describe('The Asset list directive', function () {

  var scope;

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      $provide.removeDirectives('relative');
      $provide.removeControllers('AssetListController');
    });

    var accessChecker = this.$inject('accessChecker');
    accessChecker.shouldHide = sinon.stub().returns(false);
    accessChecker.shouldDisable = sinon.stub().returns(false);

    scope = {
      selection: {
        getSelected: sinon.stub(),
        isSelected: sinon.stub()
      },
      spaceContext: {}
    };
  });

  describe('list of assets is filtered', function() {
    var list;
    beforeEach(function() {
      var nameStub = sinon.stub().returns('name');
      scope.assets = [
        {getId: sinon.stub().returns(1), getName: nameStub},
        {getId: sinon.stub().returns(2), getName: nameStub},
        {getId: sinon.stub().returns(3), getName: nameStub}
      ];

      var listFilterStub = sinon.stub();
      listFilterStub.withArgs(scope.assets[0]).returns(true);
      listFilterStub.withArgs(scope.assets[1]).returns(true);
      listFilterStub.withArgs(scope.assets[2]).returns(false);
      scope.visibleInCurrentList = listFilterStub;

      var container = this.$compile('<div cf-asset-list>', scope);
      list = container.find('.main-results tbody');
    });

    it('list has 2 elements', function () {
      expect(list.find('tr').length).toBe(2);
    });
  });

});
