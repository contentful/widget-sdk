'use strict';

describe('data/userCache', () => {
  let userCache, fetchAll;

  beforeEach(function() {
    module('contentful/test', $provide => {
      $provide.value('data/CMA/FetchAll.es6', {
        fetchAll: (fetchAll = sinon.stub().resolves())
      });
    });

    const createCache = this.$inject('data/userCache');
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

    it('it maps users by id', () => {
      const userResponse = [makeUser('0'), makeUser('1')];
      fetchAll.resolves(userResponse);
      return userCache.getAll().then(users => {
        expect(users).toEqual(userResponse);
      });
    });

    it('it caches resulst', function() {
      const userResponse = [makeUser('0'), makeUser('1')];
      fetchAll.resolves(userResponse);
      const handleUsers = sinon.stub();
      userCache.getAll().then(handleUsers);
      userCache.getAll().then(handleUsers);
      this.$apply();
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

    it('it gets users by id', () => {
      const userResponse = [makeUser('0'), makeUser('1')];
      fetchAll.resolves(userResponse);
      return userCache.get('1').then(user => {
        expect(user).toEqual(userResponse[1]);
      });
    });

    it('resuses response from call to "#getAll()"', () => {
      const userResponse = [makeUser('0'), makeUser('1')];
      fetchAll.resolves(userResponse);
      return userCache.getAll().then(users =>
        userCache.get('0').then(user => {
          expect(user).toBe(users[0]);
          sinon.assert.calledOnce(fetchAll);
        })
      );
    });
  });
});
