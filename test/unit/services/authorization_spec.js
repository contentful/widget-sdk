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

  describe('setting context', () => {
    let tokenLookup, space, enforcements, environmentId, authContext, spaceContext;
    beforeEach(() => {
      spaceContext = {};
      authContext = {space: () => spaceContext, hasSpace: () => true};
      tokenLookup = {tokenLookup: 0, spaces: [{sys: {id: '1234'}}]};
      space = {name: 'space', getId: () => '1234'};
      enforcements = [{sys: {id: 'E_1'}}];
      environmentId = 'master';
      worfStub.returns(authContext);
    });

    it('gets an auth context', () => {
      authorization.update(tokenLookup, space, enforcements, environmentId);
      expect(authorization.authContext).toBe(authContext);
    });

    it('calls worf with tokenLookup', () => {
      authorization.update(tokenLookup, space, enforcements, environmentId);
      sinon.assert.calledWith(worfStub, tokenLookup);
    });

    it('calls worf with environment data', () => {
      authorization.update(tokenLookup, space, enforcements, environmentId);
      expect(worfStub.firstCall.args[1].sys.id).toBe(environmentId);
    });

    it('sets a space', () => {
      authorization.update(tokenLookup, space, enforcements, environmentId);
      expect(authorization.spaceContext).toBe(spaceContext);
    });

    it('does not set a space if space is null', () => {
      authorization.update(tokenLookup, null, null, environmentId);
      expect(authorization.spaceContext).toBe(null);
    });

    it('does not set a space if it is not in the token', () => {
      authContext.hasSpace = () => false;
      authorization.update(tokenLookup, space, enforcements, environmentId);
      expect(authorization.spaceContext).toBe(null);
    });

    it('patches the token with enforcements data', function () {
      authorization.update(tokenLookup, space, enforcements, environmentId);
      const worfToken = worfStub.firstCall.args[0];

      expect(worfToken.spaces[0].enforcements).toBe(enforcements);
    });
  });
});
