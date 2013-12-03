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
    inject(function (_can_) {
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

  it('returns false if auth fails', function () {
    canStub.returns(false);
    expect(can()).toBe(false);
  });

  it('returns true if auth succeeds', function () {
    canStub.returns(true);
    expect(can()).toBe(true);
  });

});

