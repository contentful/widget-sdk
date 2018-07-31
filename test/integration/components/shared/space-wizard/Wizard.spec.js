import React from 'react';
import { mount } from 'enzyme';

describe('Space Wizard', function () {
  beforeEach(function () {
    this.organization = {
      name: 'My Org',
      isBillable: true,
      sys: {
        id: 'org_1234'
      }
    };

    this.space = {
      name: 'My current awesome space',
      sys: {
        id: 'space_1234'
      }
    };

    this.newSpace = {
      name: 'Some New Space',
      sys: {
        id: 'space_5678'
      }
    };

    this.spaceRatePlansCreate = [
      {
        name: 'Micro',
        internalName: 'space_size_1',
        productType: 'on_demand',
        productPlanType: 'space',
        productRatePlanCharges: [],
        sys: {
          id: 'plan_1234'
        }
      }
    ];

    this.spaceRatePlansChange = [
      {
        name: 'Micro',
        internalName: 'space_size_1',
        productType: 'on_demand',
        productPlanType: 'space',
        productRatePlanCharges: [],
        unavailabilityReasons: [
          {
            type: 'currentPlan'
          }
        ],
        sys: {
          id: 'plan_1234'
        }
      },
      {
        name: 'Macro',
        internalName: 'space_size_90',
        productType: 'on_demand',
        productPlanType: 'space',
        productRatePlanCharges: [
          {
            type: 'Environments',
            number: 7
          }
        ],
        sys: {
          id: 'plan_5678'
        }
      }
    ];

    this.templates = [
      {
        fields: {
          name: 'My awesome template!'
        },
        sys: {
          id: 'awesome_template'
        }
      }
    ];

    this.resources = [
      {
        name: 'Environments',
        usage: 2,
        limits: {
          included: 5,
          maximum: 5
        },
        sys: {
          id: 'environment'
        }
      }
    ];

    this.resource = {
      name: 'Free spaces',
      usage: 1,
      limits: {
        included: 2,
        maximum: 2
      },
      sys: {
        id: 'free_space'
      }
    };

    this.stubs = {
      track: sinon.stub(),
      onCancel: sinon.stub(),
      onConfirm: sinon.stub(),
      onSpaceCreated: sinon.stub(),
      onTemplateCreated: sinon.stub(),
      onDimensionsChange: sinon.stub(),
      resourceService_get: sinon.stub().resolves(this.resource),
      resourceService_getAll: sinon.stub().resolves(this.resources),
      getSpaceRatePlans: sinon.stub(),
      getSubscriptionRatePlans: sinon.stub().resolves({ items: [] }),
      calculateTotalPrice: sinon.stub().returns(150),
      createSpace: sinon.stub().resolves(this.newSpace),
      TokenStore_refresh: sinon.stub().resolves(true),
      ApiKeyRepo_create: sinon.stub().resolves(true),
      createSpaceEndpoint: sinon.stub(),
      createOrganizationEndpoint: sinon.stub(),
      getTemplatesList: sinon.stub().resolves(this.templates),
      getTemplate: sinon.stub().resolves(),
      getCreator_create: sinon.stub().returns({ spaceSetup: Promise.resolve(), contentCreated: Promise.resolve() }),
      publishedCTs_refresh: sinon.stub().resolves(),
      changeSpace: sinon.stub().resolves(true)
    };

    module('contentful/test', ($provide) => {
      $provide.value('analytics/Analytics', {
        track: this.stubs.track
      });

      $provide.value('services/ResourceService', {
        default: () => {
          return {
            get: this.stubs.resourceService_get,
            getAll: this.stubs.resourceService_getAll
          };
        }
      });

      $provide.value('account/pricing/PricingDataProvider', {
        getSpaceRatePlans: this.stubs.getSpaceRatePlans,
        getSubscriptionRatePlans: this.stubs.getSubscriptionRatePlans,
        calculateTotalPrice: this.stubs.getTotalPrice,
        changeSpace: this.stubs.changeSpace
      });

      $provide.value('client', {
        createSpace: this.stubs.createSpace
      });

      $provide.value('data/CMA/ApiKeyRepo', {
        default: () => {
          return {
            create: this.stubs.ApiKeyRepo_create
          };
        }
      });

      $provide.value('data/EndpointFactory', {
        createSpaceEndpoint: this.stubs.createSpaceEndpoint,
        createOrganizationEndpoint: this.stubs.createOrganizationEndpoint
      });

      $provide.value('services/SpaceTemplateLoader', {
        getTemplatesList: this.stubs.getTemplatesList,
        getTemplate: this.stubs.getTemplate
      });

      $provide.value('services/SpaceTemplateCreator', {
        getCreator: () => {
          return {
            create: this.stubs.getCreator_create
          };
        }
      });
    });

    this.mockService('services/TokenStore', {
      refresh: this.stubs.TokenStore_refresh
    });

    const Wizard = this.$inject('components/shared/space-wizard/Wizard').default;
    this.store = this.$inject('ReduxStore/store').default;

    this.mountWithAction = function (action) {
      return mount(<Wizard
        organization={this.organization}
        onConfirm={this.stubs.onConfirm}
        onCancel={this.stubs.onCancel}
        onSpaceCreated={this.stubs.onSpaceCreated}
        onTemplateCreated={this.stubs.onTemplateCreated}
        onDimensionsChange={this.stubs.onDimensionsChange}
        wizardScope='space'
        space={this.space}
        action={action}
      />, {
        context: {
          store: this.store
        }
      });
    };

    this.assertArgument = function (stub, order, ...args) {
      return expect(stub.args[order]).toEqual(args);
    };

    this.createTrackingDataWithAction = function (intendedAction, newData = {}) {
      const base = {
        intendedAction,
        currentSpaceType: null,
        currentProductType: null,
        targetSpaceType: null,
        targetProductType: null,
        recommendedSpaceType: null,
        recommendedProductType: null,
        paymentDetailsExist: null,
        currentStep: null,
        targetStep: null,
        targetSpaceName: null,
        targetSpaceTemplateId: null
      };

      return { ...base, ...newData };
    };

    this.awaitStateUpdate = () => {
      return new Promise(resolve => {
        const unsubscribe = this.store.subscribe(() => {
          resolve();
          unsubscribe();
        });
      });
    };

    this.selectPlan = async (wizard, at = 0) => {
      await this.awaitStateUpdate();

      wizard.update();
      wizard.find('SpacePlanItem').at(at).simulate('click');
    };

    this.confirm = async (wizard) => {
      const confirmButton = wizard.find('button[data-test-id="space-create-confirm"]').first();
      confirmButton.simulate('click');
    };
  });

  describe('Snowplow events', function () {
    describe('space creation', function () {
      beforeEach(function () {
        this.stubs.getSpaceRatePlans.resolves(this.spaceRatePlansCreate);
        this.mount = this.mountWithAction.bind(this, 'create');
        this.createTrackingData = this.createTrackingDataWithAction.bind(this, 'create');

        this.enterDetails = async (wizard, selectTemplate) => {
          const nameInput = wizard.find('input[data-test-id="space-name"]').first();

          nameInput.simulate('change', { target: { value: 'My New Space' } });
          wizard.update();

          if (selectTemplate) {
            wizard.find('input[id="newspace-template-usetemplate"]').first().simulate('click');
            wizard.update();

            wizard.find('TemplatesList a').at(0).simulate('click');
            wizard.update();
          }

          wizard.find('button[data-test-id="space-details-confirm"]').first().simulate('click');
        };
      });

      it('should fire the open and navigate events on mount', function () {
        this.mount();

        this.assertArgument(
          this.stubs.track,
          0,
          'space_wizard:open',
          this.createTrackingData({
            paymentDetailsExist: true
          })
        );

        this.assertArgument(
          this.stubs.track,
          1,
          'space_wizard:navigate',
          this.createTrackingData({
            targetStep: 'space_type'
          })
        );
      });

      it('should fire the select_plan and navigate events when selecting a plan', async function () {
        const wizard = this.mount();
        await this.selectPlan(wizard);
        await this.awaitStateUpdate();

        this.assertArgument(
          this.stubs.track,
          2,
          'space_wizard:select_plan',
          this.createTrackingData({
            targetSpaceType: 'space_size_1',
            targetProductType: 'on_demand'
          })
        );

        this.assertArgument(
          this.stubs.track,
          3,
          'space_wizard:navigate',
          this.createTrackingData({
            currentStep: 'space_type',
            targetStep: 'space_details'
          })
        );
      });

      it('should fire the entered_details and navigate events when clicking the button on the details page', async function () {
        const wizard = this.mount();
        await this.selectPlan(wizard);
        await this.awaitStateUpdate();
        await this.enterDetails(wizard);

        this.assertArgument(
          this.stubs.track,
          4,
          'space_wizard:entered_details',
          this.createTrackingData({
            targetSpaceName: 'My New Space',
            targetSpaceTemplateId: null
          })
        );

        this.assertArgument(
          this.stubs.track,
          5,
          'space_wizard:navigate',
          this.createTrackingData({
            currentStep: 'space_details',
            targetStep: 'confirmation'
          })
        );
      });

      it('should fire the nagivate event whenever navigating using the tabs', async function () {
        const wizard = this.mount();
        await this.selectPlan(wizard);
        await this.awaitStateUpdate();
        await this.enterDetails(wizard);

        const tabs = wizard.find('ul.create-space-wizard__navigation > li');

        tabs.at(0).simulate('click');
        this.assertArgument(
          this.stubs.track,
          6,
          'space_wizard:navigate',
          this.createTrackingData({
            currentStep: 'confirmation',
            targetStep: 'space_type'
          })
        );

        tabs.at(2).simulate('click');
        this.assertArgument(
          this.stubs.track,
          7,
          'space_wizard:navigate',
          this.createTrackingData({
            currentStep: 'space_type',
            targetStep: 'confirmation'
          })
        );

        tabs.at(1).simulate('click');
        this.assertArgument(
          this.stubs.track,
          8,
          'space_wizard:navigate',
          this.createTrackingData({
            currentStep: 'confirmation',
            targetStep: 'space_details'
          })
        );
      });

      it('should fire the confirm event when clicking the confirmation button', async function () {
        const wizard = this.mount();
        await this.selectPlan(wizard);
        await this.awaitStateUpdate();
        await this.enterDetails(wizard);
        await this.confirm(wizard);

        this.assertArgument(
          this.stubs.track,
          6,
          'space_wizard:confirm',
          this.createTrackingData()
        );
      });

      it('should fire space creation related events when the space is created on the API', async function () {
        const wizard = this.mount();
        await this.selectPlan(wizard);
        await this.awaitStateUpdate();
        await this.enterDetails(wizard);
        await this.confirm(wizard);

        await this.awaitStateUpdate();

        this.assertArgument(
          this.stubs.track,
          7,
          'space:create',
          {
            templateName: 'Blank'
          }
        );

        this.assertArgument(
          this.stubs.track,
          8,
          'space_wizard:space_create',
          this.createTrackingData()
        );
      });

      it('should fill in template information if selected on the details page', async function () {
        const wizard = this.mount();
        await this.selectPlan(wizard);
        await this.awaitStateUpdate();
        await this.enterDetails(wizard, true);
        await this.confirm(wizard);

        await this.awaitStateUpdate();

        // Template information from details page
        this.assertArgument(
          this.stubs.track,
          4,
          'space_wizard:entered_details',
          this.createTrackingData({
            targetSpaceName: 'My New Space',
            targetSpaceTemplateId: 'My awesome template!'
          })
        );

        // Template information on submission
        this.assertArgument(
          this.stubs.track,
          7,
          'space:create',
          {
            templateName: 'My awesome template!',
            entityAutomationScope: {
              scope: 'space_template'
            }
          }
        );
      });
    });

    describe('space type changing', function () {
      beforeEach(function () {
        this.stubs.getSpaceRatePlans.resolves(this.spaceRatePlansChange);
        this.mount = this.mountWithAction.bind(this, 'change');
        this.createTrackingData = this.createTrackingDataWithAction.bind(this, 'change');
      });

      it('should fire the open and navigate events on mount', function () {
        this.mount();

        this.assertArgument(
          this.stubs.track,
          0,
          'space_wizard:open',
          this.createTrackingData({
            paymentDetailsExist: true
          })
        );

        this.assertArgument(
          this.stubs.track,
          1,
          'space_wizard:navigate',
          this.createTrackingData({
            targetStep: 'space_type'
          })
        );
      });

      it('should fire the select_plan and navigate events when selecting a plan', async function () {
        const wizard = this.mount();
        await this.selectPlan(wizard, 1);

        this.assertArgument(
          this.stubs.track,
          2,
          'space_wizard:select_plan',
          this.createTrackingData({
            currentSpaceType: 'space_size_1',
            currentProductType: 'on_demand',
            targetSpaceType: 'space_size_90',
            targetProductType: 'on_demand',
            recommendedSpaceType: 'space_size_90',
            recommendedProductType: 'on_demand'
          })
        );

        this.assertArgument(
          this.stubs.track,
          3,
          'space_wizard:navigate',
          this.createTrackingData({
            currentStep: 'space_type',
            targetStep: 'confirmation'
          })
        );
      });

      it('should fire the confirm event when clicking the confirmation button', async function () {
        const wizard = this.mount();
        await this.selectPlan(wizard, 1);
        await this.confirm(wizard);

        this.assertArgument(
          this.stubs.track,
          4,
          'space_wizard:confirm',
          this.createTrackingData()
        );
      });

      it('should fire the space_type_change event when the space type is changed on the API', async function () {
        const wizard = this.mount();
        await this.selectPlan(wizard, 1);
        await this.confirm(wizard);

        await this.awaitStateUpdate();

        this.assertArgument(
          this.stubs.track,
          5,
          'space_wizard:space_type_change',
          this.createTrackingData()
        );
      });
    });
  });
});
