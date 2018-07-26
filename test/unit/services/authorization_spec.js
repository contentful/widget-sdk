'use strict';

describe('Authorization service', () => {
  let authorization;
  let worfStub;
  let accessChecker;

  beforeEach(function () {
    worfStub = sinon.stub();
    accessChecker = {setAuthContext: sinon.stub()};

    module('contentful/test', $provide => {
      $provide.constant('worf', worfStub);
      $provide.value('access_control/AccessChecker', accessChecker);
    });

    authorization = this.$inject('authorization');
  });

  it('creates an instance', () => {
    expect(authorization).toBeDefined();
  });

  it('has null authContext', () => {
    expect(authorization.authContext).toBeNull();
  });

  it('has null spaceContext', () => {
    expect(authorization.spaceContext).toBeNull();
  });

  describe('setting a token lookup', () => {
    let tokenLookup, space, worfReturn;
    let setSpaceStub;
    beforeEach(() => {
      tokenLookup = {tokenLookup: 0};
      space = {name: 'space'};
      worfStub.returns(worfReturn);
      setSpaceStub = sinon.stub(authorization, 'setSpace');
      authorization.setTokenLookup(tokenLookup, space);
    });

    it('gets an auth context', () => {
      expect(authorization.authContext).toBe(worfReturn);
    });

    it('calls worf with tokenLookup', () => {
      sinon.assert.calledWith(worfStub, tokenLookup);
    });

    it('sets a space', () => {
      sinon.assert.calledWith(setSpaceStub, space);
    });
  });

  describe('setting a space', () => {
    let spaceStub, idStub;
    const spaceContext = {
      spaceStuff: 123
    };
    beforeEach(() => {
      spaceStub = sinon.stub();
      idStub = sinon.stub();
      spaceStub.returns(spaceContext);
    });

    it('sets nothing with no space', () => {
      authorization.setSpace();
      expect(authorization.spaceContext).toBeNull();
    });

    it('sets nothing with no authContext', () => {
      authorization.setSpace({});
      expect(authorization.spaceContext).toBeNull();
    });

    describe('with space and auth context', () => {
      beforeEach(() => {
        authorization.authContext = {
          space: spaceStub
        };
        authorization.setSpace({getId: idStub});
      });

      it('has a space context', () => {
        expect(authorization.spaceContext).toBe(spaceContext);
      });

      it('calls space on auth context', () => {
        sinon.assert.called(spaceStub);
      });

      it('gets an id from the space', () => {
        sinon.assert.called(idStub);
      });
    });
  });
});
