'use strict';

describe('Authorization service', function () {
  var authorization;
  var worfStub;
  beforeEach(function () {
    worfStub = sinon.stub();
    module('contentful/test', function ($provide) {
      $provide.constant('worf', worfStub);
    });
    inject(function (_authorization_) {
      authorization = _authorization_;
    });
  });

  it('creates an instance', function () {
    expect(authorization).toBeDefined();
  });

  it('has null authContext', function () {
    expect(authorization.authContext).toBeNull();
  });

  it('has null spaceContext', function () {
    expect(authorization.spaceContext).toBeNull();
  });

  describe('setting a token lookup', function () {
    var tokenLookup, space, worfReturn;
    var setSpaceStub;
    beforeEach(function () {
      tokenLookup = {tokenLookup: 0};
      space = {name: 'space'};
      worfStub.returns(worfReturn);
      setSpaceStub = sinon.stub(authorization, 'setSpace');
      authorization.setTokenLookup(tokenLookup, space);
    });

    it('gets an auth context', function () {
      expect(authorization.authContext).toBe(worfReturn);
    });

    it('calls worf with tokenLookup', function () {
      expect(worfStub.calledWith(tokenLookup)).toBeTruthy();
    });

    it('sets a space', function () {
      expect(setSpaceStub.calledWith(space)).toBeTruthy();
    });
  });

  describe('setting a space', function () {
    var spaceStub, idStub;
    var spaceContext = {
      spaceStuff: 123
    };
    beforeEach(function () {
      spaceStub = sinon.stub();
      idStub = sinon.stub();
      spaceStub.returns(spaceContext);
    });

    it('sets nothing with no space', function () {
      authorization.setSpace();
      expect(authorization.spaceContext).toBeNull();
    });

    it('sets nothing with no authContext', function () {
      authorization.setSpace({});
      expect(authorization.spaceContext).toBeNull();
    });

    describe('with space and auth context', function () {
      beforeEach(function () {
        authorization.authContext = {
          space: spaceStub
        };
        authorization.setSpace({getId: idStub});
      });

      it('has a space context', function () {
        expect(authorization.spaceContext).toBe(spaceContext);
      });

      it('calls space on auth context', function () {
        expect(spaceStub.called).toBeTruthy();
      });

      it('gets an id from the space', function () {
        expect(idStub.called).toBeTruthy();
      });
    });

  });

  afterEach(inject(function ($log) {
    $log.assertEmpty();
  }));


});

describe('Can service', function () {
  var can, canStub, authStub;
  var scope;

  beforeEach(function () {
    canStub = sinon.stub();
    module('contentful/test', function ($provide) {
      authStub = {
        spaceContext: {
          can: canStub
        }
      };
      $provide.value('authorization', authStub);
    });
    inject(function (_can_, $rootScope) {
      scope = $rootScope.$new();
      can = _can_;
    });
  });

  afterEach(inject(function ($log) {
    $log.assertEmpty();
  }));

  it('returns false if no spaceContext exists', function () {
    delete authStub.spaceContext;
    expect(can()).toBe(false);
  });

  describe('if auth fails', function () {
    var canResult;
    beforeEach(function () {
      canStub.returns(false);
      canResult = can(scope, 'create', 'Entry');
    });

    it('returns false', function () {
      expect(canResult).toBe(false);
    });

    it('arguments passed along to can', function () {
      expect(canStub.calledWith('create', 'Entry')).toBeTruthy();
    });
  });

  describe('if auth succeeds', function () {
    var canResult;
    beforeEach(function () {
      canStub.returns(true);
      canResult = can(scope, 'create', 'Entry');
    });

    it('returns true', function () {
      expect(canResult).toBe(true);
    });

    it('arguments passed along to can', function () {
      expect(canStub.calledWith('create', 'Entry')).toBeTruthy();
    });
  });

  describe('if there are reasons for auth fail', function () {
    var canResult;
    beforeEach(function () {
      canStub.returns(['system_maintenance']);
      canResult = can(scope, 'create', 'Entry');
    });

    it('returns a message', function () {
      expect(canResult).toBe(false);
    });

    it('arguments passed along to can', function () {
      expect(canStub.calledWith('create', 'Entry')).toBeTruthy();
    });

    it('sets a persisstent notification on the scope', function () {
      expect(scope.persistentNotification).toBeDefined();
    });

    it('sets a can object on the scope', function () {
      expect(scope.canReasons).toBeDefined();
    });

  });

});

