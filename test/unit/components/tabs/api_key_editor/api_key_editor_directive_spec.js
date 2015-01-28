'use strict';

describe('apiKeyEditor Directive', function () {
  var element, scope, compileElement, stubs, environmentMock;
  beforeEach(function () {
    module('contentful/test', function ($provide) {
      $provide.removeControllers('PermissionController');

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

      environmentMock = {
        env: 'development',
        settings: {
          cdn_host: 'cdn_host',
          marketing_url: 'marketing_url',
        }
      };

      $provide.constant('environment', environmentMock);
    });

    inject(function ($compile, $rootScope, enforcements) {
      scope = $rootScope.$new();

      scope.spaceContext = {
        space: {
          data: {sys: {createdBy: {sys: {id: ''}}}},
          getId: stubs.spaceGetId
        }
      };
      stubs.spaceGetId.returns('spaceid');
      scope.tab = {
        params: {}
      };
      scope.previewApiKey = {
        data: {},
        getId: stubs.apiKeyGetId
      };

      enforcements.setSpaceContext(scope.spaceContext);

      scope.permissionController = {
        get: sinon.stub(),
        entityActions: {}
      };

      compileElement = function () {
        element = $compile('<div class="api-key-editor"></div>')(scope);
        scope.tab.params.apiKey = {
          data: {},
          getId: stubs.apiKeyGetId
        };
        scope.$digest();
      };
    });
  });

  it('has a headline', function () {
    compileElement();
    scope.tab.params.apiKey.data.name = 'headline text';
    scope.$digest();
    expect(element.find('.tab-header h1').html()).toMatch('headline text');
  });

  it('delete button cant ever be disabled', function () {
    scope.permissionController.get.withArgs('createApiKey', 'shouldDisable').returns(true);
    compileElement();
    expect(element.find('.tab-actions .delete').attr('disabled')).toBeUndefined();
  });

  it('delete button is enabled', function () {
    compileElement();
    expect(element.find('.tab-actions .delete').attr('disabled')).toBeUndefined();
  });

  it('save button is disabled', function () {
    scope.permissionController.get.withArgs('createApiKey', 'shouldDisable').returns(true);
    compileElement();
    scope.apiKeyForm = {
      $invalid: false
    };
    scope.$digest();
    expect(element.find('.tab-actions .save').attr('disabled')).toBe('disabled');
  });

  it('save button is enabled', function () {
    compileElement();
    scope.apiKeyForm = {
      $invalid: false
    };
    scope.$digest();
    expect(element.find('.tab-actions .save').attr('disabled')).toBeUndefined();
  });

  describe('code examples for', function() {
    var getVal, lang;
    function setupCodeExample(env, api) {
      environmentMock.env = env;
      compileElement();
      scope.authCodeExample.lang = lang;
      scope.authCodeExample.api = api;
      scope.$digest();
    }

    describe('http', function() {
      beforeEach(function() {
        getVal = function () {
          return element.find('.http.code-example textarea').val();
        };
        lang = 'http';
      });

      it('in development env with CDA', function() {
        setupCodeExample('development', 'cda');
        expect(getVal()).toMatch('http://cdn_host');
      });

      it('in development env with preview API', function() {
        setupCodeExample('development', 'preview');
        expect(getVal()).toMatch('http://preview_host');
      });

      it('in production env with CDA', function() {
        setupCodeExample('production', 'cda');
        expect(getVal()).toMatch('https://cdn_host');
      });

      it('in production env with preview API', function() {
        setupCodeExample('production', 'preview');
        expect(getVal()).toMatch('https://preview_host');
      });
    });

    describe('javascript', function() {
      beforeEach(function() {
        getVal = function () {
          return element.find('.javascript.code-example textarea').val();
        };
        lang = 'javascript';
      });

      it('in production env with preview API', function() {
        setupCodeExample('production', 'preview');
        expect(getVal()).toMatch('preview_host');
      });

      it('in development env with preview API', function() {
        setupCodeExample('development', 'preview');
        expect(getVal()).toMatch('preview_host');
      });

      it('in development env with CDA', function() {
        setupCodeExample('development', 'cda');
        expect(getVal()).toMatch('cdn_host');
      });

      it('in production env with CDA', function() {
        setupCodeExample('production', 'cda');
        expect(getVal()).not.toMatch('host');
      });
    });

    describe('objc', function() {
      beforeEach(function() {
        getVal = function () {
          return element.find('.objc.code-example textarea').val();
        };
        lang = 'objc';
      });

      it('in production env with preview API', function() {
        setupCodeExample('production', 'preview');
        expect(getVal()).toMatch('preview_host');
      });

      it('in development env with preview API', function() {
        setupCodeExample('development', 'preview');
        expect(getVal()).toMatch('preview_host');
      });

      it('in development env with CDA', function() {
        setupCodeExample('development', 'cda');
        expect(getVal()).toMatch('cdn_host');
      });

      it('in production env with CDA', function() {
        setupCodeExample('production', 'cda');
        expect(getVal()).not.toMatch('host');
      });
    });

    describe('ruby', function() {
      beforeEach(function() {
        getVal = function () {
          return element.find('.ruby.code-example textarea').val();
        };
        lang = 'ruby';
      });

      it('in production env with preview API', function() {
        setupCodeExample('production', 'preview');
        expect(getVal()).toMatch('preview_host');
      });

      it('in development env with preview API', function() {
        setupCodeExample('development', 'preview');
        expect(getVal()).toMatch('preview_host');
      });

      it('in development env with CDA', function() {
        setupCodeExample('development', 'cda');
        expect(getVal()).toMatch('cdn_host');
      });

      it('in production env with CDA', function() {
        setupCodeExample('production', 'cda');
        expect(getVal()).not.toMatch('host');
      });
    });

    describe('swift', function() {
      beforeEach(function() {
        getVal = function () {
          return element.find('.swift.code-example textarea').val();
        };
        lang = 'swift';
      });

      it('in production env with preview API', function() {
        setupCodeExample('production', 'preview');
        expect(getVal()).toMatch('preview_host');
      });

      it('in development env with preview API', function() {
        setupCodeExample('development', 'preview');
        expect(getVal()).toMatch('preview_host');
      });

      it('in development env with CDA', function() {
        setupCodeExample('development', 'cda');
        expect(getVal()).toMatch('cdn_host');
      });

      it('in production env with CDA', function() {
        setupCodeExample('production', 'cda');
        expect(getVal()).not.toMatch('host');
      });
    });


  });

});

