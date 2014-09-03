'use strict';

describe('apiKeyEditor Directive', function () {
  var element, scope, compileElement, stubs;
  var regenerateCheckbox;

  beforeEach(function () {
    module('contentful/test', function ($provide, cfCanStubsProvider) {
      stubs = $provide.makeStubs([
        'can',
        'reasons',
        'open',
        'catch',
      ]);
      stubs.open.returns({
        catch: stubs.catch
      });
      cfCanStubsProvider.setup(stubs.reasons);
      $provide.value('modalDialog', {
        open: stubs.open
      });
    });

    inject(function ($compile, $rootScope, enforcements) {
      scope = $rootScope.$new();

      scope.spaceContext = {
        space: {
          data: {sys: {createdBy: {sys: {id: ''}}}},
          getId: sinon.stub()
        }
      };
      enforcements.setSpaceContext(scope.spaceContext);
      scope.can = stubs.can;
      scope.tab = {
        params: {
          apiKey: {}
        }
      };

      compileElement = function () {
        element = $compile('<div class="api-key-editor"></div>')(scope);
        scope.$digest();
        regenerateCheckbox = element.find('input[type="checkbox"]').parents('.l-form-field--no-label');
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
    expect(element.find('.tab-header h1').html()).toMatch('headline text');
  });

  describe('with no existing access token', function () {
    beforeEach(function () {
      scope.tab.params.apiKey = {
        data: {}
      };
      compileElement();
    });

    it('does not show the regenerate form field', function () {
      expect(regenerateCheckbox).toBeNgHidden();
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
      expect(regenerateCheckbox).not.toBeNgHidden();
    });
  });

  it('delete button cant ever be disabled', function () {
    stubs.can.withArgs('create', 'ApiKey').returns(false);
    compileElement();
    expect(element.find('.tab-actions .delete').attr('disabled')).toBeUndefined();
  });

  it('delete button is enabled', function () {
    stubs.can.withArgs('create', 'ApiKey').returns(true);
    compileElement();
    expect(element.find('.tab-actions .delete').attr('disabled')).toBeUndefined();
  });

  it('save button is disabled', function () {
    stubs.can.withArgs('create', 'ApiKey').returns(false);
    stubs.reasons.returns(['usageExceeded']);
    compileElement();
    scope.apiKeyForm = {
      $invalid: false
    };
    scope.$digest();
    expect(element.find('.tab-actions .save').attr('disabled')).toBe('disabled');
  });

  it('save button is enabled', function () {
    stubs.can.withArgs('create', 'ApiKey').returns(true);
    compileElement();
    scope.apiKeyForm = {
      $invalid: false
    };
    scope.$digest();
    expect(element.find('.tab-actions .save').attr('disabled')).toBeUndefined();
  });

});

