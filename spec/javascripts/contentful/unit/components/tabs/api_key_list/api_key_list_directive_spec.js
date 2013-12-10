'use strict';

describe('The ApiKey list directive', function () {

  var container, scope;
  var compileElement;
  var canStub, reasonsStub;

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
      scope.spaceContext = {
        space: {
          getApiKeys: sinon.stub()
        }
      };

      compileElement = function () {
        container = $('<div class="api-key-list"></div>');
        $compile(container)(scope);
        scope.$digest();
      };
    });
  });

  afterEach(inject(function ($log) {
    $log.assertEmpty();
    container.remove();
  }));

  it('save button is disabled', function () {
    canStub.withArgs('create', 'ApiKey').returns(false);
    reasonsStub.returns(['usageExceeded']);
    compileElement();
    expect(container.find('.create-api-key-advice button').attr('disabled')).toBe('disabled');
  });

  it('save button is enabled', function () {
    canStub.withArgs('create', 'ApiKey').returns(true);
    compileElement();
    expect(container.find('.create-api-key-advice button').attr('disabled')).toBeUndefined();
  });



});
