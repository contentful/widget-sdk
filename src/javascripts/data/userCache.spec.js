import createCache from './userCache';
import { fetchAll } from 'data/CMA/FetchAll';

jest.mock('data/CMA/FetchAll', () => ({
  fetchAll: jest.fn().mockResolvedValue(),
}));

describe('data/userCache', () => {
  let userCache;

  beforeEach(async function () {
    const endpoint = {};
    userCache = createCache(endpoint);
  });

  function makeUser(id) {
    return { sys: { id: id } };
  }

  describe('#getAll()', () => {
    it('fetches users only once', () => {
      expect(fetchAll).not.toHaveBeenCalled();

      userCache.getAll();
      expect(fetchAll).toHaveBeenCalledTimes(1);

      userCache.getAll();

      expect(fetchAll).toHaveBeenCalledTimes(1);
    });

    it('it maps users by id', async () => {
      const userResponse = [makeUser('0'), makeUser('1')];
      fetchAll.mockResolvedValue(userResponse);
      const users = await userCache.getAll();
      expect(users).toEqual(userResponse);
    });

    it('it caches resulst', async function () {
      const userResponse = [makeUser('0'), makeUser('1')];
      fetchAll.mockResolvedValue(userResponse);
      const handleUsers = jest.fn();
      await userCache.getAll().then(handleUsers);
      await userCache.getAll().then(handleUsers);

      expect(handleUsers.mock.calls[0][0]).toBe(handleUsers.mock.calls[1][0]);
    });
  });

  describe('#get()', () => {
    it('fetches users only once', () => {
      expect(fetchAll).not.toHaveBeenCalled();
      userCache.get();
      expect(fetchAll).toHaveBeenCalledTimes(1);
      userCache.get();
      expect(fetchAll).toHaveBeenCalledTimes(1);
    });
    it('it gets users by id', async () => {
      const userResponse = [makeUser('0'), makeUser('1')];
      fetchAll.mockResolvedValue(userResponse);
      const user = await userCache.get('1');
      expect(user).toEqual(userResponse[1]);
    });
    it('resuses response from call to "#getAll()"', async () => {
      const userResponse = [makeUser('0'), makeUser('1')];
      fetchAll.mockResolvedValue(userResponse);
      const users = await userCache.getAll();
      const user = await userCache.get('0');
      expect(user).toBe(users[0]);
      expect(fetchAll).toHaveBeenCalledTimes(1);
    });
  });
});
