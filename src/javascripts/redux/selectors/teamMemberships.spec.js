import reducer from 'redux/reducer/index.es6';
import { getCurrentTeamMembershipList } from './teamMemberships.es6';
import routes from '../routes.es6';
import { TEAM_MEMBERSHIPS, TEAMS, USERS } from '../datasets.es6';

const testOrgId = 'testOrg';
const testTeamId = 'testTeam';
describe('getCurrentTeamMembershipList', () => {
  describe('selected team and team memberships in state', () => {
    let state;
    beforeEach(() => {
      state = [
        {
          type: 'LOCATION_CHANGED',
          payload: {
            location: {
              pathname: routes.organization.children.teams.children.team.build({
                orgId: testOrgId,
                teamId: testTeamId
              })
            }
          }
        },
        {
          type: 'DATASET_LOADING',
          meta: { fetched: 10 },
          payload: {
            datasets: {
              [TEAMS]: [
                {
                  name: 'Test Team',
                  sys: { id: testTeamId }
                }
              ],
              [USERS]: [
                {
                  firstName: 'B',
                  lastName: 'B',
                  sys: { id: 'userB' }
                },
                {
                  firstName: 'A',
                  lastName: '1',
                  sys: { id: 'userA1' }
                },
                {
                  firstName: 'A',
                  lastName: '2',
                  sys: { id: 'userA2' }
                }
              ],
              [TEAM_MEMBERSHIPS]: [
                {
                  sys: {
                    type: 'TeamMembership',
                    id: 'teamMembershipB',
                    team: {
                      sys: {
                        type: 'Link',
                        linkType: 'Team',
                        id: testTeamId
                      }
                    },
                    user: {
                      sys: {
                        type: 'Link',
                        linkType: 'User',
                        id: 'userB'
                      }
                    }
                  }
                },
                {
                  sys: {
                    type: 'TeamMembership',
                    id: 'teamMembershipA2',
                    team: {
                      sys: {
                        type: 'Link',
                        linkType: 'Team',
                        id: testTeamId
                      }
                    },
                    user: {
                      sys: {
                        type: 'Link',
                        linkType: 'User',
                        id: 'userA2'
                      }
                    }
                  }
                },
                {
                  sys: {
                    type: 'TeamMembership',
                    id: 'teamMembershipA1',
                    team: {
                      sys: {
                        type: 'Link',
                        linkType: 'Team',
                        id: testTeamId
                      }
                    },
                    user: {
                      sys: {
                        type: 'Link',
                        linkType: 'User',
                        id: 'userA1'
                      }
                    }
                  }
                },
                {
                  sys: {
                    type: 'TeamMembership',
                    id: 'teamMembershipC',
                    team: {
                      sys: {
                        type: 'Link',
                        linkType: 'Team',
                        id: 'differentTeam'
                      }
                    },
                    user: {
                      sys: {
                        type: 'Link',
                        linkType: 'User',
                        id: 'userC'
                      }
                    }
                  }
                }
              ]
            }
          }
        }
      ].reduce((state, action) => reducer(state, action), undefined);
    });

    it('should return sorted team memberships with resolved links where possible', () => {
      const teamMemberships = getCurrentTeamMembershipList(state);
      expect(teamMemberships).toEqual([
        {
          sys: {
            type: 'TeamMembership',
            id: 'teamMembershipA1',
            team: {
              name: 'Test Team',
              sys: {
                id: testTeamId
              }
            },
            user: {
              firstName: 'A',
              lastName: '1',
              sys: {
                id: 'userA1'
              }
            }
          }
        },
        {
          sys: {
            type: 'TeamMembership',
            id: 'teamMembershipA2',
            team: {
              name: 'Test Team',
              sys: {
                id: testTeamId
              }
            },
            user: {
              firstName: 'A',
              lastName: '2',
              sys: {
                id: 'userA2'
              }
            }
          }
        },
        {
          sys: {
            type: 'TeamMembership',
            id: 'teamMembershipB',
            team: {
              name: 'Test Team',
              sys: {
                id: testTeamId
              }
            },
            user: {
              firstName: 'B',
              lastName: 'B',
              sys: {
                id: 'userB'
              }
            }
          }
        }
      ]);
    });
  });
});
