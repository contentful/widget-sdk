import * as sinon from 'helpers/sinon';

describe('CreateSpace', function () {
  beforeEach(function () {
    this.spaceContext = {};

    this.v1Org = {sys: {id: 'v1'}, pricingVersion: 'pricing_version_1'};
    this.v2Org = {sys: {id: 'v2'}, pricingVersion: 'pricing_version_2'};

    this.getOrganization = sinon.stub().rejects();
    this.getOrganization.withArgs('v1').resolves(this.v1Org);
    this.getOrganization.withArgs('v2').resolves(this.v2Org);

    module('contentful/test', ($provide) => {
      $provide.value('services/TokenStore', {getOrganization: this.getOrganization});
      $provide.value('spaceContext', this.spaceContext);
      $provide.value('utils/LaunchDarkly', {});
    });
    this.modalDialog = this.$inject('modalDialog');
    this.modalDialog.open = sinon.stub().returns({promise: this.resolve()});
    this.CreateSpace = this.$inject('services/CreateSpace');
  });

  describe('#showDialog', function () {
    it('opens old dialog with v1 org', function* () {
      yield this.CreateSpace.showDialog('v1');
      const modalArgs = this.modalDialog.open.firstCall.args[0];
      expect(modalArgs.scopeData.organizationId).toBe('v1');
      expect(modalArgs.template).toContain('cf-create-new-space');
      sinon.assert.calledOnce(this.modalDialog.open);
    });

    it('opens wizard with v2 org ID', function* () {
      yield this.CreateSpace.showDialog('v2');
      const modalArgs = this.modalDialog.open.firstCall.args[0];
      expect(modalArgs.scopeData.organizationId).toBe('v2');
      expect(modalArgs.template).toContain('cf-create-space-wizard');
      sinon.assert.calledOnce(this.modalDialog.open);
    });

    it('takes org id from space context if not passed explicitly', function* () {
      this.spaceContext.organization = {sys: {id: 'SPACE_ORG'}, pricingVersion: 'pricing_version_1'};
      yield this.CreateSpace.showDialog();
      const modalArgs = this.modalDialog.open.firstCall.args[0];
      expect(modalArgs.scopeData.organizationId).toBe('SPACE_ORG');
    });
  });
});
