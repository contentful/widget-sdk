'use strict';

describe('apiKeyEditor Directive', function () {
  var element, scope, compileElement, stubs, accessChecker;
  beforeEach(function () {
    module('contentful/test', function ($provide) {
      stubs = $provide.makeStubs([
        'open',
        'catch',
        'apiKeyGetId',
        'spaceGetId'
      ]);
      stubs.open.returns({
        catch: stubs.catch
      });

      $provide.value('modalDialog', {
        open: stubs.open
      });

      $provide.removeDirectives('cfIcon');

      $provide.value('analytics', {});
    });

    inject(function ($compile, $rootScope, enforcements, spaceContext, _accessChecker_) {
      scope = $rootScope.$new();
      scope.otDoc = {doc: {}, state: {}};

      spaceContext.space = {
        data: {sys: {createdBy: {sys: {id: ''}}}},
        getId: stubs.spaceGetId
      };
      stubs.spaceGetId.returns('spaceid');
      scope.context = {};
      scope.previewApiKey = {
        data: {},
        getId: stubs.apiKeyGetId
      };

      accessChecker = _accessChecker_;
      accessChecker.shouldDisable = sinon.stub();

      compileElement = function () {
        element = $compile('<div cf-api-key-editor></div>')(scope);
        scope.apiKey = {
          data: {},
          getId: stubs.apiKeyGetId
        };
        scope.$digest();
      };
    });
  });

  it('has a headline', function () {
    compileElement();
    scope.apiKey.data.name = 'headline text';
    scope.$digest();
    expect(element.find('.workbench-header h1').html()).toMatch('headline text');
  });

  it('delete button cant ever be disabled', function () {
    accessChecker.shouldDisable.withArgs('createApiKey').returns(true);
    compileElement();
    expect(element.find('.workbench-actions .delete').attr('disabled')).toBeUndefined();
  });

  it('delete button is enabled', function () {
    compileElement();
    expect(element.find('.workbench-actions .delete').attr('disabled')).toBeUndefined();
  });

  it('save button is disabled', function () {
    accessChecker.shouldDisable.withArgs('createApiKey').returns(true);
    compileElement();
    scope.apiKeyForm = {
      $invalid: false
    };
    scope.$digest();
    expect(element.find('.workbench-header__actions .save').attr('disabled')).toBe('disabled');
  });

  it('save button is enabled', function () {
    compileElement();
    scope.apiKeyForm = {
      $invalid: false
    };
    scope.$digest();
    expect(element.find('.workbench-actions .save').attr('disabled')).toBeUndefined();
  });

});
