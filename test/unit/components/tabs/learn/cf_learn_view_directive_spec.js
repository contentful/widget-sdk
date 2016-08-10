'use strict';

describe('cfLearnView directive', function () {

  var controller, stubs, $rootScope;

  beforeEach(function () {

    var element;

    stubs = {
      spaceContext: {
        space: {
          getEntries: sinon.stub(),
          getDeliveryApiKeys: sinon.stub()
        },
        publishedContentTypes: [],
        getData: _.noop
      },
      $state: {
        current: {},
        href: _.noop,
        go: sinon.stub()
      }
    };

    module('contentful/test', function ($provide) {
      $provide.value('spaceContext', stubs.spaceContext);
      $provide.value('$state', stubs.$state);
    });

    $rootScope = this.$inject('$rootScope');

    this.compile = function () {
      element = this.$compile('<cf-learn-view />', {
        context: {}
      });
      controller = element.scope().learn;
      $rootScope.$digest();
    };
  });

  describe('has content types', function () {
    beforeEach(function () {
      stubs.spaceContext.publishedContentTypes = [{getId: _.noop}];
      stubs.spaceContext.space.getEntries.resolves([{}]);
      stubs.spaceContext.space.getDeliveryApiKeys.resolves([]);
      this.compile();
    });

    it('sets content type data', function () {
      expect(controller.contentTypes.length).toBe(1);
    });

    it('requests entries', function () {
      sinon.assert.calledOnce(stubs.spaceContext.space.getEntries);
      expect(controller.hasEntries).toBe(true);
    });
  });

  describe('has no content types', function () {
    beforeEach(function () {
      stubs.spaceContext.space.getDeliveryApiKeys.resolves([]);
      this.compile();
    });

    it('sets content type data', function () {
      expect(controller.contentTypes.length).toBe(0);
    });

    it('does not request entries', function () {
      sinon.assert.notCalled(stubs.spaceContext.space.getEntries);
      expect(controller.hasEntries).toBe(false);
    });
  });

  describe('clicked `Use the API`', function () {
    beforeEach(function () {
      stubs.spaceContext.publishedContentTypes = [{getId: _.noop}];
      stubs.spaceContext.space.getEntries.resolves(true);
      stubs.$state.go.returns();
    });

    it('requests delivery API keys', function () {
      stubs.spaceContext.space.getDeliveryApiKeys.resolves([]);
      this.compile();
      controller.goToApiKeySection();
      sinon.assert.calledOnce(stubs.spaceContext.space.getDeliveryApiKeys);
    });

    it('navigates to API home when there are no keys', function () {
      stubs.spaceContext.space.getDeliveryApiKeys.resolves([]);
      this.compile();
      controller.goToApiKeySection();
      $rootScope.$digest();
      sinon.assert.calledWithExactly(stubs.$state.go, 'spaces.detail.api.home');
    });

    it('navigates to API key page when there is one key', function () {
      var apiKeys = [{data: {sys: {id: 1}}}];
      stubs.spaceContext.space.getDeliveryApiKeys.resolves(apiKeys);
      this.compile();
      controller.goToApiKeySection();
      $rootScope.$digest();
      sinon.assert.calledWithExactly(
        stubs.$state.go,
        'spaces.detail.api.keys.detail',
        { apiKeyId: 1 }
      );
    });
  });

  describe('selected language', function () {
    beforeEach(function () {
      stubs.spaceContext.space.getDeliveryApiKeys.resolves([]);
      this.compile();
      controller.selectLanguage(controller.languageData[0]);
    });
    it('shows selected language', function () {
      controller.selectedLanguage.name = 'Javascript';
    });
  });
});
