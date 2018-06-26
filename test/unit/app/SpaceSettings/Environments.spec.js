import * as DOM from 'helpers/DOM';

describe('app/SpaceSettings/Environments', () => {
  const ENVIRONMENTS_LIMIT = 3;

  beforeEach(function () {
    const resourceService = {
      get: sinon.stub().withArgs('environment').resolves({
        usage: 0,
        limits: {maximum: ENVIRONMENTS_LIMIT}
      })
    };

    const isOwnerOrAdmin = sinon.stub().returns(false);
    let incentivizeUpgradeEnabled = false;

    module('contentful/test', $provide => {
      $provide.value('services/ResourceService', () => resourceService);
      $provide.value('services/OrganizationRoles', { isOwnerOrAdmin });
    });

    const { createComponent } = this.$inject('app/SpaceSettings/Environments/State');
    const spaceContext = this.$inject('mocks/spaceContext').init();
    this.$inject('$state').href = () => 'href';

    this.container = DOM.createView($('<div class=client>').get(0));
    $(this.container.element).appendTo('body');

    this.init = () => {
      this.$compileWith('<cf-component-store-bridge component=component>', ($scope) => {
        $scope.component = createComponent(spaceContext, incentivizeUpgradeEnabled);
      }).appendTo(this.container.element);
    };

    // Adds an environment to the store that backs the space endpoint
    // mock.
    this.putEnvironment = ({ id, status }) => {
      const envStore = spaceContext._mockEndpoint.stores.environments;
      envStore[id] = {
        sys: {
          id,
          status: { sys: { id: status } }
        }
      };
    };

    this.setUsage = (usage) => {
      resourceService.get.withArgs('environment').resolves({
        usage,
        limits: {maximum: ENVIRONMENTS_LIMIT}
      });
    };

    this.setPricing = (pricingVersion) => {
      spaceContext.organizationContext.organization.pricingVersion = pricingVersion;
    };

    this.setIncentivizeFlag = (value) => { incentivizeUpgradeEnabled = value; };
    this.setAdmin = (value) => { isOwnerOrAdmin.returns(value); };
  });

  afterEach(function () {
    $(this.container.element).remove();
  });

  it('lists all environments with status', function () {
    this.putEnvironment({ id: 'e1', status: 'ready' });
    this.putEnvironment({ id: 'e2', status: 'queued' });
    this.putEnvironment({ id: 'e3', status: 'failed' });
    this.init();

    this.container.find('environmentList', 'environment.e1').assertHasText('e1');
    this.container.find('environmentList', 'environment.e1').assertHasText('Ready');
    this.container.find('environmentList', 'environment.e2').assertHasText('e2');
    this.container.find('environmentList', 'environment.e2').assertHasText('In progress');
    this.container.find('environmentList', 'environment.e3').assertHasText('e3');
    this.container.find('environmentList', 'environment.e3').assertHasText('Failed');
  });

  it('creates an environment', function () {
    this.init();

    this.container.find('openCreateDialog').click();
    this.$flush();
    this.container.find('spaceEnvironmentsEditDialog', 'field.id').setValue('env_id');
    this.container.find('spaceEnvironmentsEditDialog', 'submit').click();
    this.$flush();
    this.container.find('environmentList', 'environment.env_id').assertHasText('env_id');
  });

  it('deletes an environment', function () {
    this.putEnvironment({ id: 'e1', status: 'ready' });
    this.init();

    this.container.find('environment.e1', 'openDeleteDialog').click();
    this.$flush();
    this.container.find('spaceEnvironmentsDeleteDialog', 'confirmId').setValue('e1');
    this.container.find('spaceEnvironmentsDeleteDialog', 'delete').click();
    this.$flush();
    this.container.find('environment.e1').assertNonExistent();
  });

  describe('shows usage info in the sidebar', function () {
    beforeEach(function () {
      this.getUsageText = () => this.container.find('environmentsUsage');
      this.getUsageTooltip = () => this.container.find('environmentsUsage', 'environments-usage-tooltip');
    });

    describe('on v2 pricing', function () {
      beforeEach(function () {
        this.setPricing('pricing_version_2');
        this.setUsage(1);
        this.init();
      });

      it('shows usage and limits', function () {
        this.getUsageText().assertHasText(`You are using 2 out of ${ENVIRONMENTS_LIMIT + 1} environments`);
      });

      it('shows tooltip ', function () {
        this.getUsageTooltip().assertIsVisible();
      });
    });

    describe('on v1 pricing', function () {
      beforeEach(function () {
        this.setPricing('pricing_version_1');
        this.init();
      });

      it('shows usage only', function () {
        this.getUsageText().assertHasText(`You are using 1 environment`);
      });

      it('does not show tooltip ', function () {
        this.getUsageTooltip().assertNonExistent();
      });
    });
  });

  describe('when limit is reached on v2 pricing', function () {
    beforeEach(function () {
      this.setPricing('pricing_version_2');
      this.setUsage(ENVIRONMENTS_LIMIT);
    });

    it('does not render create button', function () {
      this.init();
      this.container.find('openCreateDialog').assertNonExistent();
    });

    describe('when user is admin', function () {
      beforeEach(function () {
        this.setAdmin(true);
      });

      it('renders upgrade space button with feature flag on', function () {
        this.setIncentivizeFlag(true);
        this.init();

        this.container.find('openUpgradeDialog').assertIsVisible();
        this.container.find('subscriptionLink').assertNonExistent();
      });

      it('renders subscription link with feature flag off', function () {
        this.setIncentivizeFlag(false);
        this.init();

        this.container.find('openUpgradeDialog').assertNonExistent();
        this.container.find('subscriptionLink').assertIsVisible();
      });
    });

    describe('when user is not admin, do not show upgrade action', function () {
      beforeEach(function () {
        this.setAdmin(false);
      });

      it('with feature flag on', function () {
        this.setIncentivizeFlag(true);
        this.init();

        this.container.find('openUpgradeDialog').assertNonExistent();
        this.container.find('subscriptionLink').assertNonExistent();
      });

      it('with feature flag off', function () {
        this.setIncentivizeFlag(false);
        this.init();

        this.container.find('openUpgradeDialog').assertNonExistent();
        this.container.find('subscriptionLink').assertNonExistent();
      });
    });
  });
});
