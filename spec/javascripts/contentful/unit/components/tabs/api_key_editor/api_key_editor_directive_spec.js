'use strict';

describe('apiKeyEditor Directive', function () {
  var element, scope, compileElement;
  var regenerateCheckbox;
  var openStub, catchStub;
  var canStub, reasonsStub;

  beforeEach(function () {
    canStub = sinon.stub();
    reasonsStub = sinon.stub();
    openStub = sinon.stub();
    catchStub = sinon.stub();
    openStub.returns({
      catch: catchStub
    });

    module('contentful/test', function ($provide) {
      window.setupCfCanStubs($provide, reasonsStub);
      $provide.value('modalDialog', {
        open: openStub
      });
    });

    inject(function ($compile, $rootScope) {
      scope = $rootScope.$new();

      scope.spaceContext = {
        space: {
          getId: sinon.stub()
        }
      };
      scope.can = canStub;
      scope.tab = {
        params: {
          apiKey: {}
        }
      };

      compileElement = function () {
        element = $compile('<div class="api-key-editor"></div>')(scope);
        scope.$digest();
        regenerateCheckbox = element.find('.form-field').eq(3);
      };
    });
  });

  afterEach(inject(function ($log) {
    $log.assertEmpty();
  }));


  it('has a headline', function () {
    scope.tab.params.apiKey = {
      data: {
       name: 'headline text'
      }
    };
    compileElement();
    expect(element.find('.tab-header h1').html()).toBe('headline text');
  });

  describe('with no existing access token', function () {
    beforeEach(function () {
      scope.tab.params.apiKey = {
        data: {}
      };
      compileElement();
    });

    it('does not show the regenerate form field', function () {
      expect(regenerateCheckbox.hasClass('ng-hide')).toBeTruthy();
    });
  });

  describe('with an existing access token', function () {
    beforeEach(function () {
      scope.tab.params.apiKey = {
        data: {
          name: 'accessTokenName',
          accessToken: 'accessTokenValue'
        }
      };
      compileElement();
    });

    it('shows the regenerate form field', function () {
      expect(regenerateCheckbox.hasClass('ng-hide')).toBeFalsy();
    });

  });

  it('delete button cant ever be disabled', function () {
    canStub.withArgs('create', 'ApiKey').returns(false);
    compileElement();
    expect(element.find('.tab-actions .delete').attr('disabled')).toBeUndefined();
  });

  it('delete button is enabled', function () {
    canStub.withArgs('create', 'ApiKey').returns(true);
    compileElement();
    expect(element.find('.tab-actions .delete').attr('disabled')).toBeUndefined();
  });

  it('save button is disabled', function () {
    canStub.withArgs('create', 'ApiKey').returns(false);
    reasonsStub.returns(['usageExceeded']);
    compileElement();
    scope.apiKeyForm = {
      $invalid: false
    };
    scope.$digest();
    expect(element.find('.tab-actions .save').attr('disabled')).toBe('disabled');
  });

  it('save button is enabled', function () {
    canStub.withArgs('create', 'ApiKey').returns(true);
    compileElement();
    scope.apiKeyForm = {
      $invalid: false
    };
    scope.$digest();
    expect(element.find('.tab-actions .save').attr('disabled')).toBeUndefined();
  });

});

