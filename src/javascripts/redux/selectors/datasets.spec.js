import reducer from '../reducer';
import { getDatasets, isMissingRequiredDatasets, getDataSetsToLoad } from './datasets';
import ROUTES from '../routes';
import {
  TEAMS,
  TEAM_MEMBERSHIPS,
  USERS,
  ORG_MEMBERSHIPS,
  TEAM_SPACE_MEMBERSHIPS
} from '../datasets';
import { ORG_SPACE_ROLES, ORG_SPACES } from '../datasets';

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

      describe('missing datasets for org member were loaded, but org role is missing', () => {
        let stateWithAllDatasets;
        beforeEach(() => {
          stateWithAllDatasets = reducer(stateWithSomeDatasets, {
            type: 'DATASET_LOADING',
            meta: { fetched: Date.now() },
            payload: {
              datasets: {
                [ORG_MEMBERSHIPS]: {},
                [TEAM_SPACE_MEMBERSHIPS]: {},
                [ORG_SPACES]: {}
              }
            }
          });
        });

        it('getDatasets should return all loaded datasets', () => {
          expect(getDatasets(stateWithAllDatasets)).toEqual({
            [TEAMS]: {},
            [TEAM_MEMBERSHIPS]: {},
            [USERS]: {},
            [ORG_MEMBERSHIPS]: {},
            [TEAM_SPACE_MEMBERSHIPS]: {},
            [ORG_SPACES]: {}
          });
        });

        it('getDataSetsToLoad should contain null for dataset that depends on org role', () => {
          expect(getDataSetsToLoad(stateWithAllDatasets)).toEqual([null]);
        });

        it('isMissingRequiredDatasets should still return true', () => {
          expect(isMissingRequiredDatasets(stateWithAllDatasets)).toBe(true);
        });

        describe('org role was loaded and is member', () => {
          let stateWithMember;
          beforeEach(() => {
            stateWithMember = reducer(stateWithAllDatasets, {
              type: 'USER_UPDATE_FROM_TOKEN',
              payload: {
                user: {
                  organizationMemberships: [
                    {
                      role: 'member',
                      organization: {
                        sys: {
                          id: activeOrgId
                        }
                      }
                    }
                  ]
                }
              }
            });
          });

          it('should not be missing datasets', () => {
            expect(getDataSetsToLoad(stateWithMember)).toEqual([]);
            expect(isMissingRequiredDatasets(stateWithMember)).toBe(false);
          });
        });

        describe('org role was loaded and is admin', () => {
          let stateWithAdmin;
          beforeEach(() => {
            stateWithAdmin = reducer(stateWithAllDatasets, {
              type: 'USER_UPDATE_FROM_TOKEN',
              payload: {
                user: {
                  organizationMemberships: [
                    {
                      role: 'admin',
                      organization: {
                        sys: {
                          id: activeOrgId
                        }
                      }
                    }
                  ]
                }
              }
            });
          });

          it('should be missing ORG_SPACE_ROLES dataset', () => {
            expect(getDataSetsToLoad(stateWithAdmin)).toEqual([ORG_SPACE_ROLES]);
            expect(isMissingRequiredDatasets(stateWithAdmin)).toBe(true);
          });

          describe('last dataset need for admins was loaded', () => {
            let stateWithLastAdminDataset;
            beforeEach(() => {
              stateWithLastAdminDataset = reducer(stateWithAdmin, {
                type: 'DATASET_LOADING',
                meta: { fetched: Date.now() },
                payload: {
                  datasets: {
                    [ORG_SPACE_ROLES]: []
                  }
                }
              });
            });

            it('should not be missing datasets', () => {
              expect(getDataSetsToLoad(stateWithLastAdminDataset)).toEqual([]);
              expect(isMissingRequiredDatasets(stateWithLastAdminDataset)).toBe(false);
            });
          });
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
