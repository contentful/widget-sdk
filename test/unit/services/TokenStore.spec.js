import * as K from 'helpers/mocks/kefir';

describe('Token store service', function () {

  beforeEach(function () {
    module('contentful/test');

    this.rawSpaces = _.map(['a-space', 'b-space', 'c-space'], function (name) {
      return {
        name: name,
        sys: {id: name + '-id'},
        organization: {sys: {id: 'testorg'}}
      };
    });

    this.fetchWithAuth = sinon.stub().resolves({
      sys: {createdBy: this.user},
      spaces: this.rawSpaces
    });
    this.$inject('data/CMA/TokenInfo').default = () => this.fetchWithAuth;

    this.tokenStore = this.$inject('services/TokenStore');
    this.OrganizationRoles = this.$inject('services/OrganizationRoles');

    this.client = this.$inject('client');
    this.client.newSpace = sinon.stub();

    this.spaces = _.map(this.rawSpaces, function (raw) {
      return {
        data: _.cloneDeep(raw),
        getId: _.constant(raw.sys.id),
        update: sinon.stub()
      };
    });

    this.organizations = [{ sys: { id: 'org1' } }, { sys: { id: 'org2' } }, { sys: { id: 'org3' } }];
    this.user = {
      firstName: 'hello',
      organizationMemberships: this.organizations.map((organization) => { return { organization }; })
    };

    this.refresh = function (...spaces) {
      this.fetchWithAuth.resolves({
        sys: {createdBy: this.user},
        spaces: spaces
      });
      return this.tokenStore.refresh();
    };
  });

  describe('#refresh()', function () {
    it('fetches token returns promise of token refresh', function* () {
      this.client.newSpace.returns(this.spaces[0]);
      this.fetchWithAuth.resolves({
        sys: {createdBy: this.user},
        spaces: [this.rawSpaces[0]]
      });

      yield this.tokenStore.refresh();
      sinon.assert.calledOnce(this.fetchWithAuth);
    });
  });

  it('reloads app on =/= 401', function () {
    const notification = this.$inject('ReloadNotification');
    notification.trigger = sinon.spy();
    this.fetchWithAuth.rejects({statusCode: 404});

    this.tokenStore.refresh();
    this.$apply();
    sinon.assert.calledOnce(notification.trigger);
  });

  describe('#getSpace()', function () {
    it('returns promise resolving to requested space', function* () {
      this.client.newSpace.returns(this.spaces[0]);
      yield this.refresh(this.rawSpaces[0]);
      const space = yield this.tokenStore.getSpace('a-space-id');
      expect(space).toBe(this.spaces[0]);
    });

    it('returns rejected promise if space cannot be found', function* () {
      try {
        yield this.tokenStore.getSpace('xyz');
      } catch (err) {
        expect(err instanceof Error).toBe(true);
        expect(err.message).toBe('No space with given ID could be found.');
      }
    });
  });

  describe('#getSpaces()', function () {
    it('returns promise resolving to spaces list', function* () {
      this.client.newSpace.onFirstCall().returns(this.spaces[0]);
      this.client.newSpace.onSecondCall().returns(this.spaces[1]);
      yield this.refresh(this.rawSpaces[0], this.rawSpaces[1]);
      const spaces = yield this.tokenStore.getSpaces();
      expect(spaces).toEqual([this.rawSpaces[0], this.rawSpaces[1]]);
    });
  });

  describe('#user$', function () {
    it('is initially null', function () {
      K.assertCurrentValue(this.tokenStore.user$, null);
    });

    it('updates user when tokenStore is refreshed', function* () {
      yield this.refresh();
      K.assertCurrentValue(this.tokenStore.user$, this.user);
    });

    it('skips duplicates', function* () {
      const usersArr = K.extractValues(this.tokenStore.user$);
      yield this.refresh();
      yield this.refresh();
      expect(usersArr.filter(_.identity).length).toBe(1);
    });
  });

  describe('#spaces$', function () {
    it('is initially empty', function () {
      K.assertCurrentValue(this.tokenStore.spaces$, null);
    });

    it('updates spaces when tokenStore is refreshed', function* () {
      this.client.newSpace.returns(this.spaces[0]);
      yield this.refresh(this.rawSpaces[0]);
      K.assertCurrentValue(this.tokenStore.spaces$, [this.spaces[0]]);
    });
  });

  describe('#spacesByOrganization$', function () {
    it('is initially empty', function () {
      K.assertCurrentValue(this.tokenStore.spacesByOrganization$, null);
    });

    it('updates property when tokenStore is refreshed', function* () {
      this.client.newSpace.returns(this.spaces[0]);
      yield this.refresh(this.rawSpaces[0]);
      K.assertMatchCurrentValue(
        this.tokenStore.spacesByOrganization$,
        sinon.match({testorg: [this.spaces[0]]})
      );
    });
  });

  describe('#organizations$', function () {
    it('is initially empty', function () {
      K.assertCurrentValue(this.tokenStore.organizations$, []);
    });

    it('updates property when tokenStore is refreshed', function* () {
      yield this.refresh();
      K.assertMatchCurrentValue(
        this.tokenStore.organizations$,
        sinon.match(this.organizations)
      );
    });
  });
});
