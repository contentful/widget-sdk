'use strict';

describe('data/userCache', function () {
  var userCache, space;

  beforeEach(function () {
    module('cf.data');
    var createCache = this.$inject('data/userCache');
    space = {
      getUsers: sinon.stub().resolves()
    };
    userCache = createCache(space);
  });

  function makeUser (id) {
    return { getId: _.constant(id) };
  }

  describe('#getAll()', function () {
    it('fetches users only once', function () {
      sinon.assert.notCalled(space.getUsers);
      userCache.getAll();
      sinon.assert.calledOnce(space.getUsers);
      userCache.getAll();
      sinon.assert.calledOnce(space.getUsers);
    });

    pit('it maps users by id', function () {
      var userResponse = [makeUser('0'), makeUser('1')];
      space.getUsers.resolves(userResponse);
      return userCache.getAll()
      .then(function (users) {
        expect(users).toEqual(userResponse);
      });
    });

    it('it caches resulst', function () {
      var userResponse = [makeUser('0'), makeUser('1')];
      space.getUsers.resolves(userResponse);
      var handleUsers = sinon.stub();
      userCache.getAll().then(handleUsers);
      userCache.getAll().then(handleUsers);
      this.$apply();
      expect(handleUsers.args[0][0]).toBe(handleUsers.args[1][0]);
    });
  });

  describe('#get()', function () {
    it('fetches users only once', function () {
      sinon.assert.notCalled(space.getUsers);
      userCache.get();
      sinon.assert.calledOnce(space.getUsers);
      userCache.get();
      sinon.assert.calledOnce(space.getUsers);
    });

    pit('it gets users by id', function () {
      var userResponse = [makeUser('0'), makeUser('1')];
      space.getUsers.resolves(userResponse);
      return userCache.get('1')
      .then(function (user) {
        expect(user).toEqual(userResponse[1]);
      });
    });

    pit('resuses response from call to "#getAll()"', function () {
      var userResponse = [makeUser('0'), makeUser('1')];
      space.getUsers.resolves(userResponse);
      return userCache.getAll()
      .then(function (users) {
        return userCache.get('0')
        .then(function (user) {
          expect(user).toBe(users[0]);
          sinon.assert.calledOnce(space.getUsers);
        });
      });
    });
  });
});
