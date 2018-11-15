'use strict';

import * as K from 'test/helpers/mocks/kefir';

describe('cfOnboardingSteps Directive', () => {
  beforeEach(function() {
    this.previews$ = K.createMockProperty([]);
    this.organizations = [
      {
        sys: { id: 'firstorg' }
      }
    ];

    this.createSpaceDialog = sinon.stub();
    this.contentPreviews = {
      previewId: {
        configurations: [
          {
            contentType: 'contentTypeId',
            enabled: true,
            example: true,
            url: 'https://potato.media'
          }
        ]
      }
    };
    module('contentful/test', $provide => {
      $provide.value('utils/LaunchDarkly', {
        onFeatureFlag: sinon.stub(),
        getCurrentVariation: sinon.stub().resolves(false)
      });
      $provide.value('contentPreview', {
        contentPreviewsBus$: this.previews$
      });
      $provide.value('services/TokenStore.es6', {
        getOrganizations: sinon.stub().resolves(this.organizations),
        user$: K.createMockProperty({ sys: { id: 1 } })
      });
      $provide.value('services/CreateSpace.es6', {
        showDialog: this.createSpaceDialog
      });
      $provide.value('contentPreview', {
        // using this instead of our added on `.resolves` since that uses
        // $q internally but this directive uses native Promises and that
        // causes things to fail
        getAll: sinon.stub().callsFake(() => Promise.resolve(this.contentPreviews))
      });
      $provide.value('createModernOnboarding', {
        getStoragePrefix: 'ctfl:userSysId:modernStackOnboarding',
        getCredentials: sinon.stub().resolves({
          deliveryToken: 'deliveryToken',
          managementToken: 'managementToken'
        }),
        MODERN_STACK_ONBOARDING_SPACE_NAME: 'gatsby-bruv'
      });
      $provide.value('components/shared/auto_create_new_space', {
        getKey: sinon.stub().returns('key')
      });
    });
    this.$state = this.$inject('$state');
    this.compile = function() {
      this.element = this.$compile('<cf-onboarding-steps />');
      this.controller = this.element.isolateScope().onboarding;
      // Begin test code: test-ps-02-2018-tea-onboarding-steps
      // manually set loading content previews to false
      this.controller.isContentPreviewsLoading = false;
      this.$apply();
      // End test code: test-ps-02-2018-tea-onboarding-steps
    };

    this.assertCompletedSteps = function(num) {
      const completed = this.element.find('.onboarding-step__completed');
      expect(completed.length).toBe(num);
    };

    this.assertActiveButton = function(cta) {
      const selector = `button:contains("${cta}")`;
      const button = this.element.find(selector).get(0);
      expect(button.disabled).toBe(false);
    };
  });

  describe('app home page', () => {
    beforeEach(function() {
      this.$state.current.name = 'home';
      this.compile();
      const spaceContext = this.$inject('spaceContext');
      spaceContext.publishedCTs = { getAllBare: () => [], items$: K.createMockProperty([]) };
      spaceContext.getData = sinon
        .stub()
        .withArgs('activatedAt')
        .returns(null);
      spaceContext.space = null;
    });

    it('only create space button is active', function() {
      this.assertCompletedSteps(0);
      this.assertActiveButton('Create space');
    });

    it('opens the space creation dialog', function() {
      const button = this.element.find('button:contains("Create space")');
      button.click();
      this.$apply();

      sinon.assert.called(this.createSpaceDialog);
    });
  });

  describe('space home page', () => {
    describe('not activated', () => {
      beforeEach(function() {
        this.$state.current.name = 'spaces.detail.home';
        this.spaceContext = this.$inject('spaceContext');
        this.spaceContext.publishedCTs = { getAllBare: () => [], items$: K.createMockProperty([]) };
        this.spaceContext.getData = sinon
          .stub()
          .withArgs('activatedAt')
          .returns(null);
        this.spaceContext.space = {};
      });

      it('no content types yet', function() {
        this.compile();
        this.assertCompletedSteps(1);
        this.assertActiveButton('Create a content type');
      });

      it('no entries yet', function() {
        this.spaceContext.publishedCTs = {
          getAllBare: () => [{}],
          items$: K.createMockProperty([])
        };
        this.spaceContext.space.getEntries = sinon.stub().resolves([]);
        this.compile();
        this.assertCompletedSteps(2);
        this.assertActiveButton('Add an entry');
      });

      it('content types and entries created', function() {
        this.spaceContext.publishedCTs = {
          getAllBare: () => [{}],
          items$: K.createMockProperty([])
        };
        this.spaceContext.space.getEntries = sinon.stub().resolves([{}]);
        this.compile();
        this.assertCompletedSteps(3);
        this.assertActiveButton('Use the API');
      });
    });

    describe('activated', () => {
      beforeEach(function() {
        this.$state.current.name = 'spaces.detail.home';
        this.spaceContext = this.$inject('spaceContext');
        this.spaceContext.publishedCTs = {
          getAllBare: () => [{}],
          items$: K.createMockProperty([])
        };
        this.spaceContext.getData = sinon.stub();
        this.spaceContext.getData.withArgs('activatedAt').returns('2017-03-03T16:14:00Z');
        this.spaceContext.space = {};
        this.webhooks = sinon.stub().resolves([]);
        this.locales = sinon.stub().resolves([{}]);
        this.spaceContext.webhookRepo = { getAll: this.webhooks };
        this.spaceContext.endpoint = sinon.stub().resolves({ items: [] });
        this.spaceContext.localeRepo = { getAll: this.locales };
      });

      it('no completed steps', function() {
        this.compile();
        this.assertCompletedSteps(0);
      });

      it('invited users', function() {
        this.spaceContext.endpoint.resolves({ items: [{}, {}] });
        this.compile();
        this.assertCompletedSteps(1);
      });

      it('has webhooks', function() {
        this.webhooks.resolves([{}]);
        this.compile();
        this.assertCompletedSteps(1);
      });

      it('has additional locales', function() {
        this.locales.resolves([{}, {}]);
        this.compile();
        this.assertCompletedSteps(1);
      });
    });
  });
});
