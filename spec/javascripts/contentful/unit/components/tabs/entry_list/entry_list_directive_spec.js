'use strict';

describe('The Entry list directive', function () {

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

      container = $('<div class="entry-list"></div>');
      $compile(container)(scope);
      scope.$digest();
    });
  });

  afterEach(function () {
    container.remove();
  });

  function makeActionTest(button, action) {
    it(button+' button not shown', function () {
      canStub.withArgs(action, 'Entry').returns(false);
      scope.$apply();
      expect(container.find('.tab-actions .'+button).hasClass('ng-hide')).toBe(true);
    });

    it(button+' button shown', function () {
      canStub.withArgs(action, 'Entry').returns(true);
      scope.$apply();
      expect(container.find('.tab-actions .'+button).hasClass('ng-hide')).toBe(false);
    });
  }

  makeActionTest('duplicate', 'create');
  makeActionTest('delete', 'delete');
  makeActionTest('unarchive', 'unarchive');
  makeActionTest('archive', 'archive');
  makeActionTest('unpublish', 'unpublish');
  makeActionTest('publish', 'publish');

});
