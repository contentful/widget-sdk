'use strict';

describe('apiKeyEditor Directive', function () {
  var element, scope;
  var regenerateCheckbox;
  var openStub, catchStub;
  beforeEach(function () {
    openStub = sinon.stub();
    catchStub = sinon.stub();
    openStub.returns({
      catch: catchStub
    });
    module('contentful/test', function ($provide) {
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
      scope.tab = {
        params: {
          apiKey: {}
        }
      };
      element = $compile('<div class="api-key-editor"></div>')(scope);
      scope.$digest();
      regenerateCheckbox = element.find('.form-field').eq(3);
    });
  });

  afterEach(inject(function ($log) {
    $log.assertEmpty();
  }));

  it('has a headline', function () {
    scope.headline = 'headline text';
    scope.$apply();
    expect(element.find('.tab-header h1').html()).toBe('headline text');
  });

  describe('with no existing access token', function () {
    beforeEach(function () {
      scope.apiKey.data = {
      };
      scope.$apply();
    });

    it('does not show the regenerate form field', function () {
      expect(regenerateCheckbox.hasClass('ng-hide')).toBeTruthy();
    });
  });

  describe('with an existing access token', function () {
    beforeEach(function () {
      scope.apiKey.data = {
        name: 'accessTokenName',
        accessToken: 'accessTokenValue'
      };
      scope.$apply();
    });

    it('shows the regenerate form field', function () {
      expect(regenerateCheckbox.hasClass('ng-hide')).toBeFalsy();
    });

    // no good way of testing this via unit tests
    xit('changes and confirms the regeneration checkbox', function () {
      regenerateCheckbox.click();
      expect(openStub.called).toBeTruthy();
      scope.apiKey.data.regenerateAccessToken = true;
      scope.$apply();
      expect(scope.apiKey.data.regenerateAccessToken).toBeTruthy();
    });

    xit('changes and cancels the regeneration checkbox', function () {
      catchStub.callsArg(0);
      regenerateCheckbox.click();
      scope.$apply();
      expect(scope.apiKey.data.regenerateAccessToken).toBeFalsy();
    });

  });

});
