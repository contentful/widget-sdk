describe('Space Wizard action creators', function () {
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
      productPlanType: 'space',
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
      getTemplatesList: sinon.stub().resolves([this.template]),
      onConfirm: sinon.stub()
    };

    this.dispatch = (action, ...args) => {
      return action(...args)(this.stubs.dispatch);
    };

    module('contentful/test', ($provide) => {
      $provide.value('services/ResourceService', {
        default: () => {
          return {
            get: this.stubs.ResourceService_get
          };
        }
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

    this.actionCreators = this.$inject('components/shared/space-wizard/store/actionCreators');
    this.actions = this.$inject('components/shared/space-wizard/store/actions');
  });

  describe('fetchSpacePlans', function () {
    beforeEach(function () {
      this.spaceId = this.space.sys.id;
    });

    it('should dispatch 3 times if successfully loading resource and rate plans', async function () {
      await this.dispatch(this.actionCreators.fetchSpacePlans, {
        organization: this.organization,
        spaceId: this.spaceId
      });

      expect(this.stubs.dispatch.callCount).toBe(3);
      expect(this.stubs.dispatch.args[0]).toEqual([{
        type: this.actions.SPACE_PLANS_PENDING,
        isPending: true
      }]);
      expect(this.stubs.dispatch.args[1]).toEqual([{
        type: this.actions.SPACE_PLANS_SUCCESS,
        spaceRatePlans: [],
        freeSpacesResource: this.resource
      }]);
      expect(this.stubs.dispatch.args[2]).toEqual([{
        type: this.actions.SPACE_PLANS_PENDING,
        isPending: false
      }]);
    });

    it('should dispatch 3 times if error is thrown during API calls', async function () {
      const error = new Error('Could not load from API');

      this.stubs.getSpaceRatePlans.throws(new Error('Could not load from API'));

      await this.dispatch(this.actionCreators.fetchSpacePlans, {
        organization: this.organization,
        spaceId: this.spaceId
      });

      expect(this.stubs.dispatch.callCount).toBe(3);
      expect(this.stubs.dispatch.args[0]).toEqual([{
        type: this.actions.SPACE_PLANS_PENDING,
        isPending: true
      }]);
      expect(this.stubs.dispatch.args[1]).toEqual([{
        type: this.actions.SPACE_PLANS_FAILURE,
        error
      }]);
      expect(this.stubs.dispatch.args[2]).toEqual([{
        type: this.actions.SPACE_PLANS_PENDING,
        isPending: false
      }]);
    });
  });

  describe('createSpace', function () {
    beforeEach(function () {
      this.onSpaceCreated = sinon.stub();
      this.onTemplateCreated = sinon.stub();
    });

    it('should dispatch 4 times if no error is thrown creating the space', async function () {
      await this.dispatch(this.actionCreators.createSpace, {
        organization: this.organization,
        action: 'create',
        currentStepId: 2,
        selectedPlan: this.plan,
        newSpaceMeta: { name: 'My favorite space', template: null },
        onSpaceCreated: this.onSpaceCreated,
        onTemplateCreated: this.onTemplateCreated,
        onConfirm: this.stubs.onConfirm,
        partnershipData: { isPartnership: false }
      });

      expect(this.stubs.dispatch.callCount).toBe(4);
      expect(this.stubs.dispatch.args[0]).toEqual([{
        type: this.actions.SPACE_CREATION_PENDING,
        isPending: true
      }]);

      // Track event
      expect(typeof this.stubs.dispatch.args[1][0]).toBe('function');

      expect(this.stubs.dispatch.args[2]).toEqual([{
        type: this.actions.SPACE_CREATION_SUCCESS
      }]);
      expect(this.stubs.dispatch.args[3]).toEqual([{
        type: this.actions.SPACE_CREATION_PENDING,
        isPending: false
      }]);
    });

    it('should dispatch 3 times if error thrown during space creation', async function () {
      const error = new Error('Could not create space');

      this.stubs.createSpace.throws(error);

      await this.dispatch(this.actionCreators.createSpace, {
        organization: this.organization,
        action: 'create',
        currentStepId: 2,
        selectedPlan: this.plan,
        newSpaceMeta: { name: 'My favorite space', template: null },
        onSpaceCreated: this.onSpaceCreated,
        onTemplateCreated: this.onTemplateCreated,
        onConfirm: this.stubs.onConfirm
      });

      expect(this.stubs.dispatch.callCount).toBe(3);
      expect(this.stubs.dispatch.args[0]).toEqual([{
        type: this.actions.SPACE_CREATION_PENDING,
        isPending: true
      }]);
      expect(this.stubs.dispatch.args[1]).toEqual([{
        type: this.actions.SPACE_CREATION_FAILURE,
        error
      }]);
      expect(this.stubs.dispatch.args[2]).toEqual([{
        type: this.actions.SPACE_CREATION_PENDING,
        isPending: false
      }]);
    });
  });

  describe('changeSpace', function () {
    beforeEach(function () {
      this.onConfirm = sinon.stub();
    });

    it('should dispatch 1 time if no error is thrown during space changing', async function () {
      await this.dispatch(this.actionCreators.changeSpace, {
        space: this.space,
        selectedPlan: this.plan,
        onConfirm: this.onConfirm
      });

      expect(this.stubs.dispatch.callCount).toBe(2);
      expect(this.stubs.dispatch.args[0]).toEqual([{
        type: this.actions.SPACE_CHANGE_PENDING,
        isPending: true
      }]);
      expect(typeof this.stubs.dispatch.args[1][0]).toBe('function');
    });

    it('should dispatch 3 times if error is thrown during space changing', async function () {
      const error = new Error('Could not change space');

      this.stubs.changeSpace.throws(error);

      await this.dispatch(this.actionCreators.changeSpace, {
        space: this.space,
        selectedPlan: this.plan,
        onConfirm: this.onConfirm
      });

      expect(this.stubs.dispatch.callCount).toBe(3);
      expect(this.stubs.dispatch.args[0]).toEqual([{
        type: this.actions.SPACE_CHANGE_PENDING,
        isPending: true
      }]);
      expect(this.stubs.dispatch.args[1]).toEqual([{
        type: this.actions.SPACE_CHANGE_FAILURE,
        error
      }]);
      expect(this.stubs.dispatch.args[2]).toEqual([{
        type: this.actions.SPACE_CHANGE_PENDING,
        isPending: false
      }]);
    });
  });

  describe('track', function () {
    it('should dispatch 1 time', function () {
      const props = {
        action: 'create',
        paymentDetailsExist: this.organization.isBillable,
        currentStepId: 1,
        selectedPlan: this.plan,
        currentPlan: { ...this.plan, name: 'Even Better Micro Plan', internalName: 'even_better' },
        newSpaceName: 'Best Space Ever',
        newSpaceTemplate: { name: 'Blank' }
      };

      this.dispatch(this.actionCreators.track, 'my_event', {
        extraProp: 'special_value',
        ...props
      });

      expect(this.stubs.dispatch.callCount).toBe(1);
      expect(this.stubs.dispatch.args[0]).toEqual([{
        type: this.actions.SPACE_WIZARD_TRACK,
        eventName: 'my_event',
        trackingData: {
          currentStep: 1,
          intendedAction: 'create',
          paymentDetailsExist: true,
          targetSpaceType: 'best_micro',
          targetSpaceName: 'Best Space Ever',
          targetSpaceTemplateId: 'Blank',
          currentSpaceType: 'even_better',
          targetStep: null,
          targetProductType: null,
          currentProductType: null,
          recommendedSpaceType: null,
          recommendedProductType: null
        }
      }]);
    });
  });

  describe('navigate', function () {
    it('should dispatch 1 time', function () {
      this.dispatch(this.actionCreators.navigate, 1);

      expect(this.stubs.dispatch.callCount).toBe(1);
      expect(this.stubs.dispatch.args[0]).toEqual([{
        type: this.actions.SPACE_WIZARD_NAVIGATE,
        stepId: 1
      }]);
    });
  });

  describe('fetchSubscriptionPrice', function () {
    it('should dispatch 3 times if no error thrown during fetching', async function () {
      this.stubs.calculateTotalPrice.returns(150);

      await this.dispatch(this.actionCreators.fetchSubscriptionPrice, {
        organization: this.organization
      });

      expect(this.stubs.dispatch.callCount).toBe(3);
      expect(this.stubs.dispatch.args[0]).toEqual([{
        type: this.actions.SUBSCRIPTION_PRICE_PENDING,
        isPending: true
      }]);
      expect(this.stubs.dispatch.args[1]).toEqual([{
        type: this.actions.SUBSCRIPTION_PRICE_SUCCESS,
        totalPrice: 150
      }]);
      expect(this.stubs.dispatch.args[2]).toEqual([{
        type: this.actions.SUBSCRIPTION_PRICE_PENDING,
        isPending: false
      }]);
    });

    it('should dispatch 3 times if error thrown during fetching', async function () {
      const error = new Error('Could not fetch subscription plans');

      this.stubs.getSubscriptionPlans.throws(error);

      await this.dispatch(this.actionCreators.fetchSubscriptionPrice, {
        organization: this.organization
      });

      expect(this.stubs.dispatch.callCount).toBe(3);
      expect(this.stubs.dispatch.args[0]).toEqual([{
        type: this.actions.SUBSCRIPTION_PRICE_PENDING,
        isPending: true
      }]);
      expect(this.stubs.dispatch.args[1]).toEqual([{
        type: this.actions.SUBSCRIPTION_PRICE_FAILURE,
        error
      }]);
      expect(this.stubs.dispatch.args[2]).toEqual([{
        type: this.actions.SUBSCRIPTION_PRICE_PENDING,
        isPending: false
      }]);
    });
  });

  describe('fetchTemplates', function () {
    it('should dispatch 3 times if no error thrown during fetching', async function () {
      await this.dispatch(this.actionCreators.fetchTemplates);
      expect(this.stubs.dispatch.callCount).toBe(3);

      const list = [this.template].map(({fields, sys}) => ({ ...fields, sys }));

      expect(this.stubs.dispatch.args[0]).toEqual([{
        type: this.actions.SPACE_TEMPLATES_PENDING,
        isPending: true
      }]);
      expect(this.stubs.dispatch.args[1]).toEqual([{
        type: this.actions.SPACE_TEMPLATES_SUCCESS,
        templatesList: list
      }]);
      expect(this.stubs.dispatch.args[2]).toEqual([{
        type: this.actions.SPACE_TEMPLATES_PENDING,
        isPending: false
      }]);
    });

    it('should dispatch 3 times if error thrown during fetching', async function () {
      const error = new Error('Could not fetch templates');

      this.stubs.getTemplatesList.throws(error);

      await this.dispatch(this.actionCreators.fetchTemplates);
      expect(this.stubs.dispatch.callCount).toBe(3);
      expect(this.stubs.dispatch.args[0]).toEqual([{
        type: this.actions.SPACE_TEMPLATES_PENDING,
        isPending: true
      }]);
      expect(this.stubs.dispatch.args[1]).toEqual([{
        type: this.actions.SPACE_TEMPLATES_FAILURE,
        error
      }]);
      expect(this.stubs.dispatch.args[2]).toEqual([{
        type: this.actions.SPACE_TEMPLATES_PENDING,
        isPending: false
      }]);
    });
  });

  describe('setNewSpaceName', function () {
    it('should dispatch 1 time', function () {
      this.dispatch(this.actionCreators.setNewSpaceName, 'My Awesome Space Name');

      expect(this.stubs.dispatch.callCount).toBe(1);
      expect(this.stubs.dispatch.args[0]).toEqual([{
        type: this.actions.NEW_SPACE_NAME,
        name: 'My Awesome Space Name'
      }]);
    });
  });

  describe('setNewSpaceTemplate', function () {
    it('should dispatch 1 time', function () {
      this.dispatch(this.actionCreators.setNewSpaceTemplate, { name: 'best template ever!' });

      expect(this.stubs.dispatch.callCount).toBe(1);
      expect(this.stubs.dispatch.args[0]).toEqual([{
        type: this.actions.NEW_SPACE_TEMPLATE,
        template: {
          name: 'best template ever!'
        }
      }]);
    });
  });

  describe('selectPlan', function () {
    it('should dispatch 2 times', function () {
      const currentPlan = this.plan;
      const selectedPlan = { ...this.plan, name: 'Bestest', internalName: 'bestest' };
      this.dispatch(this.actionCreators.selectPlan, currentPlan, selectedPlan);

      expect(this.stubs.dispatch.callCount).toBe(2);
      expect(this.stubs.dispatch.args[0]).toEqual([{
        type: this.actions.SPACE_PARTNERSHIP,
        isPartnerSpacePlan: false
      }]);
      expect(this.stubs.dispatch.args[1]).toEqual([{
        type: this.actions.SPACE_PLAN_SELECTED,
        currentPlan,
        selectedPlan
      }]);
    });

    it('should dispatch with the partnership flag is given a partner space plan', function () {
      const currentPlan = this.plan;
      const selectedPlan = {
        ...this.plan,
        name: 'Bestest',
        internalName: 'bestest',
        productType: 'partner'
      };
      this.dispatch(this.actionCreators.selectPlan, currentPlan, selectedPlan);

      expect(this.stubs.dispatch.callCount).toBe(2);
      expect(this.stubs.dispatch.args[0]).toEqual([{
        type: this.actions.SPACE_PARTNERSHIP,
        isPartnerSpacePlan: true
      }]);
      expect(this.stubs.dispatch.args[1]).toEqual([{
        type: this.actions.SPACE_PLAN_SELECTED,
        currentPlan,
        selectedPlan
      }]);
    });
  });

  describe('setPartnershipFields', function () {
    it('should dispatch 1 time', function () {
      const fields = {
        myAwesomeField: 'hello world'
      };

      this.dispatch(this.actionCreators.setPartnershipFields, fields);

      expect(this.stubs.dispatch.callCount).toBe(1);
      expect(this.stubs.dispatch.args[0]).toEqual([{
        type: this.actions.SPACE_PARTNERSHIP_FIELDS,
        fields
      }]);
    });
  });

  describe('sendPartnershipEmail', function () {
    it('should dispatch 2 times if API request is successful', async function () {
      const fields = {
        myAwesomeField: 'hello world'
      };

      this.stubs.createSpaceEndpoint.callsFake(function () {
        return () => Promise.resolve({
          message: 'Successful!'
        });
      });

      await this.dispatch(this.actionCreators.sendPartnershipEmail, { spaceId: this.space.sys.id, fields });

      expect(this.stubs.dispatch.callCount).toBe(2);
      expect(this.stubs.dispatch.args[0]).toEqual([{
        type: this.actions.SPACE_PARTNERSHIP_EMAIL_PENDING,
        isPending: true
      }]);
      expect(this.stubs.dispatch.args[1]).toEqual([{
        type: this.actions.SPACE_PARTNERSHIP_EMAIL_PENDING,
        isPending: false
      }]);
    });

    it('should dispatch 3 times if API request errors', async function () {
      const error = new Error('Could not send partnership email');

      this.stubs.createSpaceEndpoint.callsFake(function () {
        return () => { throw error; };
      });

      const fields = {
        myAwesomeField: 'hello world'
      };

      await this.dispatch(this.actionCreators.sendPartnershipEmail, { spaceId: this.space.sys.id, fields });

      expect(this.stubs.dispatch.callCount).toBe(3);
      expect(this.stubs.dispatch.args[0]).toEqual([{
        type: this.actions.SPACE_PARTNERSHIP_EMAIL_PENDING,
        isPending: true
      }]);
      expect(this.stubs.dispatch.args[1]).toEqual([{
        type: this.actions.SPACE_PARTNERSHIP_EMAIL_FAILURE,
        error
      }]);
      expect(this.stubs.dispatch.args[2]).toEqual([{
        type: this.actions.SPACE_PARTNERSHIP_EMAIL_PENDING,
        isPending: false
      }]);
    });
  });

  describe('reset', function () {
    it('should dispatch 1 time', function () {
      this.dispatch(this.actionCreators.reset);

      expect(this.stubs.dispatch.callCount).toBe(1);
      expect(this.stubs.dispatch.args[0]).toEqual([{
        type: this.actions.SPACE_WIZARD_RESET
      }]);
    });
  });
});
