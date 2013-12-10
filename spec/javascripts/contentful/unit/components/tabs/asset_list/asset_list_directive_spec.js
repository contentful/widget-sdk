'use strict';

describe('The Asset list directive', function () {

  var container, scope;
  var compileElement;
  var canStub;
  var reasonsStub;

  beforeEach(function () {
    canStub = sinon.stub();
    reasonsStub = sinon.stub();
    module('contentful/test', function ($provide) {
      $provide.value('reasonsDenied', reasonsStub);
      $provide.value('authorization', {
        spaceContext: {
          space: {
            sys: { createdBy: { sys: {id: 123} } }
          }
        }
      });
      var userStub = sinon.stub();
      userStub.returns({ sys: {id: 123} });
      $provide.value('authentication', {
        getUser: userStub
      });

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
      expect(container.find('.tab-actions .'+button).hasClass('ng-hide')).toBe(true);
    });

    it(button+' button shown', function () {
      canStub.withArgs(action, 'Asset').returns(true);
      compileElement();
      expect(container.find('.tab-actions .'+button).hasClass('ng-hide')).toBe(false);
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

});
