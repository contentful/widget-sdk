import sinon from 'sinon';

describe('data/EndpointFactory.es6', () => {
  beforeEach(async function() {
    this.Authentication = {};
    this.Config = { apiUrl: sinon.stub().returns('API_URL') };
    this.orgEndpoint = () => {};
    this.spaceEndpoint = () => {};
    this.Endpoint = {
      createOrganizationEndpoint: sinon.stub().returns(this.orgEndpoint),
      createSpaceEndpoint: sinon.stub().returns(this.spaceEndpoint)
    };

    this.system.set('Authentication.es6', this.Authentication);
    this.system.set('Config.es6', this.Config);
    this.system.set('data/Endpoint.es6', this.Endpoint);
    this.factory = await this.system.import('data/EndpointFactory.es6');
  });

  describe('#createOrganizationEndpoint', () => {
    it('delegates to `data/Endpoint#createOrganizationEndpoint`', function() {
      const orgEndpoint = this.factory.createOrganizationEndpoint('ORG_ID');
      sinon.assert.calledOnce(
        this.Endpoint.createOrganizationEndpoint.withArgs('API_URL', 'ORG_ID', sinon.match({}))
      );
      expect(orgEndpoint).toBe(this.orgEndpoint);
    });
  });
  describe('#createSpaceEndpoint', () => {
    it('delegates to `data/Endpoint#createSpaceEndpoint`', function() {
      const spaceEndpoint = this.factory.createSpaceEndpoint('SPACE_ID', 'ENV_ID');
      sinon.assert.calledOnce(
        this.Endpoint.createSpaceEndpoint.withArgs('API_URL', 'SPACE_ID', sinon.match({}), 'ENV_ID')
      );
      expect(spaceEndpoint).toBe(this.spaceEndpoint);
    });
  });
});