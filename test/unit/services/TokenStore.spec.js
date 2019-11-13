import sinon from 'sinon';
import * as K from 'test/utils/kefir';
import _ from 'lodash';
import { $initialize, $apply } from 'test/utils/ng';
import { it } from 'test/utils/dsl';

describe('Token store service', () => {
  beforeEach(async function() {
    this.fetchWithAuth = sinon.stub().resolves({
      sys: { createdBy: this.user },
      spaces: this.spaces
    });

    this.stubs = {
      ReloadNotification: {
        trigger: sinon.stub()
      }
    };

    this.system.set('data/CMA/TokenInfo', {
      default: () => this.fetchWithAuth
    });
    this.system.set('app/common/ReloadNotification', {
      default: this.stubs.ReloadNotification
    });

    this.spaces = _.map(['a-space', 'b-space', 'c-space'], name => ({
      name: name,
      sys: { id: name + '-id' },
      organization: { sys: { id: 'testorg' } }
    }));

    this.system.set('services/client', {
      default: {
        newSpace: sinon.stub()
      }
    });

    this.tokenStore = await this.system.import('services/TokenStore');
    this.OrganizationRoles = await this.system.import('services/OrganizationRoles');

    await $initialize(this.system);

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
    it('fetches token returns promise of token refresh', async function() {
      this.fetchWithAuth.resolves({
        sys: { createdBy: this.user },
        spaces: [this.spaces[0]]
      });

      await this.tokenStore.refresh();
      sinon.assert.calledOnce(this.fetchWithAuth);
    });
  });

  it('reloads app on =/= 401', function() {
    this.fetchWithAuth.rejects({ statusCode: 404 });

    this.tokenStore.refresh();
    $apply();
    sinon.assert.calledOnce(this.stubs.ReloadNotification.trigger);
  });

  describe('#getSpace()', () => {
    it('returns promise resolving to requested space', async function() {
      await this.refresh(this.spaces[0]);
      const space = await this.tokenStore.getSpace('a-space-id');
      expect(space).toEqual(this.spaces[0]);
    });

    it('returns rejected promise if space cannot be found', async function() {
      const error = await this.tokenStore.getSpace('xyz').catch(e => e);
      expect(error instanceof Error).toBe(true);
      expect(error.message).toBe('No space with given ID could be found.');
    });
  });

  describe('#getSpaces()', () => {
    it('returns promise resolving to spaces list', async function() {
      await this.refresh(this.spaces[0], this.spaces[1]);
      const spaces = await this.tokenStore.getSpaces();
      expect(spaces).toEqual([this.spaces[0], this.spaces[1]]);
    });
  });

  describe('#user$', () => {
    it('is initially null', function() {
      K.assertCurrentValue(this.tokenStore.user$, null);
    });

    it('updates user when tokenStore is refreshed', async function() {
      await this.refresh();
      K.assertCurrentValue(this.tokenStore.user$, this.user);
    });

    it('skips duplicates', async function() {
      const usersArr = K.extractValues(this.tokenStore.user$);
      await this.refresh();
      await this.refresh();
      expect(usersArr.filter(_.identity).length).toBe(1);
    });
  });

  describe('#spacesByOrganization$', () => {
    it('is initially empty', function() {
      K.assertCurrentValue(this.tokenStore.spacesByOrganization$, null);
    });

    it('updates property when tokenStore is refreshed', async function() {
      await this.refresh(this.spaces[0]);
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

    it('updates property when tokenStore is refreshed', async function() {
      await this.refresh();
      K.assertMatchCurrentValue(this.tokenStore.organizations$, sinon.match(this.organizations));
    });
  });
});
