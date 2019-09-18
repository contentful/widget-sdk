import sinon from 'sinon';
import { $initialize, $apply } from 'test/utils/ng';
import { it } from 'test/utils/dsl';

describe('data/userCache.es6', () => {
  let userCache, fetchAll;

  beforeEach(async function() {
    this.system.set('data/CMA/FetchAll.es6', {
      fetchAll: (fetchAll = sinon.stub().resolves())
    });

    const { default: createCache } = await this.system.import('data/userCache.es6');

    await $initialize(this.system);

    const endpoint = {};
    userCache = createCache(endpoint);
  });

  function makeUser(id) {
    return { sys: { id: id } };
  }

  describe('#getAll()', () => {
    it('fetches users only once', () => {
      sinon.assert.notCalled(fetchAll);
      userCache.getAll();
      sinon.assert.calledOnce(fetchAll);
      userCache.getAll();
      sinon.assert.calledOnce(fetchAll);
    });

    it('it maps users by id', async () => {
      const userResponse = [makeUser('0'), makeUser('1')];
      fetchAll.resolves(userResponse);
      const users = await userCache.getAll();
      expect(users).toEqual(userResponse);
    });

    it('it caches resulst', function() {
      const userResponse = [makeUser('0'), makeUser('1')];
      fetchAll.resolves(userResponse);
      const handleUsers = sinon.stub();
      userCache.getAll().then(handleUsers);
      userCache.getAll().then(handleUsers);
      $apply();
      expect(handleUsers.args[0][0]).toBe(handleUsers.args[1][0]);
    });
  });

  describe('#get()', () => {
    it('fetches users only once', () => {
      sinon.assert.notCalled(fetchAll);
      userCache.get();
      sinon.assert.calledOnce(fetchAll);
      userCache.get();
      sinon.assert.calledOnce(fetchAll);
    });

    it('it gets users by id', async () => {
      const userResponse = [makeUser('0'), makeUser('1')];
      fetchAll.resolves(userResponse);
      const user = await userCache.get('1');
      expect(user).toEqual(userResponse[1]);
    });

    it('resuses response from call to "#getAll()"', async () => {
      const userResponse = [makeUser('0'), makeUser('1')];
      fetchAll.resolves(userResponse);
      const users = await userCache.getAll();
      userCache.get('0').then(user => {
        expect(user).toBe(users[0]);
        sinon.assert.calledOnce(fetchAll);
      });
    });
  });
});
