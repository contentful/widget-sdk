'use strict';

describe('Authorization service', function () {
  var authorization;
  var worfStub;
  var accessChecker;

  beforeEach(function () {
    worfStub = sinon.stub();
    accessChecker = {setAuthContext: sinon.stub()};

    module('contentful/test', function ($provide) {
      $provide.constant('worf', worfStub);
      $provide.value('access_control/AccessChecker', accessChecker)
    });

    authorization = this.$inject('authorization');
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
      sinon.assert.calledWith(worfStub, tokenLookup);
    });

    it('sets a space', function () {
      sinon.assert.calledWith(setSpaceStub, space);
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
        sinon.assert.called(spaceStub);
      });

      it('gets an id from the space', function () {
        sinon.assert.called(idStub);
      });
    });
  });
});
