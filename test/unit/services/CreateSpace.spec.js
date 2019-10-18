import sinon from 'sinon';
import { $initialize, $inject } from 'test/utils/ng';
import { it } from 'test/utils/dsl';

describe('CreateSpace', () => {
  beforeEach(async function() {
    this.v1Org = { sys: { id: 'v1' }, pricingVersion: 'pricing_version_1' };
    this.v2Org = { sys: { id: 'v2' }, pricingVersion: 'pricing_version_2' };

    this.ratePlans = {
      enterprise: {
        productPlanType: 'free_space',
        productType: 'committed'
      },
      onDemand: {
        productPlanType: 'free_space',
        productType: 'on_demand'
      }
    };

    this.getOrganization = sinon.stub().rejects();

    this.getOrganization.withArgs('v1').resolves(this.v1Org);
    this.getOrganization.withArgs('v2').resolves(this.v2Org);

    this.accessChecker = {
      canCreateSpaceInOrganization: sinon.stub().returns(true)
    };
    this.getSpaceRatePlans = sinon.stub().returns([this.ratePlans.onDemand]);

    this.system.set('services/TokenStore.es6', {
      getOrganization: this.getOrganization
    });
    this.system.set('access_control/AccessChecker', this.accessChecker);
    this.system.set('services/ResourceService.es6', {
      default: () => ({
        get: sinon.stub().returns(
          Promise.resolve({
            usage: 1,
            limits: {
              maximum: 5
            }
          })
        )
      })
    });
    this.system.set('account/pricing/PricingDataProvider.es6', {
      getSpaceRatePlans: this.getSpaceRatePlans,
      isEnterprisePlan: sinon.stub().returns(false),
      getBasePlan: sinon.stub().returns({ customerType: 'Self-service' })
    });

    this.PricingDataProvider = await this.system.import('account/pricing/PricingDataProvider.es6');
    this.CreateSpace = await this.system.import('services/CreateSpace.es6');

    await $initialize(this.system, $provide => {
      $provide.constant('modalDialog', {
        open: sinon
          .stub()
          .returns({ promise: Promise.resolve(), destroy: sinon.stub().returns(Promise.resolve()) })
      });
    });

    this.modalDialog = $inject('modalDialog');
  });

  describe('#showDialog', () => {
    it('opens old dialog with v1 org id', async function() {
      await this.CreateSpace.showDialog('v1');
      const modalArgs = this.modalDialog.open.firstCall.args[0];
      expect(modalArgs.scopeData.organization).toBe(this.v1Org);
      expect(modalArgs.template).toContain('cf-create-new-space');
      sinon.assert.calledOnce(this.modalDialog.open);
    });

    it('opens wizard with v2 org id', async function() {
      await this.CreateSpace.showDialog('v2');
      const modalArgs = this.modalDialog.open.secondCall.args[0];
      expect(modalArgs.scopeData.organization.sys.id).toBe(this.v2Org.sys.id);
      expect(modalArgs.template).toContain('cf-space-wizard');
      sinon.assert.calledTwice(this.modalDialog.open);
    });

    it('throws if no org id is passed', async function() {
      try {
        await this.CreateSpace.showDialog();
      } catch (e) {
        expect(e).toBeDefined();
        expect(e instanceof Error).toBe(true);
      }
    });

    it('checks for creation permission', async function() {
      this.accessChecker.canCreateSpaceInOrganization.returns(false);
      await this.CreateSpace.showDialog('v1');
      sinon.assert.calledWith(this.accessChecker.canCreateSpaceInOrganization, 'v1');
    });

    it('opens the enterprise dialog for enterprise orgs', async function() {
      this.getSpaceRatePlans.returns([this.ratePlans.enterprise]);
      this.PricingDataProvider.getBasePlan.returns({ customerType: 'Enterprise' });
      this.PricingDataProvider.isEnterprisePlan.returns(true);
      await this.CreateSpace.showDialog('v2');
      const modalArgs = this.modalDialog.open.secondCall.args[0];
      expect(modalArgs.scopeData.modalProps.organization.sys.id).toBe(this.v2Org.sys.id);
      expect(modalArgs.template).toContain('enterprise-space-wizard');
      sinon.assert.calledTwice(this.modalDialog.open);
    });
  });
});
