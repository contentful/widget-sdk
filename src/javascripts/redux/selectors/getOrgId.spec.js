import reducer from 'redux/reducer';
import routes from 'redux/routes.es6';
import getOrgId from './getOrgId.es6';

const testOrgId = 'testOrg';
const testSpace = 'testSpace';
describe('getOrgId', () => {
  describe('is at route that contains an org id', () => {
    let state;
    beforeEach(() => {
      state = reducer(undefined, {
        type: 'LOCATION_CHANGED',
        payload: {
          location: {
            pathname: routes.organization.children.teams.build({ orgId: testOrgId })
          }
        }
      });
    });

    it('should return the orgId from the route', () => {
      expect(getOrgId(state)).toEqual(testOrgId);
    });
  });

  describe('is at route that contains a space id', () => {
    let state;
    beforeEach(() => {
      state = reducer(undefined, {
        type: 'LOCATION_CHANGED',
        payload: {
          location: {
            pathname: routes.space.build({ spaceId: testSpace })
          }
        }
      });
    });

    it('should return no org id', () => {
      expect(getOrgId(state)).toBeNull();
    });

    describe('has token with org id for that space', () => {
      let stateWithToken;
      beforeEach(() => {
        stateWithToken = reducer(state, {
          type: 'SPACES_BY_ORG_UPDATE_FROM_TOKEN',
          payload: {
            spaces: {
              [testOrgId]: [{ sys: { id: testSpace } }, { sys: { id: 'notTheTestSpace' } }],
              otherOrgId: [{ sys: { id: 'otherSpaceId' } }]
            }
          }
        });
      });

      it('should return the orgId from the token', () => {
        expect(getOrgId(stateWithToken)).toEqual(testOrgId);
      });
    });
  });
});
