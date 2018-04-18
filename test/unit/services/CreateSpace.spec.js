import * as sinon from 'helpers/sinon';

describe('CreateSpace', function () {
  beforeEach(function () {
    this.defaultOrg = {sys: {id: 'defaultorg'}, pricingVersion: 'pricing_version_1'};

    this.TheStore = {
      getStore: () => ({
        get: () => this.defaultOrg.sys.id
      })
    };

    this.v1Org = {sys: {id: 'v1'}, pricingVersion: 'pricing_version_1'};
    this.v2Org = {sys: {id: 'v2'}, pricingVersion: 'pricing_version_2'};

    this.getOrganization = sinon.stub().rejects();
    this.getOrganization.withArgs('defaultorg').resolves(this.defaultOrg);
    this.getOrganization.withArgs('v1').resolves(this.v1Org);
    this.getOrganization.withArgs('v2').resolves(this.v2Org);

    this.accessChecker = {
      canCreateSpaceInOrganization: sinon.stub().returns(true)
    };

    module('contentful/test', ($provide) => {
      $provide.value('services/TokenStore', {getOrganization: this.getOrganization});
      $provide.value('TheStore', this.TheStore);
      $provide.value('utils/LaunchDarkly', {});
      $provide.value('access_control/AccessChecker', this.accessChecker);
    });
    this.modalDialog = this.$inject('modalDialog');
    this.modalDialog.open = sinon.stub().returns({promise: this.resolve()});
    this.CreateSpace = this.$inject('services/CreateSpace');
  });

  describe('#showDialog', function () {
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
      expect(modalArgs.template).toContain('cf-create-space-wizard');
      sinon.assert.calledOnce(this.modalDialog.open);
    });

    it('takes org id from space context if not passed explicitly', function* () {
      yield this.CreateSpace.showDialog();
      const modalArgs = this.modalDialog.open.firstCall.args[0];
      expect(modalArgs.scopeData.organization).toBe(this.defaultOrg);
    });

    it('checks for creation permission', function* () {
      this.accessChecker.canCreateSpaceInOrganization.returns(false);
      yield this.CreateSpace.showDialog('v1');
      sinon.assert.calledWith(this.accessChecker.canCreateSpaceInOrganization, 'v1');
    });
  });
});
