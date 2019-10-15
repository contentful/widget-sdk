import * as DOM from 'test/utils/dom';
import $ from 'jquery';
import sinon from 'sinon';
import { $inject, $initialize, $compileWith, $wait } from 'test/utils/ng';
import { it } from 'test/utils/dsl';

let spaceContext;

describe('app/SpaceSettings/Environments', () => {
  const ENVIRONMENTS_LIMIT = 3;

  beforeEach(async function() {
    const resourceService = {
      get: sinon
        .stub()
        .withArgs('environment')
        .resolves({
          usage: 0,
          limits: { maximum: ENVIRONMENTS_LIMIT }
        })
    };

    const isOwnerOrAdmin = sinon.stub().returns(false);
    const canSelectSource = sinon.stub().returns(true);
    const aliasesEnabled = sinon.stub().returns(false);

    this.accessChecker = {
      can: sinon.stub().returns(true)
    };

    this.system.set('services/ResourceService.es6', {
      default: () => resourceService
    });
    this.system.set('services/OrganizationRoles.es6', { isOwnerOrAdmin });
    this.system.set('app/SpaceSettings/EnvironmentAliases/Feedback.es6', {
      default: () => () => 'feedback'
    });
    this.system.set('access_control/AccessChecker/index.es6', this.accessChecker);

    this.ComponentLibrary = await this.system.import('@contentful/forma-36-react-components');
    this.ComponentLibrary.Notification.success = sinon.stub();
    this.ComponentLibrary.Notification.error = sinon.stub();

    const { createComponent } = await this.system.import(
      'app/SpaceSettings/Environments/State.es6'
    );

    await $initialize(this.system);

    spaceContext = $inject('mocks/spaceContext').init();

    spaceContext.getAliasesIds.returns([]);
    spaceContext.getAliases.returns([]);

    $inject('$state').href = () => 'href';

    this.container = DOM.createView($('<div class=client>').get(0));
    $(this.container.element).appendTo('body');

    this.init = () => {
      $compileWith('<cf-component-store-bridge component=component>', $scope => {
        $scope.component = createComponent(spaceContext, canSelectSource(), aliasesEnabled());
      }).appendTo(this.container.element);
    };

    // Adds an environment to the store that backs the space endpoint
    // mock.
    this.putEnvironment = ({ id, status, aliases }) => {
      const envStore = spaceContext._mockEndpoint.stores.environments;
      envStore[id] = {
        sys: {
          id,
          status: { sys: { id: status } },
          aliases
        }
      };
    };

    this.setUsage = usage => {
      resourceService.get.withArgs('environment').resolves({
        usage,
        limits: { maximum: ENVIRONMENTS_LIMIT }
      });
    };

    this.setPricing = pricingVersion => {
      spaceContext.organization.pricingVersion = pricingVersion;
    };

    this.setAdmin = value => {
      isOwnerOrAdmin.returns(value);
    };

    this.setEnvironmentBranchingFeatureEnabled = enabled => {
      canSelectSource.returns(enabled);
    };

    this.setEnvironmentAliasesFeatureEnabled = enabled => {
      aliasesEnabled.returns(enabled);
    };

    this.envRequests = spaceContext._mockEndpoint.requests.environments;
  });

  afterEach(function() {
    $(this.container.element).remove();
  });

  it('lists all environments with status', function() {
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

  describe('when aliases feature is disabled', function() {
    it('does not show the aliases opt-in', function() {
      this.setEnvironmentAliasesFeatureEnabled(false);

      this.putEnvironment({ id: 'e1', status: 'ready' });
      this.putEnvironment({ id: 'e2', status: 'ready' });

      this.init();

      this.container.find('environments.header').assertNonExistent();
      this.container.find('environmentaliases.card').assertNonExistent();
    });
  });

  describe('when aliases feature is enabled', function() {
    describe('when user has the manage aliases permission', function() {
      it('shows the aliases opt-in', function() {
        this.setEnvironmentAliasesFeatureEnabled(true);
        this.accessChecker.can.returns(true);

        this.putEnvironment({ id: 'e1', status: 'ready' });
        this.putEnvironment({ id: 'e2', status: 'ready' });

        this.init();

        this.container.find('environments.header').assertNonExistent();
        this.container.find('environmentaliases.card').assertIsVisible();
      });

      it('shows the aliases', function() {
        this.setEnvironmentAliasesFeatureEnabled(true);
        this.accessChecker.can.returns(true);
        spaceContext.getAliasesIds.returns(['master']);

        this.putEnvironment({ id: 'e1', status: 'ready', aliases: ['master'] });
        this.putEnvironment({ id: 'e2', status: 'ready' });

        this.init();

        this.container.find('environments.header').assertIsVisible();
        this.container.find('environmentaliases.card').assertIsVisible();
      });

      it('cannot be deleted when environment has aliases', async function() {
        this.setEnvironmentAliasesFeatureEnabled(true);
        this.accessChecker.can.returns(true);

        spaceContext.getAliasesIds.returns(['master']);

        this.putEnvironment({ id: 'e1', status: 'ready', aliases: ['master'] });

        this.init();

        const deleteBtn = this.container.find('environment.e1', 'openDeleteDialog');
        deleteBtn.assertIsDisabled();
        deleteBtn.click();
        await $wait();
        this.container.find('spaceEnvironmentsDeleteDialog').assertNonExistent();
      });
    });

    describe('when user does not have the manage aliases permission', function() {
      it('hides the aliases section', function() {
        this.setEnvironmentAliasesFeatureEnabled(true);
        this.accessChecker.can.returns(false);

        this.init();

        this.container.find('environments.header').assertNonExistent();
        this.container.find('environmentaliases.card').assertNonExistent();
      });
    });
  });

  describe('shows usage info in the sidebar', function() {
    beforeEach(function() {
      this.getUsageText = () => this.container.find('environmentsUsage');
      this.getUsageTooltip = () =>
        this.container.find('environmentsUsage', 'environments-usage-tooltip');
    });

    describe('on v2 pricing', function() {
      beforeEach(function() {
        this.setPricing('pricing_version_2');
        this.setUsage(1);
        this.init();
      });

      it('shows usage and limits', function() {
        this.getUsageText().assertHasText(
          `You are using 2 out of ${ENVIRONMENTS_LIMIT + 1} environments`
        );
      });

      it('shows tooltip ', function() {
        this.getUsageTooltip().assertIsVisible();
      });
    });

    describe('on v1 pricing', function() {
      beforeEach(function() {
        this.setPricing('pricing_version_1');
        this.init();
      });

      it('shows usage without limits', function() {
        this.getUsageText().assertHasText(`You are using 1 environment`);
      });

      it('does not show tooltip ', function() {
        this.getUsageTooltip().assertNonExistent();
      });
    });
  });

  describe('when limit is reached on v2 pricing', function() {
    beforeEach(function() {
      this.setPricing('pricing_version_2');
      this.setUsage(ENVIRONMENTS_LIMIT);
    });

    it('does not render create button', function() {
      this.init();
      this.container.find('openCreateDialog').assertNonExistent();
    });

    it('should render upgrade space button when user is admin', function() {
      this.setAdmin(true);
      this.init();

      this.container.find('openUpgradeDialog').assertIsVisible();
      this.container.find('subscriptionLink').assertNonExistent();
    });

    it('should not show upgrade action when user is not admin', function() {
      this.setAdmin(false);
      this.init();

      this.container.find('openUpgradeDialog').assertNonExistent();
      this.container.find('subscriptionLink').assertNonExistent();
    });
  });
});