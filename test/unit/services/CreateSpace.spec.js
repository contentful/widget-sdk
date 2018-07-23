import * as sinon from 'helpers/sinon';

describe('CreateSpace', () => {
  beforeEach(function () {
    this.v1Org = {sys: {id: 'v1'}, pricingVersion: 'pricing_version_1'};
    this.v2Org = {sys: {id: 'v2'}, pricingVersion: 'pricing_version_2'};

    this.getOrganization = sinon.stub().rejects();

    this.getOrganization.withArgs('v1').resolves(this.v1Org);
    this.getOrganization.withArgs('v2').resolves(this.v2Org);

    this.accessChecker = {
      canCreateSpaceInOrganization: sinon.stub().returns(true)
    };

    this.getSpaceRatePlans = sinon.stub().returns([{
      productPlanType: 'free_space',
      productType: 'on_demand'
    }]);

    module('contentful/test', ($provide) => {
      $provide.value('services/TokenStore', {
        getOrganization: this.getOrganization
      });
      $provide.value('utils/LaunchDarkly', {});
      $provide.value('access_control/AccessChecker', this.accessChecker);
      $provide.value('account/pricing/PricingDataProvider', {
        getSpaceRatePlans: this.getSpaceRatePlans,
        isPOCEnabled: sinon.stub().returns(false)
      });
    });
    this.modalDialog = this.$inject('modalDialog');
    this.modalDialog.open = sinon.stub().returns({promise: this.resolve()});
    this.CreateSpace = this.$inject('services/CreateSpace');
  });

  describe('#showDialog', () => {
    it('opens old dialog with v1 org id', function* () {
      yield this.CreateSpace.showDialog('v1');
      const modalArgs = this.modalDialog.open.firstCall.args[0];
      expect(modalArgs.scopeData.organization).toBe(this.v1Org);
      expect(modalArgs.template).toContain('cf-create-new-space');
      sinon.assert.calledOnce(this.modalDialog.open);
    });

    it('opens wizard with v2 org id', function* () {
      yield this.CreateSpace.showDialog('v2');
      const modalArgs = this.modalDialog.open.firstCall.args[0];
      expect(modalArgs.scopeData.organization.sys.id).toBe(this.v2Org.sys.id);
      expect(modalArgs.template).toContain('cf-space-wizard');
      sinon.assert.calledOnce(this.modalDialog.open);
    });

    it('throws if no org id is passed', function* () {
      try {
        yield this.CreateSpace.showDialog();
      } catch (e) {
        expect(e).toBeDefined();
        expect(e instanceof Error).toBe(true);
      }
    });

    it('checks for creation permission', function* () {
      this.accessChecker.canCreateSpaceInOrganization.returns(false);
      yield this.CreateSpace.showDialog('v1');
      sinon.assert.calledWith(this.accessChecker.canCreateSpaceInOrganization, 'v1');
    });
  });
});
