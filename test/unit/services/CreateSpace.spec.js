import * as sinon from 'test/helpers/sinon';

describe('CreateSpace', () => {
  beforeEach(function() {
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
    this.isPOCEnabled = sinon.stub().resolves(false);

    module('contentful/test', $provide => {
      $provide.value('services/TokenStore.es6', {
        getOrganization: this.getOrganization
      });
      $provide.value('utils/LaunchDarkly', {});
      $provide.value('access_control/AccessChecker', this.accessChecker);
      $provide.value('utils/LaunchDarkly/index.es6', {
        getCurrentVariation: this.isPOCEnabled
      });
      $provide.value('services/ResourceService.es6', () => ({
        get: sinon.stub().returns(
          Promise.resolve({
            usage: 1,
            limits: {
              maximum: 5
            }
          })
        )
      }));
    });
    this.PricingDataProvider = this.$inject('account/pricing/PricingDataProvider.es6');
    this.PricingDataProvider.getSpaceRatePlans = this.getSpaceRatePlans;
    this.PricingDataProvider.getBasePlan = sinon.stub().returns({ customerType: 'Enterprise' });
    this.modalDialog = this.$inject('modalDialog');
    this.CreateSpace = this.$inject('services/CreateSpace.es6');
    this.modalDialog.open = sinon
      .stub()
      .returns({ promise: this.resolve(), destroy: sinon.stub().returns(Promise.resolve()) });
    this.CreateSpace = this.$inject('services/CreateSpace.es6');
  });

  describe('#showDialog', () => {
    it('opens old dialog with v1 org id', function*() {
      yield this.CreateSpace.showDialog('v1');
      const modalArgs = this.modalDialog.open.firstCall.args[0];
      expect(modalArgs.scopeData.organization).toBe(this.v1Org);
      expect(modalArgs.template).toContain('cf-create-new-space');
      sinon.assert.calledOnce(this.modalDialog.open);
    });

    it('opens wizard with v2 org id', function*() {
      yield this.CreateSpace.showDialog('v2');
      const modalArgs = this.modalDialog.open.secondCall.args[0];
      expect(modalArgs.scopeData.organization.sys.id).toBe(this.v2Org.sys.id);
      expect(modalArgs.template).toContain('cf-space-wizard');
      sinon.assert.calledTwice(this.modalDialog.open);
    });

    it('throws if no org id is passed', function*() {
      try {
        yield this.CreateSpace.showDialog();
      } catch (e) {
        expect(e).toBeDefined();
        expect(e instanceof Error).toBe(true);
      }
    });

    it('checks for creation permission', function*() {
      this.accessChecker.canCreateSpaceInOrganization.returns(false);
      yield this.CreateSpace.showDialog('v1');
      sinon.assert.calledWith(this.accessChecker.canCreateSpaceInOrganization, 'v1');
    });

    it('opens the enterprise dialog for enterprise orgs', async function() {
      this.getSpaceRatePlans.returns([this.ratePlans.enterprise]);
      this.isPOCEnabled.resolves(true);
      await this.CreateSpace.showDialog('v2');
      const modalArgs = this.modalDialog.open.secondCall.args[0];
      expect(modalArgs.scopeData.modalProps.organization.sys.id).toBe(this.v2Org.sys.id);
      expect(modalArgs.template).toContain('enterprise-space-wizard');
      sinon.assert.calledTwice(this.modalDialog.open);
    });
  });
});
