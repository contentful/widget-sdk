import React from 'react';
import { mount } from 'enzyme';
import { createStore } from 'redux';
import { Provider } from 'react-redux';
import reducer from 'redux/reducer/index';
import ROUTES from 'redux/routes';
import { TEAM_SPACE_MEMBERSHIPS, TEAMS, ORG_SPACES } from 'redux/datasets';
import TeamSpaceMemberships from './TeamSpaceMemberships';
import TeamSpaceMembershipRow from './TeamSpaceMembershipRow';

const renderComponent = (
  actions,
  props = {
    showingForm: false,
    onFormDismissed: () => {}
  }
) => {
  const store = createStore(reducer);
  actions.forEach(action => store.dispatch(action));
  const wrapper = mount(
    <Provider store={store}>
      <TeamSpaceMemberships {...props} />
    </Provider>
  );
  return { store, wrapper };
};

const activeOrgId = 'testOrgId';
const activeTeamId = 'team1';

describe('TeamSpaceMemberships', () => {
  let actions;
  beforeEach(() => {
    actions = [];
  });

  describe('is at team details route', () => {
    beforeEach(() => {
      actions.push({
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

    describe('memberships were added', () => {
      beforeEach(() => {
        actions.push({
          type: 'DATASET_LOADING',
          meta: { fetched: 100 },
          payload: {
            datasets: {
              [TEAMS]: [
                {
                  name: 'Team 1',
                  sys: {
                    id: 'team1'
                  }
                },
                {
                  name: 'Different Team',
                  sys: {
                    id: 'differentTeam'
                  }
                }
              ],
              [TEAM_SPACE_MEMBERSHIPS]: [
                {
                  admin: true,
                  roles: [],
                  sys: {
                    id: 'membershipB2',
                    space: {
                      sys: {
                        type: 'Link',
                        linkType: ORG_SPACES,
                        id: 'testSpaceB2'
                      }
                    },
                    team: {
                      sys: {
                        type: 'Link',
                        linkType: TEAMS,
                        id: activeTeamId
                      }
                    }
                  }
                },
                {
                  admin: true,
                  roles: [],
                  sys: {
                    id: 'membershipB1',
                    space: {
                      sys: {
                        type: 'Link',
                        linkType: ORG_SPACES,
                        id: 'testSpaceB1'
                      }
                    },
                    team: {
                      sys: {
                        type: 'Link',
                        linkType: TEAMS,
                        id: activeTeamId
                      }
                    }
                  }
                },
                {
                  admin: true,
                  roles: [],
                  sys: {
                    id: 'membershipA',
                    space: {
                      sys: {
                        type: 'Link',
                        linkType: ORG_SPACES,
                        id: 'testSpaceA'
                      }
                    },
                    team: {
                      sys: {
                        type: 'Link',
                        linkType: TEAMS,
                        id: 'differentTeam'
                      }
                    }
                  }
                }
              ],
              [ORG_SPACES]: [
                {
                  name: 'Test Space B2',
                  sys: {
                    id: 'testSpaceB2'
                  }
                },
                {
                  name: 'Test Space B1',
                  sys: {
                    id: 'testSpaceB1'
                  }
                },
                {
                  name: 'Test Space A',
                  sys: {
                    id: 'testSpaceA'
                  }
                }
              ]
            }
          }
        });
      });

      it('should render team space memberships of current team as sorted rows', () => {
        const { wrapper } = renderComponent(actions);

        const rows = wrapper.find(TeamSpaceMembershipRow);
        expect(rows).toHaveLength(2);
        expect(rows.get(0).props.membership.sys.id).toEqual('membershipB1');
        expect(rows.get(1).props.membership.sys.id).toEqual('membershipB2');
      });
    });
  });
});
