describe('OrganizationContext', function () {
  const API_HOST = '//SOME_API_HOST';
  const ORG = Object.freeze({
    sys: {
      type: 'Organization',
      id: 'foo'
    }
  });
  const ENDPOINT = _.noop;

  beforeEach(function () {
    this.Endpoint = {
      createOrganizationEndpoint: sinon.stub().returns(ENDPOINT)
    };
    this.authentication = { __esModule: true };
    this.Config = { apiUrl: function () { return API_HOST; } };
    this.fetchAll = sinon.stub();

    module('contentful/test', ($provide) => {
      $provide.value('data/Endpoint', this.Endpoint);
      $provide.value('Authentication', this.authentication);
      $provide.constant('Config', this.Config);
      $provide.value('data/CMA/FetchAll', {fetchAll: this.fetchAll});
    });
    this.fetchAll.resolves([]);
    this.OrganizationContext = this.$inject('classes/OrganizationContext');
  });

  describe('.create()', function () {
    it('throws an error if no organization is given', function () {
      expect(() => this.OrganizationContext.create({})).toThrow();
    });

    it('creates an object if an organization is given', function () {
      expect(this.OrganizationContext.create(ORG)).toBeInstanceOf(Object);
    });
  });

  describe('#organization', function () {
    it('is set to the object given in .create()', function () {
      const context = this.OrganizationContext.create(ORG);
      expect(context.organization).toEqual(ORG);
    });
  });

  describe('#getAllUsers', function () {
    it('got instantiated with a suitable Endpoint and passes query to a call', function () {
      const orgContext = this.OrganizationContext.create(ORG);
      const query = {};
      orgContext.getAllUsers(query);
      sinon.assert.calledWithExactly(this.fetchAll, ENDPOINT, ['users'], 100, query);
      sinon.assert.calledWithExactly(this.Endpoint.createOrganizationEndpoint, `${API_HOST}`, ORG.sys.id, this.authentication);
    });

    it('resolves with fetchAll results', function* () {
      const orgContext = this.OrganizationContext.create(ORG);
      this.fetchAll.resolves(['USER']);
      const users = yield orgContext.getAllUsers();
      expect(users).toEqual(['USER']);
    });
  });
});
