describe('hasPremiumTemplatesEnabled', function() {
  let hasPremiumTemplatesEnabled;

  // We inject instead of importing so dependencies of
  // `PricingDataProvider` are available
  beforeEach(function() {
    module('contentful/test');
    hasPremiumTemplatesEnabled = this.$inject('app/Webhooks/hasPremiumTemplatesEnabled.es6')
      .default;
  });

  const test = ({ user, ver, endpointStub }) => {
    const result = hasPremiumTemplatesEnabled({
      user: user || {},
      organizationContext: {
        organization: { pricingVersion: `pricing_version_${ver || 1}` },
        endpoint: endpointStub || sinon.stub()
      }
    });

    // `hasPremiumTemplatesEnabled` is used as a resolver
    // in Angular UI Router. This function returns a bool
    // or a promise of bool. We wrap it here with
    // `Promise.resolve` so the test code always deals
    // with a promise.
    return Promise.resolve(result);
  };

  it('is enabled for @contentful.com users', async function() {
    const user = { confirmed: true, email: 'jakub@contentful.com' };
    expect(await test({ user })).toBe(true);
  });

  it('is disabled on pricing version 1', async function() {
    const endpointStub = sinon.stub();
    expect(await test({ endpointStub })).toBe(false);
    sinon.assert.notCalled(endpointStub);
  });

  it('is disabled on pricing version 2, not commited orgs', async function() {
    const plan = { customerType: 'Self-service' };
    const endpointStub = sinon.stub().resolves({ items: [plan] });
    expect(await test({ endpointStub, ver: 2 })).toBe(false);
    sinon.assert.calledOnce(endpointStub);
  });

  it('is enabled for committed v2 orgs', async function() {
    const plan = { customerType: 'Enterprise' };
    const endpointStub = sinon.stub().resolves({ items: [plan] });
    expect(await test({ endpointStub, ver: 2 })).toBe(true);
    sinon.assert.calledOnce(endpointStub);
  });

  it('is disabled if fetching plan failed', async function() {
    const endpointStub = sinon.stub().rejects();
    expect(await test({ endpointStub, ver: 2 })).toBe(false);
    sinon.assert.calledOnce(endpointStub);
  });
});
