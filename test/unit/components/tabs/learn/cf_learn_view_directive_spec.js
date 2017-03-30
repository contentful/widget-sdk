describe('cfLearnView directive', function () {

  let controller, stubs, $rootScope;

  beforeEach(function () {

    let element;

    stubs = {
      spaceContext: {
        space: {
          getEntries: sinon.stub(),
          getDeliveryApiKeys: sinon.stub(),
          getUsers: sinon.stub()
        },
        publishedContentTypes: [],
        getData: sinon.stub()
      },
      webhooks: {
        getAll: sinon.stub()
      },
      $state: {
        current: {},
        href: _.noop,
        go: sinon.stub()
      }
    };

    module('contentful/test', function ($provide) {
      $provide.value('spaceContext', stubs.spaceContext);
      $provide.value('WebhookRepository', {
        getInstance: function () {
          return stubs.webhooks;
        }
      });
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
      const apiKeys = [{data: {sys: {id: 1}}}];
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

  describe('second page', function () {
    beforeEach(function () {
      stubs.spaceContext.publishedContentTypes = [{}];
      stubs.spaceContext.space.getEntries.resolves([{}]);
      stubs.spaceContext.space.getUsers.resolves([{}]);
      stubs.webhooks.getAll.resolves([]);
      stubs.spaceContext.getData.withArgs('activatedAt').returns('2015-03-20');
      stubs.spaceContext.getData.withArgs('locales').returns([{}]);
    });

    it('fires requests to user and webhooks collections', function () {
      this.compile();
      expect(controller.secondPageSteps.length).toBe(3);
      sinon.assert.calledOnce(stubs.spaceContext.space.getUsers);
      sinon.assert.calledOnce(stubs.webhooks.getAll);
    });

    it('shows completion status of items', function () {
      this.compile();
      expect(controller.secondPageSteps[0].completed = true);
      expect(controller.secondPageSteps[1].completed = false);
      expect(controller.secondPageSteps[2].completed = false);
    });

    it('hides note after one week', function () {
      this.compile();
      expect(controller.showNote).toBe(false);
    });

    it('shows note for one week', function () {
      const yesterday = new Date(new Date() - 24 * 60 * 60 * 1000).toISOString();
      stubs.spaceContext.getData.withArgs('activatedAt').returns(yesterday);
      this.compile();
      expect(controller.showNote).toBe(true);
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
