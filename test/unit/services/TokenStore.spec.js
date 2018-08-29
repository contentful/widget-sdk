import * as K from 'helpers/mocks/kefir';

describe('Token store service', () => {
  beforeEach(function() {
    this.fetchWithAuth = sinon.stub().resolves({
      sys: { createdBy: this.user },
      spaces: this.spaces
    });
    module('contentful/test', $provide => {
      $provide.value('data/CMA/TokenInfo', {
        default: () => this.fetchWithAuth
      });
    });

    this.spaces = _.map(['a-space', 'b-space', 'c-space'], name => ({
      name: name,
      sys: { id: name + '-id' },
      organization: { sys: { id: 'testorg' } }
    }));

    this.tokenStore = this.$inject('services/TokenStore');
    this.OrganizationRoles = this.$inject('services/OrganizationRoles');

    this.client = this.$inject('client');
    this.client.newSpace = sinon.stub();

    this.organizations = [
      { sys: { id: 'org1' } },
      { sys: { id: 'org2' } },
      { sys: { id: 'org3' } }
    ];
    this.user = {
      firstName: 'hello',
      organizationMemberships: this.organizations.map(organization => {
        return { organization };
      })
    };

    this.refresh = function(...spaces) {
      this.fetchWithAuth.resolves({
        sys: { createdBy: this.user },
        spaces: spaces
      });
      return this.tokenStore.refresh();
    };
  });

  describe('#refresh()', () => {
    it('fetches token returns promise of token refresh', function*() {
      this.fetchWithAuth.resolves({
        sys: { createdBy: this.user },
        spaces: [this.spaces[0]]
      });

      yield this.tokenStore.refresh();
      sinon.assert.calledOnce(this.fetchWithAuth);
    });
  });

  it('reloads app on =/= 401', function() {
    const notification = this.$inject('ReloadNotification');
    notification.trigger = sinon.spy();
    this.fetchWithAuth.rejects({ statusCode: 404 });

    this.tokenStore.refresh();
    this.$apply();
    sinon.assert.calledOnce(notification.trigger);
  });

  describe('#getSpace()', () => {
    it('returns promise resolving to requested space', function*() {
      yield this.refresh(this.spaces[0]);
      const space = yield this.tokenStore.getSpace('a-space-id');
      expect(space).toEqual(this.spaces[0]);
    });

    it('returns rejected promise if space cannot be found', function*() {
      const error = yield this.tokenStore.getSpace('xyz').catch(e => e);
      expect(error instanceof Error).toBe(true);
      expect(error.message).toBe('No space with given ID could be found.');
    });
  });

  describe('#getSpaces()', () => {
    it('returns promise resolving to spaces list', function*() {
      yield this.refresh(this.spaces[0], this.spaces[1]);
      const spaces = yield this.tokenStore.getSpaces();
      expect(spaces).toEqual([this.spaces[0], this.spaces[1]]);
    });
  });

  describe('#user$', () => {
    it('is initially null', function() {
      K.assertCurrentValue(this.tokenStore.user$, null);
    });

    it('updates user when tokenStore is refreshed', function*() {
      yield this.refresh();
      K.assertCurrentValue(this.tokenStore.user$, this.user);
    });

    it('skips duplicates', function*() {
      const usersArr = K.extractValues(this.tokenStore.user$);
      yield this.refresh();
      yield this.refresh();
      expect(usersArr.filter(_.identity).length).toBe(1);
    });
  });

  describe('#spacesByOrganization$', () => {
    it('is initially empty', function() {
      K.assertCurrentValue(this.tokenStore.spacesByOrganization$, null);
    });

    it('updates property when tokenStore is refreshed', function*() {
      yield this.refresh(this.spaces[0]);
      K.assertMatchCurrentValue(
        this.tokenStore.spacesByOrganization$,
        sinon.match({ testorg: [this.spaces[0]] })
      );
    });
  });

  describe('#organizations$', () => {
    it('is initially empty', function() {
      K.assertCurrentValue(this.tokenStore.organizations$, []);
    });

    it('updates property when tokenStore is refreshed', function*() {
      yield this.refresh();
      K.assertMatchCurrentValue(this.tokenStore.organizations$, sinon.match(this.organizations));
    });
  });
});
