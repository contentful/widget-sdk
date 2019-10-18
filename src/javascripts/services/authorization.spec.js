import authorization from './authorization.es6';
import worf from '@contentful/worf';

jest.mock('@contentful/worf', () => jest.fn(), { virtual: true });
jest.mock(
  'access_control/AccessChecker',
  () => ({
    setAuthContext: jest.fn()
  }),
  { virtual: true }
);

describe('Authorization service', () => {
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
      authContext = { space: () => spaceContext, hasSpace: () => true };
      tokenLookup = { tokenLookup: 0, spaces: [{ sys: { id: '1234' } }] };
      space = { name: 'space', getId: () => '1234' };
      enforcements = [{ sys: { id: 'E_1' } }];
      environmentId = 'master';

      worf.mockReturnValue(authContext);

      authorization.update(tokenLookup, space, enforcements, environmentId);
    });

    it('gets an auth context', () => {
      expect(authorization.authContext).toBe(authContext);
    });

    it('calls worf with tokenLookup', () => {
      expect(worf).toHaveBeenCalledWith(tokenLookup, expect.any(Object));
    });

    it('calls worf with environment data', () => {
      expect(worf.mock.calls[0][1].sys.id).toBe(environmentId);
    });

    it('sets a space', () => {
      expect(authorization.spaceContext).toBe(spaceContext);
    });

    it('does not set a space if space is null', () => {
      authorization.update(tokenLookup, null, null, environmentId);
      expect(authorization.spaceContext).toBeNull();
    });

    it('does not set a space if it is not in the token', () => {
      authContext.hasSpace = () => false;
      authorization.update(tokenLookup, space, enforcements, environmentId);
      expect(authorization.spaceContext).toBeNull();
    });

    it('patches the token with enforcements data', function() {
      const worfToken = worf.mock.calls[0][0];

      expect(worfToken.spaces[0].enforcements).toEqual(enforcements);
    });
  });
});
