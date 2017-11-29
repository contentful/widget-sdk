'use strict';

import * as K from 'helpers/mocks/kefir';

describe('cfOnboardingSteps Directive', function () {
  beforeEach(function () {
    module('contentful/test');
    this.$state = this.$inject('$state');
    this.compile = function () {
      this.element = this.$compile('<cf-onboarding-steps />');
      this.controller = this.element.isolateScope().onboarding;
    };

    this.assertCompletedSteps = function (num) {
      const completed = this.element.find('.onboarding-step__completed');
      expect(completed.length).toBe(num);
    };

    this.assertActiveButton = function (cta) {
      const selector = 'button:contains("' + cta + '")';
      const button = this.element.find(selector).get(0);
      expect(button.disabled).toBe(false);
    };
  });

  describe('app home page', function () {
    beforeEach(function () {
      this.$state.current.name = 'home';
      this.compile();
      const spaceContext = this.$inject('spaceContext');
      spaceContext.publishedCTs = {
        items$: K.createMockProperty([])
      };
      spaceContext.getData = sinon.stub().withArgs('activatedAt').returns(null);
      spaceContext.space = null;
    });

    it('only create space button is active', function () {
      this.assertCompletedSteps(0);
      this.assertActiveButton('Create space');
    });
  });

  describe('space home page', function () {
    describe('not activated', function () {
      beforeEach(function () {
        this.$state.current.name = 'spaces.detail.home';
        this.spaceContext = this.$inject('spaceContext');
        this.spaceContext.publishedCTs = {
          items$: K.createMockProperty([])
        };
        this.spaceContext.getData = sinon.stub().withArgs('activatedAt').returns(null);
        this.spaceContext.space = {};
      });

      it('no content types yet', function () {
        this.compile();
        this.assertCompletedSteps(1);
        this.assertActiveButton('Create a content type');
      });

      it('no entries yet', function () {
        this.spaceContext.publishedCTs.items$.set([{}]);
        this.spaceContext.space.getEntries = sinon.stub().resolves([]);
        this.compile();
        this.assertCompletedSteps(2);
        this.assertActiveButton('Add an entry');
      });

      it('content types and entries created', function () {
        this.spaceContext.publishedCTs.items$.set([{}]);
        this.spaceContext.space.getEntries = sinon.stub().resolves([{}]);
        this.compile();
        this.assertCompletedSteps(3);
        this.assertActiveButton('Use the API');
      });
    });

    describe('activated', function () {
      beforeEach(function () {
        this.$state.current.name = 'spaces.detail.home';
        this.spaceContext = this.$inject('spaceContext');
        this.spaceContext.publishedCTs = {items$: K.createMockProperty()};
        this.spaceContext.publishedCTs.items$.set([{}]);
        this.spaceContext.getData = sinon.stub();
        this.spaceContext.getData.withArgs('activatedAt').returns('2017-03-03T16:14:00Z');
        this.spaceContext.space = {};

        this.WebhookRepository = this.$inject('WebhookRepository');
        this.webhooks = sinon.stub().resolves([]);
        this.WebhookRepository.getInstance = () => {
          return {
            getAll: this.webhooks
          };
        };
        this.spaceContext.getData.withArgs('locales').returns([{}]);
        this.spaceContext.space.getUsers = sinon.stub().resolves([{}]);
      });

      it('no completed steps', function () {
        this.compile();
        this.assertCompletedSteps(0);
      });

      it('invited users', function () {
        this.spaceContext.space.getUsers.resolves([{}, {}]);
        this.compile();
        this.assertCompletedSteps(1);
      });

      it('has webhooks', function () {
        this.webhooks.resolves([{}]);
        this.compile();
        this.assertCompletedSteps(1);
      });

      it('has additional locales', function () {
        this.spaceContext.getData.withArgs('locales').returns([{}, {}]);
        this.compile();
        this.assertCompletedSteps(1);
      });
    });
  });
});
