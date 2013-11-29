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

      scope.tab = {
        params: {}
      };
      scope.spaceContext = {
        space: {
          getId: sinon.stub()
        }
      };

      container = $('<div class="entry-list"></div>');
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

  it('save button is disabled', function () {
    canStub.withArgs('create', 'Entry').returns(false);
    scope.$apply();
    expect(container.find('.results-empty-advice .primary-button').attr('disabled')).toBe('disabled');
  });

  it('save button is enabled', function () {
    canStub.withArgs('create', 'Entry').returns(true);
    scope.$apply();
    expect(container.find('.results-empty-advice .primary-button').attr('disabled')).toBeUndefined();
  });



});
