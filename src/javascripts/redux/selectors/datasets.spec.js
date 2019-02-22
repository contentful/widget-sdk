import reducer from '../reducer/index.es6';
import { getDatasets, isMissingRequiredDatasets, getDataSetsToLoad } from './datasets.es6';
import ROUTES from '../routes.es6';
import { TEAMS, TEAM_MEMBERSHIPS, USERS, ORG_MEMBERSHIPS } from '../datasets.es6';

const activeOrgId = 'testOrg';
const activeTeamId = 'testTeam';

describe('datasets selectors', () => {
  describe('at location with orgId which requires datasets to be loaded', () => {
    let stateWithLocation;
    beforeEach(() => {
      stateWithLocation = reducer(undefined, {
        type: 'LOCATION_CHANGED',
        payload: {
          location: {
            pathname: ROUTES.organization.children.teams.children.team.build({
              orgId: activeOrgId,
              teamId: activeTeamId
            })
          }
        }
      });
    });

    it('getDatasets should return empty map', () => {
      expect(getDatasets(stateWithLocation)).toEqual({});
    });

    it('getDataSetsToLoad should return datasets required for location and its ancestors', () => {
      expect(getDataSetsToLoad(stateWithLocation)).toEqual(
        expect.arrayContaining([TEAMS, TEAM_MEMBERSHIPS, USERS, ORG_MEMBERSHIPS])
      );
    });

    // as long permissions were not denied, assume missing datasets are about to be loaded
    it('isMissingRequiredDatasets should return true', () => {
      expect(isMissingRequiredDatasets(stateWithLocation)).toBe(true);
    });

    describe('some datasets were loaded', () => {
      let stateWithSomeDatasets;
      beforeEach(() => {
        stateWithSomeDatasets = reducer(stateWithLocation, {
          type: 'DATASET_LOADING',
          meta: { fetched: Date.now() },
          payload: {
            datasets: {
              [TEAMS]: [],
              [TEAM_MEMBERSHIPS]: [],
              [USERS]: []
            }
          }
        });
      });

      it('getDatasets should return loaded datasets', () => {
        expect(getDatasets(stateWithSomeDatasets)).toEqual({
          [TEAMS]: {},
          [TEAM_MEMBERSHIPS]: {},
          [USERS]: {}
        });
      });

      it('isMissingRequiredDatasets should still return true', () => {
        expect(isMissingRequiredDatasets(stateWithSomeDatasets)).toBe(true);
      });

      describe('missing dataset was loaded just now', () => {
        let stateWithAllDatasets;
        beforeEach(() => {
          stateWithAllDatasets = reducer(stateWithSomeDatasets, {
            type: 'DATASET_LOADING',
            meta: { fetched: Date.now() },
            payload: {
              datasets: {
                [ORG_MEMBERSHIPS]: []
              }
            }
          });
        });

        it('getDatasets should return all loaded datasets', () => {
          expect(getDatasets(stateWithAllDatasets)).toEqual({
            [TEAMS]: {},
            [TEAM_MEMBERSHIPS]: {},
            [USERS]: {},
            [ORG_MEMBERSHIPS]: {}
          });
        });

        it('getDataSetsToLoad should return empty array', () => {
          expect(getDataSetsToLoad(stateWithAllDatasets)).toEqual([]);
        });

        it('isMissingRequiredDatasets should still return false', () => {
          expect(isMissingRequiredDatasets(stateWithAllDatasets)).toBe(false);
        });
      });

      describe('missing dataset was loaded one hour ago', () => {
        let stateWithStaleDataset;
        beforeEach(() => {
          stateWithStaleDataset = reducer(stateWithSomeDatasets, {
            type: 'DATASET_LOADING',
            meta: { fetched: Date.now() - 60 * 1000 },
            payload: {
              datasets: {
                [ORG_MEMBERSHIPS]: []
              }
            }
          });
        });

        it('getDataSetsToLoad should contain stale dataset', () => {
          expect(getDataSetsToLoad(stateWithStaleDataset)).toEqual(
            expect.arrayContaining([ORG_MEMBERSHIPS])
          );
        });
      });
    });
  });
});
