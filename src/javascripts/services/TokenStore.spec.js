import * as K from '__mocks__/kefirMock';
import * as TokenStore from 'services/TokenStore';
import _ from 'lodash';
import * as ClientServices from 'services/client';
import * as ReloadNotification from 'app/common/ReloadNotification';
import * as TokenInfo from 'data/CMA/TokenInfo';
import { waitFor } from '@testing-library/dom';

jest.mock('data/CMA/TokenInfo');
jest.mock('app/common/ReloadNotification');
jest.mock('services/client');

describe('Token store service', () => {
  let fetchWithAuth;
  let reloadNotification;
  let user;
  let spaces;
  let organizations;
  let refresh;
  beforeEach(async function () {
    spaces = ['a-space', 'b-space', 'c-space'].map((name) => ({
      name: name,
      sys: { id: name + '-id' },
      organization: { sys: { id: 'testorg' } },
    }));

    organizations = [{ sys: { id: 'org1' } }, { sys: { id: 'org2' } }, { sys: { id: 'org3' } }];

    user = {
      firstName: 'hello',
      organizationMemberships: organizations.map((organization) => {
        return { organization };
      }),
    };

    fetchWithAuth = jest.fn().mockResolvedValue({
      sys: { createdBy: user },
      spaces: spaces,
    });

    refresh = function (...spaces) {
      fetchWithAuth.mockResolvedValue({
        sys: { createdBy: user },
        spaces: spaces,
      });
      return TokenStore.refresh();
    };

    reloadNotification = {
      trigger: jest.fn(),
      triggerAndLogout: jest.fn(),
    };

    TokenInfo.default = () => fetchWithAuth;

    ReloadNotification.default = reloadNotification;

    ClientServices.default = {
      newSpace: jest.fn(),
    };
  });

  afterEach(() => {
    TokenStore.reset();
  });

  it('reloads app on =/= 401', async function () {
    fetchWithAuth.mockRejectedValue({ statusCode: 404 });

    TokenStore.refresh();
    await waitFor(() => expect(reloadNotification.triggerAndLogout).toHaveBeenCalledTimes(1));
  });

  describe('#refresh()', () => {
    beforeEach(function () {
      fetchWithAuth.mockResolvedValue({
        sys: { createdBy: user },
        spaces: [spaces[0]],
      });
    });

    it('fetches token returns promise of token refresh', async function () {
      await TokenStore.refresh();
      expect(fetchWithAuth).toHaveBeenCalledTimes(1);
    });

    it('emits on tokenUpdate$', async function () {
      let updated = false;

      const offValue = K.onValue(TokenStore.tokenUpdate$, () => (updated = true));

      await TokenStore.refresh();

      expect(updated).toBe(true);

      offValue();
    });
  });

  describe('#getSpace()', () => {
    it('returns promise resolving to requested space', async function () {
      await refresh(spaces[0]);
      const space = await TokenStore.getSpace('a-space-id');
      expect(space).toEqual(spaces[0]);
    });

    it('returns rejected promise if space cannot be found', async function () {
      const error = await TokenStore.getSpace('xyz').catch((e) => e);
      expect(error instanceof Error).toBe(true);
      expect(error.message).toBe('No space with given ID could be found.');
    });
  });

  describe('#getSpaces()', () => {
    it('returns promise resolving to spaces list', async function () {
      await refresh(spaces[0], spaces[1]);
      const tokenSpaces = await TokenStore.getSpaces();
      expect(tokenSpaces).toEqual([spaces[0], spaces[1]]);
    });
  });

  describe('#user$', () => {
    it('is initially null', function () {
      K.assertCurrentValue(TokenStore.user$, null);
    });

    it('updates user when TokenStore is refreshed', async function () {
      await refresh();
      K.assertCurrentValue(TokenStore.user$, user);
    });

    it('skips duplicates', async function () {
      const usersArr = K.extractValues(TokenStore.user$);
      await refresh();
      await refresh();
      expect(usersArr.filter(_.identity)).toHaveLength(1);
    });
  });

  describe('#spacesByOrganization$', () => {
    it('is initially empty', function () {
      K.assertCurrentValue(TokenStore.spacesByOrganization$, null);
    });

    it('updates property when TokenStore is refreshed', async function () {
      await refresh(spaces[0]);
      K.assertContainingCurrentValue(TokenStore.spacesByOrganization$, { testorg: [spaces[0]] });
    });
  });

  describe('#organizations$', () => {
    it('is initially empty', function () {
      K.assertCurrentValue(TokenStore.organizations$, []);
    });

    it('updates property when TokenStore is refreshed', async function () {
      await refresh();
      K.assertContainingCurrentValue(TokenStore.organizations$, organizations);
    });
  });
});
