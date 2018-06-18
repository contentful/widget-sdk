describe('Space Wizard actions', function () {
  beforeEach(async function () {
    this.organization = {
      isBillable: true,
      sys: {
        id: 'org_1234'
      }
    };

    this.space = {
      sys: {
        id: 'space_1234'
      }
    };

    this.resource = {
      usage: 3,
      limit: {
        included: 5,
        maximum: 10
      }
    };

    this.plan = {
      name: 'Best Micro Plan',
      internalName: 'best_micro',
      disabled: false,
      sys: {
        id: 'plan_1234'
      }
    };

    this.newSpace = {
      name: 'My new space',
      sys: {
        id: 'space_5678'
      }
    };

    this.template = {
      fields: {
        name: 'Testing Template'
      },
      sys: {
        id: 'template_1234'
      }
    };

    this.stubs = {
      ResourceService_get: sinon.stub().resolves(this.resource),
      createOrganizationEndpoint: sinon.stub(),
      createSpaceEndpoint: sinon.stub(),
      dispatch: sinon.stub(),
      getSpaceRatePlans: sinon.stub().resolves([]),
      createSpace: sinon.stub().resolves(this.newSpace),
      changeSpace: sinon.stub().resolves(this.newSpace),
      TokenStore_refresh: sinon.stub().resolves(),
      ApiKeyRepo_create: sinon.stub(),
      getSubscriptionPlans: sinon.stub().resolves([this.plan]),
      calculateTotalPrice: sinon.stub(),
      getTemplatesList: sinon.stub().resolves([this.template])
    };

    module('contentful/test', ($provide) => {
      $provide.value('services/ResourceService', {
        default: () => {
          return {
            get: this.stubs.ResourceService_get
          };
        }
      });

      $provide.value('components/shared/space-wizard/store/store', {
        dispatch: this.stubs.dispatch
      });

      $provide.value('data/EndpointFactory', {
        createOrganizationEndpoint: this.stubs.createOrganizationEndpoint,
        createSpaceEndpoint: this.stubs.createSpaceEndpoint
      });

      $provide.value('account/pricing/PricingDataProvider', {
        getSpaceRatePlans: this.stubs.getSpaceRatePlans,
        changeSpace: this.stubs.changeSpace,
        getSubscriptionPlans: this.stubs.getSubscriptionPlans,
        calculateTotalPrice: this.stubs.calculateTotalPrice
      });

      $provide.value('client', {
        default: {
          createSpace: this.stubs.createSpace
        }
      });

      $provide.value('data/CMA/ApiKeyRepo', {
        default: () => {
          return {
            create: this.stubs.ApiKeyRepo_create
          };
        }
      });

      $provide.value('services/SpaceTemplateLoader', {
        getTemplatesList: this.stubs.getTemplatesList
      });
    });

    this.mockService('services/TokenStore', {
      refresh: this.stubs.TokenStore_refresh
    });

    this.actions = this.$inject('components/shared/space-wizard/store/actions');
  });

  describe('fetchSpacePlans', function () {
    beforeEach(function () {
      this.spaceId = this.space.sys.id;
    });

    it('should dispatch 3 times if successfully loading resource and rate plans', async function () {
      await this.actions.fetchSpacePlans({ organization: this.organization, spaceId: this.spaceId });

      expect(this.stubs.dispatch.callCount).toBe(3);
      expect(this.stubs.dispatch.args[0]).toEqual([{ type: 'SPACE_PLANS_LOADING', isLoading: true }]);
      expect(this.stubs.dispatch.args[1]).toEqual([{
        type: 'SPACE_PLANS_LOADED',
        spaceRatePlans: [],
        freeSpacesResource: this.resource
      }]);
      expect(this.stubs.dispatch.args[2]).toEqual([{ type: 'SPACE_PLANS_LOADING', isLoading: false }]);
    });

    it('should dispatch 3 times if error is thrown during API calls', async function () {
      const error = new Error('Could not load from API');

      this.stubs.getSpaceRatePlans.throws(new Error('Could not load from API'));

      await this.actions.fetchSpacePlans({ organization: this.organization, spaceId: this.spaceId });

      expect(this.stubs.dispatch.callCount).toBe(3);
      expect(this.stubs.dispatch.args[0]).toEqual([{ type: 'SPACE_PLANS_LOADING', isLoading: true }]);
      expect(this.stubs.dispatch.args[1]).toEqual([{
        type: 'SPACE_PLANS_ERRORED',
        error
      }]);
      expect(this.stubs.dispatch.args[2]).toEqual([{ type: 'SPACE_PLANS_LOADING', isLoading: false }]);
    });
  });

  describe('createSpace', function () {
    beforeEach(function () {
      this.onSpaceCreated = sinon.stub();
      this.onTemplateCreated = sinon.stub();
    });

    it('should dispatch 4 times if no error is thrown creating the space', async function () {
      await this.actions.createSpace({
        organization: this.organization,
        action: 'create',
        currentStepId: 2,
        selectedPlan: this.plan,
        newSpaceMeta: { name: 'My favorite space', template: null },
        onSpaceCreated: this.onSpaceCreated,
        onTemplateCreated: this.onTemplateCreated
      });

      expect(this.stubs.dispatch.callCount).toBe(4);
      expect(this.stubs.dispatch.args[0]).toEqual([{ type: 'SPACE_CREATION_PENDING', pending: true }]);

      // Only care about the event, not the data
      expect(this.stubs.dispatch.args[1][0].type).toBe('SPACE_WIZARD_TRACK');
      expect(this.stubs.dispatch.args[2]).toEqual([{ type: 'SPACE_CREATION_SUCCESS' }]);
      expect(this.stubs.dispatch.args[3]).toEqual([{ type: 'SPACE_CREATION_PENDING', pending: false }]);
    });

    it('should dispatch 3 times if error thrown during space creation', async function () {
      const error = new Error('Could not create space');

      this.stubs.createSpace.throws(error);

      await this.actions.createSpace({
        organization: this.organization,
        action: 'create',
        currentStepId: 2,
        selectedPlan: this.plan,
        newSpaceMeta: { name: 'My favorite space', template: null },
        onSpaceCreated: this.onSpaceCreated,
        onTemplateCreated: this.onTemplateCreated
      });

      expect(this.stubs.dispatch.callCount).toBe(3);
      expect(this.stubs.dispatch.args[0]).toEqual([{ type: 'SPACE_CREATION_PENDING', pending: true }]);
      expect(this.stubs.dispatch.args[1]).toEqual([{ type: 'SPACE_CREATION_ERROR', error }]);
      expect(this.stubs.dispatch.args[2]).toEqual([{ type: 'SPACE_CREATION_PENDING', pending: false }]);
    });
  });

  describe('changeSpace', function () {
    beforeEach(function () {
      this.onConfirm = sinon.stub();
    });

    it('should dispatch 1 time if no error is thrown during space changing', async function () {
      await this.actions.changeSpace({ space: this.space, selectedPlan: this.plan, onConfirm: this.onConfirm });

      expect(this.stubs.dispatch.callCount).toBe(1);
      expect(this.stubs.dispatch.args[0]).toEqual([{ type: 'SPACE_CHANGE_PENDING', pending: true }]);
    });

    it('should dispatch 3 times if error is thrown during space changing', async function () {
      const error = new Error('Could not change space');

      this.stubs.changeSpace.throws(error);

      await this.actions.changeSpace({ space: this.space, selectedPlan: this.plan, onConfirm: this.onConfirm });

      expect(this.stubs.dispatch.callCount).toBe(3);
      expect(this.stubs.dispatch.args[0]).toEqual([{ type: 'SPACE_CHANGE_PENDING', pending: true }]);
      expect(this.stubs.dispatch.args[1]).toEqual([{ type: 'SPACE_CHANGE_ERROR', error }]);
      expect(this.stubs.dispatch.args[2]).toEqual([{ type: 'SPACE_CHANGE_PENDING', pending: false }]);
    });
  });

  describe('track', function () {
    it('should dispatch 1 time', function () {
      // action, organization, currentStepId, selectedPlan, currentPlan, newSpaceMeta
      const props = {
        action: 'create',
        organization: this.organization,
        currentStepId: 1,
        selectedPlan: this.plan,
        currentPlan: { ...this.plan, name: 'Even Better Micro Plan', internalName: 'even_better' },
        newSpaceMeta: { spaceName: 'Best Space Ever', template: { name: 'Blank' } }
      };

      this.actions.track('my_event', { specialProp: 'special_value' }, props);

      expect(this.stubs.dispatch.callCount).toBe(1);
      expect(this.stubs.dispatch.args[0]).toEqual([{
        type: 'SPACE_WIZARD_TRACK',
        eventName: 'my_event',
        trackingData: {
          specialProp: 'special_value',
          currentStep: 1,
          action: 'create',
          paymentDetailsExist: true,
          spaceType: 'best_micro',
          spaceName: 'Best Space Ever',
          template: 'Blank',
          currentSpaceType: 'even_better'
        }
      }]);
    });
  });

  describe('navigate', function () {
    it('should dispatch 1 time', function () {
      this.actions.navigate(1);

      expect(this.stubs.dispatch.callCount).toBe(1);
      expect(this.stubs.dispatch.args[0]).toEqual([{
        type: 'SPACE_WIZARD_NAVIGATE',
        id: 1
      }]);
    });
  });

  describe('fetchSubscriptionPrice', function () {
    it('should dispatch 3 times if no error thrown during fetching', async function () {
      this.stubs.calculateTotalPrice.returns(150);

      await this.actions.fetchSubscriptionPrice({ organization: this.organization });

      expect(this.stubs.dispatch.callCount).toBe(3);
      expect(this.stubs.dispatch.args[0]).toEqual([{ type: 'SUBSCRIPTION_PRICE_LOADING', isLoading: true }]);
      expect(this.stubs.dispatch.args[1]).toEqual([{ type: 'SUBSCRIPTION_PRICE_SUCCESS', totalPrice: 150 }]);
      expect(this.stubs.dispatch.args[2]).toEqual([{ type: 'SUBSCRIPTION_PRICE_LOADING', isLoading: false }]);
    });

    it('should dispatch 3 times if error thrown during fetching', async function () {
      const error = new Error('Could not fetch subscription plans');

      this.stubs.getSubscriptionPlans.throws(error);

      await this.actions.fetchSubscriptionPrice({ organization: this.organization });

      expect(this.stubs.dispatch.callCount).toBe(3);
      expect(this.stubs.dispatch.args[0]).toEqual([{ type: 'SUBSCRIPTION_PRICE_LOADING', isLoading: true }]);
      expect(this.stubs.dispatch.args[1]).toEqual([{ type: 'SUBSCRIPTION_PRICE_ERROR', error }]);
      expect(this.stubs.dispatch.args[2]).toEqual([{ type: 'SUBSCRIPTION_PRICE_LOADING', isLoading: false }]);
    });
  });

  describe('fetchTemplates', function () {
    it('should dispatch 3 times if no error thrown during fetching', async function () {
      await this.actions.fetchTemplates();
      expect(this.stubs.dispatch.callCount).toBe(3);

      const list = [this.template].map(({fields, sys}) => ({ ...fields, sys }));

      expect(this.stubs.dispatch.args[0]).toEqual([{ type: 'SPACE_TEMPLATES_LOADING', isLoading: true }]);
      expect(this.stubs.dispatch.args[1]).toEqual([{ type: 'SPACE_TEMPLATES_SUCCESS', templatesList: list }]);
      expect(this.stubs.dispatch.args[2]).toEqual([{ type: 'SPACE_TEMPLATES_LOADING', isLoading: false }]);
    });

    it('should dispatch 3 times if error thrown during fetching', async function () {
      const error = new Error('Could not fetch templates');

      this.stubs.getTemplatesList.throws(error);

      await this.actions.fetchTemplates();
      expect(this.stubs.dispatch.callCount).toBe(3);
      expect(this.stubs.dispatch.args[0]).toEqual([{ type: 'SPACE_TEMPLATES_LOADING', isLoading: true }]);
      expect(this.stubs.dispatch.args[1]).toEqual([{ type: 'SPACE_TEMPLATES_ERROR', error }]);
      expect(this.stubs.dispatch.args[2]).toEqual([{ type: 'SPACE_TEMPLATES_LOADING', isLoading: false }]);
    });
  });

  describe('setNewSpaceName', function () {
    it('should dispatch 1 time', function () {
      this.actions.setNewSpaceName('My Awesome Space Name');

      expect(this.stubs.dispatch.callCount).toBe(1);
      expect(this.stubs.dispatch.args[0]).toEqual([{
        type: 'NEW_SPACE_NAME',
        name: 'My Awesome Space Name'
      }]);
    });
  });

  describe('setNewSpaceTemplate', function () {
    it('should dispatch 1 time', function () {
      this.actions.setNewSpaceTemplate({ name: 'best template ever!' });

      expect(this.stubs.dispatch.callCount).toBe(1);
      expect(this.stubs.dispatch.args[0]).toEqual([{
        type: 'NEW_SPACE_TEMPLATE',
        template: {
          name: 'best template ever!'
        }
      }]);
    });
  });

  describe('selectPlan', function () {
    it('should dispatch 1 time', function () {
      const currentPlan = this.plan;
      const selectedPlan = { ...this.plan, name: 'Bestest', internalName: 'bestest' };
      this.actions.selectPlan(currentPlan, selectedPlan);

      expect(this.stubs.dispatch.callCount).toBe(1);
      expect(this.stubs.dispatch.args[0]).toEqual([{
        type: 'SPACE_PLAN_SELECTED',
        current: currentPlan,
        selected: selectedPlan
      }]);
    });
  });
});
