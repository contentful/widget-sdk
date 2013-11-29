'use strict';

describe('The Asset list directive', function () {

  var container, scope;
  var canStub;

  beforeEach(function () {
    canStub = sinon.stub();
    module('contentful/test', function ($provide) {
      $provide.value('can', canStub);
    });
    inject(function ($rootScope, $compile) {
      scope = $rootScope.$new();
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

      container = $('<div class="asset-list"></div>');
      $compile(container)(scope);
      scope.$digest();
    });
  });

  afterEach(inject(function ($log) {
    container.remove();
    $log.assertEmpty();
  }));

  function makeActionTest(button, action) {
    it(button+' button not shown', function () {
      canStub.withArgs(action, 'Asset').returns(false);
      scope.$apply();
      expect(container.find('.tab-actions .'+button).hasClass('ng-hide')).toBe(true);
    });

    it(button+' button shown', function () {
      canStub.withArgs(action, 'Asset').returns(true);
      scope.$apply();
      expect(container.find('.tab-actions .'+button).hasClass('ng-hide')).toBe(false);
    });
  }

  makeActionTest('delete', 'delete');
  makeActionTest('unarchive', 'unarchive');
  makeActionTest('archive', 'archive');
  makeActionTest('unpublish', 'unpublish');
  makeActionTest('publish', 'publish');

});
