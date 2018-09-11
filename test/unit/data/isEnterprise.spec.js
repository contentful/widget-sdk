describe('data/isEnterprise', function() {
  beforeEach(function() {
    this.createOrganizationEndpointStub = sinon.stub();

    module('contentful/test', $provide => {
      $provide.value('data/EndpointFactory.es6', {
        createOrganizationEndpoint: this.createOrganizationEndpointStub
      });
    });

    this.lib = this.$inject('data/isEnterprise.es6');
  });

  describe('#isEnterpriseV1', function() {
    beforeEach(function() {
      this.assertIfEnterprise = (expected, planNames) => {
        planNames.forEach(planName => {
          expect(this.lib.isEnterpriseV1({ subscriptionPlan: { name: planName } })).toEqual(
            expected
          );
        });
      };
    });

    it('returns true for org that is on an enterprise plan', function() {
      this.assertIfEnterprise(true, [
        'enterprise',
        'Enterprise',
        'xxl EnterPrise',
        'Oh my what an ENTERPRISE',
        'Such a cool eNtErPrIsE',
        '123 enterprise 123',
        'best enterpriSE 2017',
        'ENTERPRISE',
        'Business (Quarterly)',
        'business (quarterly)',
        'Business (Monthly)',
        'Business (Annual)',
        'Scale (Quarterly)',
        'Scale (Monthly)',
        'Scale (Annual)',
        'scale (annual)'
      ]);
    });

    it('returns false otherwise', function() {
      this.assertIfEnterprise(false, [
        '',
        undefined,
        123,
        'Professional Edition',
        'enter prise',
        'Business',
        'Business (half-year)',
        'scale',
        'scale (yearly)'
      ]);
    });
  });

  describe('#isEnterpriseV2', async function() {
    beforeEach(function() {
      this.assertIfEnterprise = async (expected, customerType) => {
        const endpointStub = sinon.stub().resolves({ items: [{ customerType }] });
        this.createOrganizationEndpointStub.returns(endpointStub);

        expect(await this.lib.isEnterpriseV2({ sys: { id: 'orgid' } })).toBe(expected);

        sinon.assert.calledWith(this.createOrganizationEndpointStub, 'orgid');
        sinon.assert.calledOnce(endpointStub);
      };
    });

    it('returns false for non-committed organizations', async function() {
      await this.assertIfEnterprise(false, 'Self-service');
    });

    it('returns true for committed organizations', async function() {
      await this.assertIfEnterprise(true, 'Enterprise');
    });

    it('returns false if fetching plan failed', async function() {
      const endpointStub = sinon.stub().rejects();
      this.createOrganizationEndpointStub.returns(endpointStub);

      expect(await this.lib.isEnterpriseV2({ sys: { id: 'orgid' } })).toBe(false);

      sinon.assert.calledWith(this.createOrganizationEndpointStub, 'orgid');
      sinon.assert.calledOnce(endpointStub);
    });
  });

  describe('#isEnterprise', function() {
    it('checks v1 organization', async function() {
      const result = await this.lib.default({
        sys: { id: 'orgid' },
        pricingVersion: 'pricing_version_1',
        subscriptionPlan: { name: 'enterprise' }
      });

      expect(result).toBe(true);
      sinon.assert.notCalled(this.createOrganizationEndpointStub);
    });

    it('checks v2 organization', async function() {
      const plan = { customerType: 'Enterprise' };
      const endpointStub = sinon.stub().resolves({ items: [plan] });
      this.createOrganizationEndpointStub.returns(endpointStub);

      const result = await this.lib.default({
        sys: { id: 'orgid' },
        pricingVersion: 'pricing_version_2'
      });

      expect(result).toBe(true);
      sinon.assert.calledWith(this.createOrganizationEndpointStub, 'orgid');
      sinon.assert.calledOnce(endpointStub);
    });

    it('returns false for unknown pricing', async function() {
      expect(await this.lib.default({ sys: { id: 'orgid' } })).toBe(false);
    });

    it('caches organiation enterprise status', async function() {
      const plan = { customerType: 'Enterprise' };
      const endpointStub = sinon.stub().resolves({ items: [plan] });
      this.createOrganizationEndpointStub.returns(endpointStub);

      const org = {
        sys: { id: 'orgid' },
        pricingVersion: 'pricing_version_2'
      };

      expect(await this.lib.default(org)).toBe(true);
      expect(await this.lib.default(org)).toBe(true);

      sinon.assert.calledWith(this.createOrganizationEndpointStub, 'orgid');
      sinon.assert.calledOnce(this.createOrganizationEndpointStub);
      sinon.assert.calledOnce(endpointStub);
    });
  });
});
