describe('data/OrganizationStatus', function() {
  beforeEach(function() {
    this.createOrganizationEndpointStub = sinon.stub();

    module('contentful/test', $provide => {
      $provide.value('data/EndpointFactory.es6', {
        createOrganizationEndpoint: this.createOrganizationEndpointStub
      });
    });

    this.lib = this.$inject('data/OrganizationStatus.es6');
  });

  describe('#getOrganizationStatusV1', function() {
    beforeEach(function() {
      this.assertIfEnterprise = (expected, planNames) => {
        planNames.forEach(planName => {
          const org = { subscriptionPlan: { name: planName } };
          const result = this.lib.getOrganizationStatusV1(org);
          expect(result.isEnterprise).toBe(expected);
        });
      };
    });

    it('returns isEnterprise=true for org that is on an enterprise plan', function() {
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

    it('returns isEnterprise=false otherwise', function() {
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

    it('returns isPaid=true if organization is converted', function() {
      const org = { subscription: { status: 'paid' } };
      const result = this.lib.getOrganizationStatusV1(org);
      expect(result.isPaid).toBe(true);
    });

    it('returns isPaid=false if organization is free', function() {
      const org = { subscription: { status: 'free' } };
      const result = this.lib.getOrganizationStatusV1(org);
      expect(result.isPaid).toBe(false);
    });

    it('returns pricing version 1', function() {
      const result = this.lib.getOrganizationStatusV1({});
      expect(result.pricingVersion).toBe(1);
    });
  });

  describe('#getOrganizationStatusV2', function() {
    beforeEach(function() {
      this.assertIfEnterprise = async (expected, customerType) => {
        const endpointStub = sinon.stub().resolves({ items: [{ customerType }] });
        this.createOrganizationEndpointStub.returns(endpointStub);

        const result = await this.lib.getOrganizationStatusV2({ sys: { id: 'orgid' } });
        expect(result.isEnterprise).toBe(expected);

        sinon.assert.calledWith(this.createOrganizationEndpointStub, 'orgid');
        sinon.assert.calledOnce(endpointStub);
      };

      this.assertIfPaid = async (expected, basePlanId) => {
        const endpointStub = sinon.stub().resolves({ items: [{ sys: { id: basePlanId } }] });
        this.createOrganizationEndpointStub.returns(endpointStub);

        const result = await this.lib.getOrganizationStatusV2({ sys: { id: 'orgid' } });
        expect(result.isPaid).toBe(expected);

        sinon.assert.calledWith(this.createOrganizationEndpointStub, 'orgid');
        sinon.assert.calledOnce(endpointStub);
      };
    });

    it('returns isEnterprise=false for non-committed organizations', async function() {
      await this.assertIfEnterprise(false, 'Self-service');
    });

    it('returns isEnterprise=true for committed organizations', async function() {
      await this.assertIfEnterprise(true, 'Enterprise');
    });

    it('returns isEnterprise=false if fetching plan failed', async function() {
      const endpointStub = sinon.stub().rejects();
      this.createOrganizationEndpointStub.returns(endpointStub);

      const result = await this.lib.getOrganizationStatusV2({ sys: { id: 'orgid' } });
      expect(result.isEnterprise).toBe(false);

      sinon.assert.calledWith(this.createOrganizationEndpointStub, 'orgid');
      sinon.assert.calledOnce(endpointStub);
    });

    it('returns isPaid=true if the base plan is not free', async function() {
      await this.assertIfPaid(true, 'moneyz');
    });

    it('returns isPaid=false if the base plan is free', async function() {
      await this.assertIfPaid(false, 'free');
    });

    it('returns pricing version 2', async function() {
      const endpointStub = sinon.stub().resolves({ items: [{ sys: { id: 'free' } }] });
      this.createOrganizationEndpointStub.returns(endpointStub);

      const result = await this.lib.getOrganizationStatusV2({ sys: { id: 'orgid' } });
      expect(result.pricingVersion).toBe(2);
    });
  });

  describe('#getOrganizationStatus', function() {
    it('checks v1 organization', async function() {
      const result = await this.lib.default({
        sys: { id: 'orgid' },
        pricingVersion: 'pricing_version_1',
        subscriptionPlan: { name: 'enterprise' },
        subscription: { status: 'paid' }
      });

      expect(result.pricingVersion).toBe(1);
      expect(result.isEnterprise).toBe(true);
      expect(result.isPaid).toBe(true);

      sinon.assert.notCalled(this.createOrganizationEndpointStub);
    });

    it('checks v2 organization', async function() {
      const plan = { customerType: 'Enterprise', sys: { id: 'free' } };
      const endpointStub = sinon.stub().resolves({ items: [plan] });
      this.createOrganizationEndpointStub.returns(endpointStub);

      const result = await this.lib.default({
        sys: { id: 'orgid' },
        pricingVersion: 'pricing_version_2'
      });

      expect(result.pricingVersion).toBe(2);
      expect(result.isEnterprise).toBe(true);
      expect(result.isPaid).toBe(false);

      sinon.assert.calledWith(this.createOrganizationEndpointStub, 'orgid');
      sinon.assert.calledOnce(endpointStub);
    });

    it('returns false for unknown pricing', async function() {
      const result = await this.lib.default({ sys: { id: 'orgid' } });
      expect(result.isEnterprise).toBe(false);
    });

    it('caches organiation status', async function() {
      const plan = { customerType: 'Enterprise' };
      const endpointStub = sinon.stub().resolves({ items: [plan] });
      this.createOrganizationEndpointStub.returns(endpointStub);

      const org = {
        sys: { id: 'orgid' },
        pricingVersion: 'pricing_version_2'
      };

      const result1 = await this.lib.default(org);
      expect(result1.isEnterprise).toBe(true);
      const result2 = await this.lib.default(org);
      expect(result2.isEnterprise).toBe(true);

      sinon.assert.calledWith(this.createOrganizationEndpointStub, 'orgid');
      sinon.assert.calledOnce(this.createOrganizationEndpointStub);
      sinon.assert.calledOnce(endpointStub);
    });
  });
});
